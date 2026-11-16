import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../db/repositories/ticket-repo", () => ({
  ticketRepo: { create: vi.fn() },
}));
vi.mock("../db/repositories/event-repo", () => ({
  eventRepo: { record: vi.fn() },
}));

import { eventRepo } from "../db/repositories/event-repo";
import { ticketRepo } from "../db/repositories/ticket-repo";
import type { Notifier } from "../contracts/notifier";
import type { Ticket } from "../domain/types";
import { setNotifier } from "../notifier";
import { ticketService } from "./ticket";

const ticket: Ticket = {
  id: "t-1",
  number: 14,
  requesterId: "u-1",
  requesterName: "Иван",
  subject: "s",
  description: "d",
  priority: "medium",
  status: "open",
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const input = {
  requesterId: "u-1",
  requesterName: "Иван",
  subject: "s",
  description: "d",
};

function notifier(notifyCreated: Notifier["notifyCreated"]): Notifier {
  return { notifyCreated, notifyStatusChange: vi.fn(), notifyAssigned: vi.fn() };
}

beforeEach(() => {
  vi.mocked(ticketRepo.create).mockResolvedValue(ticket);
  vi.mocked(eventRepo.record).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("ticketService.create", () => {
  test("saves the ticket, then sends the new-ticket notification", async () => {
    const notifyCreated = vi.fn().mockResolvedValue(undefined);
    setNotifier(notifier(notifyCreated));

    const created = await ticketService.create(input);

    expect(created).toBe(ticket);
    expect(ticketRepo.create).toHaveBeenCalledWith(input);
    expect(notifyCreated).toHaveBeenCalledWith({ ticket });
  });

  test("a failing notification does not fail the submission", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setNotifier(notifier(vi.fn().mockRejectedValue(new Error("smtp down"))));

    await expect(ticketService.create(input)).resolves.toBe(ticket);
    await new Promise((r) => setTimeout(r, 0));

    expect(errorSpy).toHaveBeenCalledWith("[care-desk] new ticket notification failed", expect.any(Error));
  });
});
