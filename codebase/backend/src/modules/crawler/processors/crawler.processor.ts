import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
  ) {
    super();
  }

  async process(job: Job<CrawlerJobData>): Promise<void> {
    const { workspaceId, seedUrl, maxPages = 30 } = job.data;
    
    console.log(`Starting crawl of ${seedUrl} for workspace ${workspaceId}`);
    
    const parsedUrl = new URL(seedUrl);
    const origin = parsedUrl.origin;

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [];

    // Sitemap Discovery & Parsing
    const tryParseSitemap = async (sitemapUrl: string) => {
      try {
        const sitemapRes = await fetch(sitemapUrl);
        if (sitemapRes.ok) {
          const xmlText = await sitemapRes.text();
          const matches = [...xmlText.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)];
          for (const match of matches) {
            if (match[1]) {
              const u = match[1].trim();
              try {
                const uObj = new URL(u);
                if (uObj.origin === origin && !visited.has(u)) {
                  queue.push({ url: u, depth: 0 });
                }
              } catch {}
            }
          }
        }
      } catch (e) {
        console.warn(`Sitemap parsing failed for ${sitemapUrl}:`, e);
      }
    };

    if (seedUrl.endsWith('.xml') || seedUrl.includes('sitemap')) {
      await tryParseSitemap(seedUrl);
    } else {
      queue.push({ url: seedUrl, depth: 0 });
      await tryParseSitemap(`${origin}/sitemap.xml`);
    }

    const disallowedPaths: string[] = [];
    try {
      const robotsRes = await fetch(`${origin}/robots.txt`);
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
        return disallowedPaths.some(p => u.pathname.startsWith(p));
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

      if (visited.has(url) || isDisallowed(url) || depth > 3) {
        continue;
      }

      visited.add(url);
      console.log(`Crawling page: ${url}`);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          continue;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          continue;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        $('script, style, nav, footer, header, iframe').remove();

        const title = $('title').text().trim() || url;
        const bodyText = $('body')
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        if (bodyText.length > 100) {
          // Check if page already indexed under this workspace (Incremental Ingestion)
          const existingFile = await this.knowledgeRepository.getFileByUrl(workspaceId, url);
          let fileDocId = '';
          
          if (existingFile) {
            fileDocId = String(existingFile._id || '');
            // Delete old vectors and chunks
            await this.qdrantService.deleteFilePoints(workspaceId, fileDocId);
            await this.knowledgeRepository.deleteChunksByFile(fileDocId);
            
            await this.knowledgeRepository.updateFileById(fileDocId, {
              status: KnowledgeProcessingStatus.PROCESSING,
              name: title,
            });
          } else {
            const fileDoc = await this.knowledgeRepository.insertFile({
              workspaceId,
              name: title,
              type: KnowledgeSourceType.WEBSITE_CRAWL,
              status: KnowledgeProcessingStatus.PROCESSING,
              url,
            });
            fileDocId = String(fileDoc._id || '');
          }

          const chunks: string[] = [];
          const chunkSize = 1000;
          const overlap = 200;
          let idx = 0;
          while (idx < bodyText.length) {
            chunks.push(bodyText.substring(idx, idx + chunkSize));
            idx += chunkSize - overlap;
          }

          const chunkDocs: Partial<KnowledgeChunk>[] = [];
          let chunkIndex = 0;
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
              sourceUrl: url,
            });

            chunkDocs.push({
              workspaceId,
              fileId: fileDocId,
              content: cleanText,
              qdrantPointId: pointId,
              metadata: { pageNumber: 1, heading: title, sourceUrl: url },
            });
            chunkIndex++;
          }

          if (chunkDocs.length > 0) {
            await this.knowledgeRepository.insertManyChunks(chunkDocs);
          }

          await this.knowledgeRepository.updateFileById(fileDocId, {
            status: KnowledgeProcessingStatus.COMPLETED,
            charCount: bodyText.length,
            chunkCount: chunkDocs.length,
          });

          pagesCrawled++;
        }

        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) {
            return;
          }

          try {
            const absoluteUrl = new URL(href, url).toString();
            const cleanUrl = absoluteUrl.split('#')[0] || '';
            
            if (cleanUrl.startsWith(origin) && !visited.has(cleanUrl)) {
              queue.push({ url: cleanUrl, depth: depth + 1 });
            }
          } catch {
            // Ignore malformed links
          }
        });

      } catch (err: unknown) {
        console.error(`Failed to crawl page ${url}:`, err);
      }
    }
  }
}
