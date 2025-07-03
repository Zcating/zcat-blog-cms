import * as fs from 'fs/promises';
import * as path from 'path';

import * as sharp from 'sharp';

import { unique } from './unique';

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
