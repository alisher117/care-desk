import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../db/repositories/category-repo", () => ({
  categoryRepo: {
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

import { categoryRepo } from "../db/repositories/category-repo";
import { CategoryExistsError, categoryService } from "./category";

const mockFindByName = vi.mocked(categoryRepo.findByName);
const mockCreate = vi.mocked(categoryRepo.create);
const mockUpdate = vi.mocked(categoryRepo.update);

const category = (
  name: string,
  { archivedAt = null, requesterVisible = true }: { archivedAt?: Date | null; requesterVisible?: boolean } = {},
) => ({
  id: `c-${name}`,
  name,
  requesterVisible,
  sortOrder: 10,
  archivedAt,
  createdAt: new Date(0),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("categoryService.createCategory", () => {
  test("creates a new category hidden from the widget, with a normalised name", async () => {
    mockFindByName.mockResolvedValue(null);
    mockCreate.mockImplementation(async (name, requesterVisible) => category(name, { requesterVisible }));

    const created = await categoryService.createCategory("  Field   Ops ");

    expect(mockFindByName).toHaveBeenCalledWith("Field Ops");
    expect(mockCreate).toHaveBeenCalledWith("Field Ops", false);
    expect(created.name).toBe("Field Ops");
    expect(created.requesterVisible).toBe(false);
  });

  test("rejects a duplicate of an active category regardless of case", async () => {
    mockFindByName.mockResolvedValue(category("IT"));

    await expect(categoryService.createCategory("it")).rejects.toBeInstanceOf(CategoryExistsError);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("restores an archived category and keeps its previous widget visibility", async () => {
    mockFindByName.mockResolvedValue(category("HR", { archivedAt: new Date(1), requesterVisible: false }));
    mockUpdate.mockResolvedValue(category("HR", { requesterVisible: false }));

    const restored = await categoryService.createCategory("HR");

    expect(mockUpdate).toHaveBeenCalledWith("c-HR", { archivedAt: null });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(restored.archivedAt).toBeNull();
    expect(restored.requesterVisible).toBe(false);
  });

  test("maps a unique violation on insert to CategoryExistsError", async () => {
    mockFindByName.mockResolvedValue(null);
    mockCreate.mockRejectedValue(Object.assign(new Error("duplicate key"), { code: "23505" }));

    await expect(categoryService.createCategory("Legal")).rejects.toBeInstanceOf(CategoryExistsError);
  });

  test("lets other insert errors through", async () => {
    mockFindByName.mockResolvedValue(null);
    mockCreate.mockRejectedValue(Object.assign(new Error("connection lost"), { code: "08006" }));

    await expect(categoryService.createCategory("Legal")).rejects.toThrow("connection lost");
  });
});

describe("categoryService.resolveCategory", () => {
  test("trims the input and returns the stored row", async () => {
    mockFindByName.mockResolvedValue(category("IT"));

    const resolved = await categoryService.resolveCategory("  it ", { requesterOnly: true });

    expect(mockFindByName).toHaveBeenCalledWith("it");
    expect(resolved.category?.name).toBe("IT");
  });

  test("unknown name", async () => {
    mockFindByName.mockResolvedValue(null);

    expect(await categoryService.resolveCategory("Nope", { requesterOnly: false })).toEqual({
      reason: "unknown",
    });
  });

  test("archived name is rejected for requesters and operators", async () => {
    mockFindByName.mockResolvedValue(category("HR", { archivedAt: new Date(1) }));

    expect(await categoryService.resolveCategory("HR", { requesterOnly: true })).toEqual({
      reason: "archived",
    });
    expect(await categoryService.resolveCategory("HR", { requesterOnly: false })).toEqual({
      reason: "archived",
    });
  });

  test("hidden category is rejected for requesters only", async () => {
    mockFindByName.mockResolvedValue(category("Billing", { requesterVisible: false }));

    expect(await categoryService.resolveCategory("Billing", { requesterOnly: true })).toEqual({
      reason: "hidden",
    });
    const forOperator = await categoryService.resolveCategory("Billing", { requesterOnly: false });
    expect(forOperator.category?.name).toBe("Billing");
  });
});
