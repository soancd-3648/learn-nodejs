import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { UploadedFile } from '../../common/interfaces/uploaded-file.interface';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class FilesService {
  async storeImage(file: UploadedFile | undefined, maxSize: number, folder: string) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) throw new BadRequestException('Unsupported image type');
    if (file.size > maxSize) throw new BadRequestException('File is too large');
    if (!this.hasValidSignature(file)) throw new BadRequestException('Image content does not match its MIME type');

    const extension = EXTENSIONS[file.mimetype];
    const fileName = `${randomUUID()}${extension}`;
    const relativeDirectory = join('uploads', folder);
    await mkdir(relativeDirectory, { recursive: true });
    await writeFile(join(relativeDirectory, fileName), file.buffer, { flag: 'wx' });
    return { fileId: fileName, url: `/${relativeDirectory}/${fileName}` };
  }

  private hasValidSignature(file: UploadedFile): boolean {
    if (file.mimetype === 'image/jpeg') {
      return file.buffer.length >= 3 && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    }
    if (file.mimetype === 'image/png') {
      return file.buffer.length >= 8 && file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    return file.buffer.length >= 12
      && file.buffer.toString('ascii', 0, 4) === 'RIFF'
      && file.buffer.toString('ascii', 8, 12) === 'WEBP';
  }
}
