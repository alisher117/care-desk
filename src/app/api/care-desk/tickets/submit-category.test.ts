import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/care-desk/host/init", () => ({}));
vi.mock("@/care-desk/host/route-guards", () => ({ requireRequester: vi.fn() }));
vi.mock("@/care-desk/core", () => ({
  ticketService: { create: vi.fn() },
  categoryService: { resolveCategory: vi.fn(), listRequesterCategories: vi.fn() },
}));

import { categoryService, ticketService } from "@/care-desk/core";
import { requireRequester } from "@/care-desk/host/route-guards";
import { POST } from "@/app/api/care-desk/tickets/route";

const mockGuard = vi.mocked(requireRequester);
const mockCreate = vi.mocked(ticketService.create);
const mockResolve = vi.mocked(categoryService.resolveCategory);
const mockVisible = vi.mocked(categoryService.listRequesterCategories);

const REQUIRED = "Please choose a category.";
const UNAVAILABLE = "That category is no longer available. Please choose another one.";

const row = (name: string, requesterVisible = true) => ({
  id: `c-${name}`,
  name,
  requesterVisible,
  sortOrder: 10,
  archivedAt: null,
  createdAt: new Date(0),
});

function submit(category?: unknown) {
  return POST(
    new Request("http://localhost/api/care-desk/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Laptop",
        description: "My laptop does not boot.",
        ...(category === undefined ? {} : { category }),
      }),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue({ id: "u1", displayName: "User", email: "u1@example.invalid" });
  mockCreate.mockResolvedValue({ id: "t-1", number: 1 } as never);
  mockVisible.mockResolvedValue([row("IT"), row("Finance")]);
});

describe("POST /api/care-desk/tickets — category rules for requesters", () => {
  test("visible categories exist and none given -> 400 asking to choose", async () => {
    const res = await submit();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid", issues: { category: [REQUIRED] } });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("blank category counts as none given", async () => {
    const res = await submit("   ");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid", issues: { category: [REQUIRED] } });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  test.each(["unknown", "archived", "hidden"] as const)(
    "%s category -> 400 with the unavailable message, nothing written",
    async (reason) => {
      mockResolve.mockResolvedValue({ reason });
      const res = await submit("Billing");
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid", issues: { category: [UNAVAILABLE] } });
      expect(mockResolve).toHaveBeenCalledWith("Billing", { requesterOnly: true });
      expect(mockCreate).not.toHaveBeenCalled();
    },
  );

  test("no visible categories and none given -> accepted with a NULL category", async () => {
    mockVisible.mockResolvedValue([]);
    const res = await submit();
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
  });

  test("no visible categories but a category given -> still rejected, never silently dropped", async () => {
    mockVisible.mockResolvedValue([]);
    mockResolve.mockResolvedValue({ reason: "hidden" });
    const res = await submit("HR");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("valid category -> writes the stored name, not the request casing", async () => {
    mockResolve.mockResolvedValue({ category: row("IT") });
    const res = await submit("it");
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ category: "IT" }));
  });
});
