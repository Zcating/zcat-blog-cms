import { z } from 'zod';

const ContactSchema = z
  .object({
    email: z.string().catch(''),
    github: z.string().catch(''),
  })
  .catch({ email: '', github: '' });

export const UserInfoSchema = z.object({
  name: z.string(),
  occupation: z.string(),
  abstract: z.string(),
  aboutMe: z.string(),
  avatar: z.string(),
  contact: ContactSchema,
});

export type UserInfo = z.infer<typeof UserInfoSchema>;
