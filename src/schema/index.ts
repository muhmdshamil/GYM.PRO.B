import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
    heightCm: z
      .number({ invalid_type_error: "heightCm must be a number" })
      .int()
      .positive()
      .optional(),
    weightKg: z
      .number({ invalid_type_error: "weightKg must be a number" })
      .positive()
      .optional(),
    place: z.string().max(100).optional(),
    bio: z.string().max(300).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('email is required'),
  password: z.string().min(8, 'password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Trainer schemas
export const trainerCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  qualification: z.string().min(2, 'Qualification is required'),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional(),
  championDetails: z.string().max(500).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export const trainerUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  qualification: z.string().min(2).optional(),
  imageUrl: z.string().url().nullable().optional(),
  championDetails: z.string().max(500).nullable().optional(),
});

