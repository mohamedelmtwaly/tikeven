import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(3, "Name is too short"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password too short"),
    confirm: z.string(),
    role: z.enum(["organizer", "attendee"]),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
