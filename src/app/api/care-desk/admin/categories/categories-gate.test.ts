import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/care-desk/host/init", () => ({}));
vi.mock("@/care-desk/host/route-guards", () => ({
  requireOperator: vi.fn(),
  operatorDenied: vi.fn(async () => Response.json({ error: "forbidden" }, { status: 403 })),
}));
vi.mock("@/care-desk/core", () => ({
  categoryService: {
    listCategories: vi.fn(),
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    setRequesterVisible: vi.fn(),
    archiveCategory: vi.fn(),
  },
  CategoryExistsError: class CategoryExistsError extends Error {},
}));

import { categoryService } from "@/care-desk/core";
import { requireOperator } from "@/care-desk/host/route-guards";
import { GET, POST } from "@/app/api/care-desk/admin/categories/route";
import { DELETE, PATCH } from "@/app/api/care-desk/admin/categories/[id]/route";
import { operatorContext as context } from "../test-context";

const mockGuard = vi.mocked(requireOperator);
const mockList = vi.mocked(categoryService.listCategories);
const mockGet = vi.mocked(categoryService.getCategory);
const mockCreate = vi.mocked(categoryService.createCategory);
const mockSetVisible = vi.mocked(categoryService.setRequesterVisible);
const mockArchive = vi.mocked(categoryService.archiveCategory);

const CATEGORY_ID = "00000000-0000-4000-8000-000000000001";
const ENDPOINT = "http://localhost/api/care-desk/admin/categories";
const DENIED = { error: "category changes require admin" };

const row = {
  id: CATEGORY_ID,
  name: "IT",
  requesterVisible: true,
  sortOrder: 40,
  archivedAt: null,
  createdAt: new Date(0),
};

function list() {
  return GET(new Request(ENDPOINT));
}

function create(rawBody: string) {
  return POST(
    new Request(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
    }),
  );
}

function toggle(body: Record<string, unknown>) {
  return PATCH(
    new Request(`${ENDPOINT}/${CATEGORY_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: CATEGORY_ID }) },
  );
}

function archive() {
  return DELETE(new Request(`${ENDPOINT}/${CATEGORY_ID}`, { method: "DELETE" }), {
    params: Promise.resolve({ id: CATEGORY_ID }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue([row]);
  mockGet.mockResolvedValue(row);
  mockCreate.mockResolvedValue(row);
  mockSetVisible.mockResolvedValue(row);
  mockArchive.mockResolvedValue(row);
});

describe("category writes are admin-only", () => {
  test("operator POST -> 403, nothing created", async () => {
    mockGuard.mockResolvedValue(context(false));
    const res = await create(JSON.stringify({ name: "Legal" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(DENIED);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("operator POST with an unparseable body -> still 403, the guard runs before parsing", async () => {
    mockGuard.mockResolvedValue(context(false));
    const res = await create("not json");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(DENIED);
  });

  test("operator PATCH -> 403 before any lookup", async () => {
    mockGuard.mockResolvedValue(context(false));
    const res = await toggle({ requesterVisible: false });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(DENIED);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSetVisible).not.toHaveBeenCalled();
  });

  test("operator DELETE -> 403 before any lookup", async () => {
    mockGuard.mockResolvedValue(context(false));
    const res = await archive();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(DENIED);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockArchive).not.toHaveBeenCalled();
  });

  test("admin POST -> 201", async () => {
    mockGuard.mockResolvedValue(context(true));
    const res = await create(JSON.stringify({ name: "Legal" }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith("Legal");
  });

  test("admin POST with an unparseable body -> 400, parsing happens after the guard", async () => {
    mockGuard.mockResolvedValue(context(true));
    const res = await create("not json");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("admin PATCH -> 200", async () => {
    mockGuard.mockResolvedValue(context(true));
    const res = await toggle({ requesterVisible: false });
    expect(res.status).toBe(200);
    expect(mockSetVisible).toHaveBeenCalledWith(CATEGORY_ID, false);
  });

  test("admin DELETE -> 200", async () => {
    mockGuard.mockResolvedValue(context(true));
    const res = await archive();
    expect(res.status).toBe(200);
    expect(mockArchive).toHaveBeenCalledWith(CATEGORY_ID);
  });
});

describe("category reads stay operator-level", () => {
  test("operator GET /admin/categories -> 200 with every category", async () => {
    mockGuard.mockResolvedValue(context(false));
    const res = await list();
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(1);
  });
});

describe("not an operator at all -> 403 forbidden on every handler", () => {
  test.each([
    ["GET", () => list()],
    ["POST", () => create(JSON.stringify({ name: "Legal" }))],
    ["PATCH", () => toggle({ requesterVisible: false })],
    ["DELETE", () => archive()],
  ])("%s", async (_method, call) => {
    mockGuard.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
