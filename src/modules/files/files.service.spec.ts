import { BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';

describe('FilesService', () => {
  const service = new FilesService();

  it('requires a file', async () => {
    await expect(service.storeImage(undefined, 1024, 'test')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported MIME types before writing', async () => {
    await expect(service.storeImage({
      originalname: 'payload.txt',
      mimetype: 'text/plain',
      size: 4,
      buffer: Buffer.from('test'),
    }, 1024, 'test')).rejects.toThrow('Unsupported image type');
  });

  it('rejects oversized files before writing', async () => {
    await expect(service.storeImage({
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 2048,
      buffer: Buffer.alloc(0),
    }, 1024, 'test')).rejects.toThrow('File is too large');
  });
});
