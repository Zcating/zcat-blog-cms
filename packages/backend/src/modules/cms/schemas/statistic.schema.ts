import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const StatisticQueryDtoSchema = z.object({
  pagePath: z.string().optional(),
  startDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: '开始日期格式错误',
    })
    .optional(),
  endDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: '结束日期格式错误',
    })
    .optional(),
  page: z
    .preprocess((v) => {
      if (v === '' || v === undefined) return undefined;
      if (typeof v !== 'string' && typeof v !== 'number') return undefined;
      const n = Number.parseInt(v.toString(), 10);
      return Number.isNaN(n) ? undefined : n;
    }, z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((v) => {
      if (v === '' || v === undefined) return undefined;
      if (typeof v !== 'string' && typeof v !== 'number') return undefined;
      const n = Number.parseInt(v.toString(), 10);
      return Number.isNaN(n) ? undefined : n;
    }, z.number().int().min(1))
    .optional()
    .default(10),
  ip: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  device: z.string().optional(),
});

export const CreatePageStatisticsDtoSchema = z.object({
  pagePath: z.string().min(1),
  pageTitle: z.string().optional(),
  visitorIp: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

export class StatisticQueryDto extends createZodDto(StatisticQueryDtoSchema) {}
export class CreatePageStatisticsDto extends createZodDto(
  CreatePageStatisticsDtoSchema,
) {}
