import * as fs from 'fs/promises';
import * as path from 'path';

import * as sharp from 'sharp';

import { unique } from './unique';

interface CreateStandardImageParams {
  uploadPath: string;
  thumbnailPath: string;
  file: Express.Multer.File | null;
}

interface StandardImageUrlResult {
  baseFilePath: string;
  thumbnailFilePath: string;
}
export async function createStandardImage(
  params: CreateStandardImageParams,
): Promise<StandardImageUrlResult | null> {
  if (!params.file) {
    return null;
  }

  const baseFilename = await createBaseImage(
    params.uploadPath,
    params.file.originalname,
    params.file.buffer,
  );

  const thumbnailFilename = await createThumbnail(
    params.thumbnailPath,
    baseFilename,
    params.file.buffer,
  );

  return {
    baseFilePath: path
      .join(params.uploadPath, baseFilename)
      .replace(/\\/g, '/'),
    thumbnailFilePath: path
      .join(params.thumbnailPath, thumbnailFilename)
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
