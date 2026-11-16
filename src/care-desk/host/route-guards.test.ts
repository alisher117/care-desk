import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../core", () => ({ operatorService: { ensureOperator: vi.fn() } }));
vi.mock("./identity-adapter", () => ({
  identityAdapter: { resolveOperator: vi.fn(), resolveRequester: vi.fn() },
}));

import { operatorService } from "../core";
import { identityAdapter } from "./identity-adapter";
import { operatorDenied, requireOperator, requireRequester } from "./route-guards";

const mockOperator = vi.mocked(identityAdapter.resolveOperator);
const mockRequester = vi.mocked(identityAdapter.resolveRequester);
const mockEnsure = vi.mocked(operatorService.ensureOperator);
const req = new Request("http://localhost/api/care-desk/admin/tickets");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireOperator", () => {
  test("no operator identity -> null, and no operator row is created", async () => {
    mockOperator.mockResolvedValue(null);
    expect(await requireOperator(req)).toBeNull();
    expect(mockEnsure).not.toHaveBeenCalled();
  });

  test("operator identity -> ensures the operator row and returns both", async () => {
    const identity = { id: "host-1", displayName: "Op", moderator: true };
    const operator = {
      id: "op-1",
      hostUserId: "host-1",
      displayName: "Op",
      status: "offline" as const,
      createdAt: new Date(0),
    };
    mockOperator.mockResolvedValue(identity);
    mockEnsure.mockResolvedValue(operator);
    expect(await requireOperator(req)).toEqual({ identity, operator });
    expect(mockEnsure).toHaveBeenCalledWith(identity);
  });
});

describe("requireRequester", () => {
  test("passes the request to the identity adapter", async () => {
    const requester = { id: "u-1", displayName: "Req" };
    mockRequester.mockResolvedValue(requester);
    expect(await requireRequester(req)).toEqual(requester);
    expect(mockRequester).toHaveBeenCalledWith(req);
  });
});

describe("operatorDenied", () => {
  test("403 forbidden", async () => {
    const res = await operatorDenied();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
  });
});
