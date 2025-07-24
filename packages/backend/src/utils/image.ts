import { FileInterceptor } from '@nestjs/platform-express';

import * as fs from 'fs/promises';
import * as path from 'path';

import { memoryStorage } from 'multer';
import * as sharp from 'sharp';

import { THUMBNAIL_PATH, UPLOAD_PATH } from './constant';
import { unique } from './unique';

interface CreateStandardImageParams {
  uploadPath?: string;
  thumbnailPath?: string;
  file: Express.Multer.File | null;
}

interface StandardImageUrlResult {
  baseFilePath: string;
  thumbnailFilePath: string;
}

export async function createImageUrls(file?: Express.Multer.File | null) {
  if (!file) {
    return null;
  }
  return createStandardImage({
    file,
  });
}

export async function createStandardImage(
  params: CreateStandardImageParams,
): Promise<StandardImageUrlResult | null> {
  if (!params.file) {
    return null;
  }

  const uploadPath = params.uploadPath || UPLOAD_PATH;
  const thumbnailPath = params.thumbnailPath || THUMBNAIL_PATH;

  const baseFilename = await createBaseImage(
    uploadPath,
    params.file.originalname,
    params.file.buffer,
  );

  const thumbnailFilename = await createThumbnail(
    thumbnailPath,
    baseFilename,
    params.file.buffer,
  );

  return {
    baseFilePath: path.join(uploadPath, baseFilename).replace(/\\/g, '/'),
    thumbnailFilePath: path
      .join(thumbnailPath, thumbnailFilename)
      .replace(/\\/g, '/'),
  };
}

export async function createBaseImage(
  dir: string,
  filename: string,
  buffer: Buffer,
) {
  const uniqueSuffix = unique();
  const ext = path.extname(filename);
  const imageFilename = `base_${uniqueSuffix}${ext}`;
  const imagePath = path.join(dir, imageFilename);
  await fs.writeFile(imagePath, buffer);

  return imageFilename;
}

export async function createThumbnail(
  dir: string,
  filename: string,
  buffer: Buffer,
) {
  const thumbnailFilename = `thumb_${filename}`;
  const thumbnailPath = path.join(dir, thumbnailFilename);

  // 确保缩略图目录存在
  await fs.mkdir(dir, { recursive: true });
  // 生成缩略图 (300x300像素)
  await sharp(buffer)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return thumbnailFilename;
}

export function ImageInterceptor(fieldName: string) {
  return FileInterceptor(fieldName, {
    dest: UPLOAD_PATH,
    storage: memoryStorage(),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('只支持图片文件格式'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });
}
