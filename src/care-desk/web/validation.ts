import { z } from 'zod';

export const CATEGORY_NAME_MAX = 40;
export const TICKET_SUBJECT_MAX = 150;
export const TICKET_DESCRIPTION_MAX = 500;
export const CATEGORY_REQUIRED_MESSAGE = 'Please choose a category.';
export const CATEGORY_UNAVAILABLE_MESSAGE =
  'That category is no longer available. Please choose another one.';

export const ticketFormSchema = z.object({
  category: z
    .string()
    .trim()
    .max(CATEGORY_NAME_MAX, 'Category name is too long')
    .optional(),
  subject: z
    .string()
    .trim()
    .min(3, 'Please enter the subject')
    .max(TICKET_SUBJECT_MAX, 'Subject is too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Please enter the description')
    .max(TICKET_DESCRIPTION_MAX, 'Description is too long')
})

export type ticketFormValues = z.infer<typeof ticketFormSchema>;

export function validateCategory(category: string | undefined, available: string[]): string | null {
  if (available.length === 0) return null;
  return category && available.includes(category) ? null : CATEGORY_REQUIRED_MESSAGE;
}
