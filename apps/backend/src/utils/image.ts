// import { FileInterceptor } from '@nestjs/platform-express';

// import * as fs from 'fs/promises';
// import * as path from 'path';

// import { memoryStorage } from 'multer';
// import * as sharp from 'sharp';

// import { THUMBNAIL_PATH, UPLOAD_PATH } from './constant';
// import { unique } from './unique';

// interface CreateStandardImageParams {
//   uploadPath?: string;
//   thumbnailPath?: string;
//   file: Express.Multer.File | null;
// }

// interface StandardImageUrlResult {
//   baseFilePath: string;
//   thumbnailFilePath: string;
// }

// export async function createImageUrls(file?: Express.Multer.File | null) {
//   if (!file) {
//     return null;
//   }
//   return createStandardImage({
//     file,
//   });
// }

// export async function createStandardImage(
//   params: CreateStandardImageParams,
// ): Promise<StandardImageUrlResult | null> {
//   if (!params.file) {
//     return null;
//   }

//   const uploadPath = params.uploadPath || UPLOAD_PATH;
//   const thumbnailPath = params.thumbnailPath || THUMBNAIL_PATH;

//   const baseFilename = await createBaseImage(
//     uploadPath,
//     params.file.originalname,
//     params.file.buffer,
//   );

//   const thumbnailFilename = await createThumbnail(
//     thumbnailPath,
//     baseFilename,
//     params.file.buffer,
//   );

//   return {
//     baseFilePath: path.join(uploadPath, baseFilename).replace(/\\/g, '/'),
//     thumbnailFilePath: path
//       .join(thumbnailPath, thumbnailFilename)
//       .replace(/\\/g, '/'),
//   };
// }

// export async function createBaseImage(
//   dir: string,
//   filename: string,
//   buffer: Buffer,
// ) {
//   const uniqueSuffix = unique();
//   const ext = path.extname(filename);
//   const imageFilename = `base_${uniqueSuffix}${ext}`;

//   await saveImage(dir, imageFilename, buffer);

//   return imageFilename;
// }

// export async function createThumbnail(
//   dir: string,
//   filename: string,
//   buffer: Buffer,
// ) {
//   const ext = path.extname(filename);
//   const nameWithoutExt = path.basename(filename, ext);
//   const thumbnailFilename = `${nameWithoutExt}.thumbnail${ext}`;

//   // 确保缩略图目录存在
//   await fs.mkdir(dir, { recursive: true });
//   // 生成缩略图 (300x300像素)
//   const thumbnailBuffer = await sharp(buffer)
//     .resize(300, 300, {
//       fit: 'cover',
//       position: 'center',
//     })
//     .jpeg({ quality: 80 })
//     .toBuffer();

//   await saveImage(dir, thumbnailFilename, thumbnailBuffer);

//   return thumbnailFilename;
// }

// export function ImageInterceptor(fieldName: string) {
//   return FileInterceptor(fieldName, {
//     dest: UPLOAD_PATH,
//     storage: memoryStorage(),
//     fileFilter: (req, file, callback) => {
//       if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
//         return callback(new Error('只支持图片文件格式'), false);
//       }
//       callback(null, true);
//     },
//     limits: {
//       fileSize: 20 * 1024 * 1024, // 20MB
//     },
//   });
// }

// /**
//  * 将图片保存到指定目录，如果目录不存在则自动创建
//  * @param targetDir 目标目录路径
//  * @param filename 文件名
//  * @param buffer 图片缓冲区数据
//  * @param options 可选参数
//  * @returns 保存的文件路径
//  */
// export async function saveImage(
//   targetDir: string,
//   filename: string,
//   buffer: Buffer,
// ): Promise<string> {
//   // 确保目录存在，如果不存在则递归创建
//   await fs.mkdir(targetDir, { recursive: true });

//   const filePath = path.join(targetDir, filename);

//   // 写入文件
//   await fs.writeFile(filePath, buffer);

//   return filePath;
// }
