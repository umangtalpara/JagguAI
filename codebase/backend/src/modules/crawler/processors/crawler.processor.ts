import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeRepository } from '../../knowledge/knowledge.repository';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import { KnowledgeSourceType, KnowledgeProcessingStatus } from '../../knowledge/entities/knowledge-file.entity';
import { KnowledgeChunk } from '../../knowledge/entities/knowledge-chunk.entity';

interface CrawlerJobData {
  workspaceId: string;
  seedUrl: string;
  maxPages?: number;
}

@Processor('web-crawling')
@Injectable()
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);

  private readonly requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (jagguAI-Crawler/1.0)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
  ) {
    super();
  }

  private normalizeHost(hostname: string): string {
    return hostname.replace(/^www\./i, '').toLowerCase();
  }

  private cleanUrl(urlStr: string): string {
    return (urlStr.split('#')[0] || '').trim();
  }

  private extractStructuredText($: cheerio.CheerioAPI): string[] {
    const sections: string[] = [];

    // 1. Meta tags (Description, Keywords, OpenGraph)
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
    if (metaDesc && metaDesc.trim()) {
      sections.push(`Page Description: ${metaDesc.trim()}`);
    }

    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords && metaKeywords.trim()) {
      sections.push(`Keywords: ${metaKeywords.trim()}`);
    }

    // 2. JSON-LD structured data (FAQPage, Organization, Product, WebSite, etc.)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html();
        if (!raw) return;
        const data = JSON.parse(raw);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item.name) sections.push(`Name: ${item.name}`);
          if (item.description) sections.push(`Description: ${item.description}`);

          // Extract FAQs if present
          if (item['@type'] === 'FAQPage' && Array.isArray(item.mainEntity)) {
            for (const faq of item.mainEntity) {
              if (faq.name && faq.acceptedAnswer?.text) {
                sections.push(`Question: ${faq.name}\nAnswer: ${faq.acceptedAnswer.text}`);
              }
            }
          }

          // Extract Organization/Product details
          if (item.offers?.description) {
            sections.push(`Offers: ${item.offers.description}`);
          }
        }
      } catch {
        // Ignore JSON-LD parse errors
      }
    });

    return sections;
  }

  async process(job: Job<CrawlerJobData>): Promise<void> {
    const { workspaceId, seedUrl, maxPages = 10 } = job.data;
    this.logger.log(`Starting crawl of ${seedUrl} for workspace ${workspaceId}`);

    let parsedSeed: URL;
    try {
      parsedSeed = new URL(seedUrl);
    } catch (err: any) {
      this.logger.error(`Invalid seed URL: ${seedUrl}`, err);
      await this.knowledgeRepository.insertFile({
        workspaceId,
        name: seedUrl,
        type: KnowledgeSourceType.WEBSITE_CRAWL,
        status: KnowledgeProcessingStatus.FAILED,
        url: seedUrl,
        error: `Invalid URL format: ${seedUrl}`,
      });
      return;
    }

    const baseHost = this.normalizeHost(parsedSeed.hostname);
    const origin = parsedSeed.origin;

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [];

    // Sitemap Discovery & Parsing
    const tryParseSitemap = async (sitemapUrl: string) => {
      try {
        const sitemapRes = await fetch(sitemapUrl, {
          headers: this.requestHeaders,
          signal: AbortSignal.timeout(10000),
        });
        if (sitemapRes.ok) {
          const xmlText = await sitemapRes.text();
          const matches = [...xmlText.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)];
          for (const match of matches) {
            if (match[1]) {
              const u = this.cleanUrl(match[1]);
              try {
                const uObj = new URL(u);
                if (this.normalizeHost(uObj.hostname) === baseHost && !visited.has(u)) {
                  queue.push({ url: u, depth: 0 });
                }
              } catch { }
            }
          }
        }
      } catch (e) {
        this.logger.warn(`Sitemap parsing failed for ${sitemapUrl}: ${e instanceof Error ? e.message : e}`);
      }
    };

    if (seedUrl.endsWith('.xml') || seedUrl.includes('sitemap')) {
      await tryParseSitemap(seedUrl);
    } else {
      queue.push({ url: seedUrl, depth: 0 });
      await tryParseSitemap(`${origin}/sitemap.xml`);
    }

    // Parse robots.txt
    const disallowedPaths: string[] = [];
    try {
      const robotsRes = await fetch(`${origin}/robots.txt`, {
        headers: this.requestHeaders,
        signal: AbortSignal.timeout(6000),
      });
      if (robotsRes.ok) {
        const text = await robotsRes.text();
        const lines = text.split('\n');
        let userAgentMatch = false;
        for (const line of lines) {
          const clean = line.trim().toLowerCase();
          if (clean.startsWith('user-agent: *')) {
            userAgentMatch = true;
          } else if (clean.startsWith('user-agent:')) {
            userAgentMatch = false;
          }
          if (userAgentMatch && clean.startsWith('disallow:')) {
            const path = line.substring(9).trim();
            if (path) {
              disallowedPaths.push(path);
            }
          }
        }
      }
    } catch {
      // Ignore robots.txt errors
    }

    const isDisallowed = (urlStr: string): boolean => {
      try {
        const u = new URL(urlStr);
        return disallowedPaths.some((p) => u.pathname.startsWith(p));
      } catch {
        return true;
      }
    };

    let pagesCrawled = 0;

    while (queue.length > 0 && pagesCrawled < maxPages) {
      const currentItem = queue.shift();
      if (!currentItem) {
        continue;
      }

      const { url, depth } = currentItem;
      const cleanTargetUrl = this.cleanUrl(url);

      if (visited.has(cleanTargetUrl) || isDisallowed(cleanTargetUrl) || depth > 3) {
        continue;
      }

      visited.add(cleanTargetUrl);
      this.logger.log(`Crawling page: ${cleanTargetUrl}`);

      // Ensure record in DB for visual status feedback
      const existingFile = await this.knowledgeRepository.getFileByUrl(workspaceId, cleanTargetUrl);
      let fileDocId = '';

      if (existingFile) {
        fileDocId = String(existingFile._id || '');
        await this.qdrantService.deleteFilePoints(workspaceId, fileDocId);
        await this.knowledgeRepository.deleteChunksByFile(fileDocId);
        await this.knowledgeRepository.updateFileById(fileDocId, {
          status: KnowledgeProcessingStatus.PROCESSING,
          error: '',
        });
      } else {
        const fileDoc = await this.knowledgeRepository.insertFile({
          workspaceId,
          name: cleanTargetUrl,
          type: KnowledgeSourceType.WEBSITE_CRAWL,
          status: KnowledgeProcessingStatus.PROCESSING,
          url: cleanTargetUrl,
          error: '',
        });
        fileDocId = String(fileDoc._id || '');
      }

      try {
        const res = await fetch(cleanTargetUrl, {
          headers: this.requestHeaders,
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          await this.knowledgeRepository.updateFileById(fileDocId, {
            status: KnowledgeProcessingStatus.FAILED,
            error: `HTTP request failed: status ${res.status} (${res.statusText})`,
          });
          continue;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          await this.knowledgeRepository.updateFileById(fileDocId, {
            status: KnowledgeProcessingStatus.FAILED,
            error: `Unsupported content-type: ${contentType}. Expected text/html.`,
          });
          continue;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Extract structured info (JSON-LD, meta tags) before stripping tags
        const structuredSections = this.extractStructuredText($);

        // Strip non-content elements
        $('script, style, iframe, noscript, svg').remove();

        const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || cleanTargetUrl;
        const bodyText = $('body')
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        const fullExtractedContent = (structuredSections.join('\n\n') + '\n\n' + bodyText).trim();

        if (fullExtractedContent.length < 30) {
          await this.knowledgeRepository.updateFileById(fileDocId, {
            name: title,
            status: KnowledgeProcessingStatus.FAILED,
            error: 'No readable text content found on page (client-side rendered SPA without static text or blocked content).',
          });
          continue;
        }

        // Chunking
        const chunks: string[] = [];
        const chunkSize = 1000;
        const overlap = 200;
        let idx = 0;
        while (idx < fullExtractedContent.length) {
          chunks.push(fullExtractedContent.substring(idx, idx + chunkSize));
          idx += chunkSize - overlap;
        }

        const chunkDocs: Partial<KnowledgeChunk>[] = [];
        for (const chunkText of chunks) {
          const cleanText = chunkText.trim();
          if (cleanText.length === 0) {
            continue;
          }

          const vector = await this.embeddingsService.generateEmbedding(cleanText);
          const pointId = uuidv4();

          await this.qdrantService.indexChunk(workspaceId, pointId, vector, {
            workspaceId,
            fileId: fileDocId,
            content: cleanText,
            sourceUrl: cleanTargetUrl,
          });

          chunkDocs.push({
            workspaceId,
            fileId: fileDocId,
            content: cleanText,
            qdrantPointId: pointId,
            metadata: { pageNumber: 1, heading: title, sourceUrl: cleanTargetUrl },
          });
        }

        if (chunkDocs.length > 0) {
          await this.knowledgeRepository.insertManyChunks(chunkDocs);
        }

        await this.knowledgeRepository.updateFileById(fileDocId, {
          name: title,
          status: KnowledgeProcessingStatus.COMPLETED,
          charCount: fullExtractedContent.length,
          chunkCount: chunkDocs.length,
          error: '',
        });

        pagesCrawled++;

        // Discover internal links
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) {
            return;
          }

          try {
            const absoluteUrl = new URL(href, cleanTargetUrl).toString();
            const cleanChildUrl = this.cleanUrl(absoluteUrl);
            const childObj = new URL(cleanChildUrl);

            if (this.normalizeHost(childObj.hostname) === baseHost && !visited.has(cleanChildUrl)) {
              queue.push({ url: cleanChildUrl, depth: depth + 1 });
            }
          } catch {
            // Ignore malformed links
          }
        });

      } catch (err: any) {
        this.logger.error(`Failed to crawl page ${cleanTargetUrl}:`, err);
        await this.knowledgeRepository.updateFileById(fileDocId, {
          status: KnowledgeProcessingStatus.FAILED,
          error: err instanceof Error ? err.message : 'Crawler extraction failed',
        });
      }
    }
  }
}

