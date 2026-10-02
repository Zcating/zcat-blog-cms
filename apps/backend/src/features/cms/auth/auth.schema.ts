import z from 'zod';

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const registerDtoSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerDtoSchema>;
