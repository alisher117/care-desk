import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/care-desk/host/init", () => ({}));
vi.mock("@/care-desk/host/route-guards", () => ({
  requireOperator: vi.fn(),
  operatorDenied: vi.fn(async () => Response.json({ error: "forbidden" }, { status: 403 })),
}));
vi.mock("@/care-desk/core", () => ({
  ticketService: { update: vi.fn(), get: vi.fn() },
  noteService: { add: vi.fn(), list: vi.fn() },
  categoryService: { resolveCategory: vi.fn() },
  InvalidTransitionError: class InvalidTransitionError extends Error {},
}));

import { requireOperator } from "@/care-desk/host/route-guards";
import { noteService, ticketService } from "@/care-desk/core";
import { PATCH } from "@/app/api/care-desk/admin/tickets/[id]/route";
import { POST as addNote } from "@/app/api/care-desk/admin/tickets/[id]/notes/route";
import { TEST_OPERATOR_ID, operatorContext as context } from "../test-context";

const mockGuard = vi.mocked(requireOperator);
const mockUpdate = vi.mocked(ticketService.update);
const mockGet = vi.mocked(ticketService.get);
const mockAddNote = vi.mocked(noteService.add);

const TICKET_ID = "t-1";
const ME = TEST_OPERATOR_ID;
const OTHER = "op-2";

function ticket(assignedOperatorId: string | null) {
  return { id: TICKET_ID, assignedOperatorId } as never;
}

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

function note(body: string) {
  return addNote(
    new Request(`http://localhost/api/care-desk/admin/tickets/${TICKET_ID}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }),
    { params: Promise.resolve({ id: TICKET_ID }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({ id: TICKET_ID } as never);
  mockAddNote.mockResolvedValue({ id: "n-1" } as never);
});

describe("PATCH ticket — operators may only change their own tickets", () => {
  test("operator on a ticket assigned to someone else -> 403, no update", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(OTHER));
    const res = await patch({ priority: "high" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "not your ticket" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("operator on an unassigned ticket -> 403", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(null));
    const res = await patch({ priority: "high" });
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("operator on their own ticket -> allowed", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(ME));
    const res = await patch({ priority: "high" });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      TICKET_ID,
      { priority: "high" },
      { type: "operator", id: ME },
    );
  });

  test("operator reassigning their own ticket -> 403 (assignment is admin-only)", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(ME));
    const res = await patch({ assignedOperatorId: OTHER });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "assignment requires admin" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("admin on someone else's ticket -> allowed, including assignment", async () => {
    mockGuard.mockResolvedValue(context(true));
    mockGet.mockResolvedValue(ticket(OTHER));
    const res = await patch({ assignedOperatorId: ME, priority: "low" });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      TICKET_ID,
      { assignedOperatorId: ME, priority: "low" },
      { type: "operator", id: ME },
    );
  });

  test("unknown ticket -> 404 before any permission check", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(null);
    const res = await patch({ priority: "high" });
    expect(res.status).toBe(404);
  });

  test("not an operator at all -> 403 forbidden", async () => {
    mockGuard.mockResolvedValue(null);
    const res = await patch({ priority: "high" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe("POST note — same ownership rule", () => {
  test("operator on someone else's ticket -> 403, no note", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(OTHER));
    const res = await note("called them");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "not your ticket" });
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  test("operator on their own ticket -> 201", async () => {
    mockGuard.mockResolvedValue(context(false));
    mockGet.mockResolvedValue(ticket(ME));
    const res = await note("called them");
    expect(res.status).toBe(201);
    expect(mockAddNote).toHaveBeenCalledWith(TICKET_ID, ME, "called them");
  });

  test("admin on any ticket -> 201", async () => {
    mockGuard.mockResolvedValue(context(true));
    mockGet.mockResolvedValue(ticket(null));
    const res = await note("triaged");
    expect(res.status).toBe(201);
  });
});
