import { categoryRepo } from "../db/repositories/category-repo";
import type { Category } from "../domain/types";

const UNIQUE_VIOLATION = "23505";

export type CategoryRejection = "unknown" | "archived" | "hidden";

export type CategoryResolution =
  | { category: Category; reason?: never }
  | { category?: never; reason: CategoryRejection };

export class CategoryExistsError extends Error {
  constructor(public readonly categoryName: string) {
    super(`Care Desk: category "${categoryName}" already exists`);
    this.name = "CategoryExistsError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    return categoryRepo.listAll();
  },

  async listRequesterCategories(): Promise<Category[]> {
    return categoryRepo.listRequesterVisible();
  },

  async getCategory(id: string): Promise<Category | null> {
    return categoryRepo.findById(id);
  },

  async resolveCategory(
    rawName: string,
    options: { requesterOnly: boolean },
  ): Promise<CategoryResolution> {
    const category = await categoryRepo.findByName(rawName.trim());
    if (!category) return { reason: "unknown" };
    if (category.archivedAt) return { reason: "archived" };
    if (options.requesterOnly && !category.requesterVisible) return { reason: "hidden" };
    return { category };
  },

  async createCategory(rawName: string): Promise<Category> {
    const name = rawName.trim().replace(/\s+/g, " ");
    const existing = await categoryRepo.findByName(name);
    if (existing && !existing.archivedAt) throw new CategoryExistsError(existing.name);
    if (existing) {
      const restored = await categoryRepo.update(existing.id, { archivedAt: null });
      if (!restored) throw new Error(`Care Desk: category ${existing.id} not found`);
      return restored;
    }
    try {
      return await categoryRepo.create(name, false);
    } catch (err) {
      if (isUniqueViolation(err)) throw new CategoryExistsError(name);
      throw err;
    }
  },

  async setRequesterVisible(id: string, requesterVisible: boolean): Promise<Category> {
    const category = await categoryRepo.update(id, { requesterVisible });
    if (!category) throw new Error(`Care Desk: category ${id} not found`);
    return category;
  },

  async archiveCategory(id: string): Promise<Category> {
    const category = await categoryRepo.update(id, { archivedAt: new Date() });
    if (!category) throw new Error(`Care Desk: category ${id} not found`);
    return category;
  },
};
