import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(__dirname, '../../../../uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: { buffer: Buffer; originalname: string }): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname);
    const key = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, key);

    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/api/v1/storage/files/${key}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async readFile(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${key} not found`);
    }
    return fs.readFileSync(filePath);
  }
}
