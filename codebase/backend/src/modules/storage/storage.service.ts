import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client?: S3Client;
  private readonly bucketName?: string;
  private readonly region?: string;
  private readonly uploadDir = path.join(__dirname, '../../../../uploads');

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (accessKeyId && secretAccessKey && this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`AWS S3 Storage configured -> Bucket: ${this.bucketName} | Region: ${this.region}`);
    } else {
      this.logger.warn(`AWS S3 credentials not fully provided. Falling back to local disk storage in ${this.uploadDir}`);
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(file: { buffer: Buffer; originalname: string; mimetype?: string }): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname);
    const key = `documents/${uuidv4()}${ext}`;

    if (this.s3Client && this.bucketName) {
      this.logger.log(`Uploading file to S3: ${key} (${file.buffer.length} bytes)`);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      });

      await this.s3Client.send(command);
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      this.logger.log(`File successfully uploaded to S3: ${url}`);

      return { url, key };
    }

    // Local fallback
    const localKey = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, localKey);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/api/v1/storage/files/${localKey}`,
      key: localKey,
    };
  }

  async deleteFile(key: string): Promise<void> {
    if (this.s3Client && this.bucketName && key.startsWith('documents/')) {
      this.logger.log(`Deleting file from S3: ${key}`);
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return;
    }

    // Local fallback
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async readFile(key: string): Promise<Buffer> {
    if (this.s3Client && this.bucketName && key.startsWith('documents/')) {
      this.logger.log(`Reading file from S3: ${key}`);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        throw new Error(`Empty response body when fetching S3 file: ${key}`);
      }

      // Convert stream to Buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    // Local fallback
    const filePath = path.join(this.uploadDir, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${key} not found`);
    }
    return fs.readFileSync(filePath);
  }
}
