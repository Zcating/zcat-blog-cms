import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const registerDtoSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string(),
});

export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerDtoSchema) {}
