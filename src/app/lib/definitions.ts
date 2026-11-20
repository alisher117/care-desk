import * as z from "zod";

export const SetupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Please enter a valid email" })),
  password: z
    .string()
    .min(8, { error: "The password must be 8 characters long" })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      error: "Contain at least one special character.",
    }),
});

export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
      values?: { name?: string; email?: string };
    }
  | undefined;
