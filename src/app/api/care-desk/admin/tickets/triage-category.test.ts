import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/care-desk/host/init", () => ({}));
vi.mock("@/care-desk/host/route-guards", () => ({
  requireOperator: vi.fn(),
  operatorDenied: vi.fn(async () => Response.json({ error: "forbidden" }, { status: 403 })),
}));
vi.mock("@/care-desk/core", () => ({
  ticketService: { update: vi.fn(), get: vi.fn() },
  categoryService: { resolveCategory: vi.fn() },
  InvalidTransitionError: class InvalidTransitionError extends Error {},
}));

import { categoryService, ticketService } from "@/care-desk/core";
import { requireOperator } from "@/care-desk/host/route-guards";
import { PATCH } from "@/app/api/care-desk/admin/tickets/[id]/route";
import { TEST_OPERATOR_ID, operatorContext } from "../test-context";

const mockGuard = vi.mocked(requireOperator);
const mockUpdate = vi.mocked(ticketService.update);
const mockGet = vi.mocked(ticketService.get);
const mockResolve = vi.mocked(categoryService.resolveCategory);

const TICKET_ID = "t-1";
const ME = TEST_OPERATOR_ID;

const row = (name: string, requesterVisible: boolean) => ({
  id: `c-${name}`,
  name,
  requesterVisible,
  sortOrder: 10,
  archivedAt: null,
  createdAt: new Date(0),
});

function patch(body: Record<string, unknown>) {
  return PATCH(
    new Request(`http://localhost/api/care-desk/admin/tickets/${TICKET_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: TICKET_ID }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue(operatorContext(false));
  mockGet.mockResolvedValue({ id: TICKET_ID, assignedOperatorId: ME } as never);
  mockUpdate.mockResolvedValue({ id: TICKET_ID } as never);
});

describe("PATCH ticket — category rules for operators", () => {
  test("null clears the category without a lookup", async () => {
    const res = await patch({ category: null });
    expect(res.status).toBe(200);
    expect(mockResolve).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(TICKET_ID, { category: null }, { type: "operator", id: ME });
  });

  test("a category hidden from the widget is allowed and written with its stored name", async () => {
    mockResolve.mockResolvedValue({ category: row("HR", false) });
    const res = await patch({ category: " hr " });
    expect(res.status).toBe(200);
    expect(mockResolve).toHaveBeenCalledWith(" hr ", { requesterOnly: false });
    expect(mockUpdate).toHaveBeenCalledWith(TICKET_ID, { category: "HR" }, { type: "operator", id: ME });
  });

  test("archived category -> 400 naming the reason", async () => {
    mockResolve.mockResolvedValue({ reason: "archived" });
    const res = await patch({ category: "Escalations" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "category is archived" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("unknown category -> 400 naming the reason", async () => {
    mockResolve.mockResolvedValue({ reason: "unknown" });
    const res = await patch({ category: "Nope" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "unknown category" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test.each([
    ["empty string", ""],
    ["whitespace", "   "],
    ["number", 123],
    ["boolean", true],
    ["object", {}],
    ["array", ["IT"]],
  ])("%s -> 400 bad category, no lookup, no coercion", async (_label, value) => {
    const res = await patch({ category: value });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad category" });
    expect(mockResolve).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
