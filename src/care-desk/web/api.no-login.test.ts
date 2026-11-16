import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { adminApi, ApiError } from "./api";
import { LOGIN_PATH } from "./routes";

const assign = vi.fn();
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", { location: { pathname: "/en/desk", assign } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dashboard without a login page", () => {
  test("the project ships with no login path", () => {
    expect(LOGIN_PATH).toBeNull();
  });

  test("an ended session is an ordinary error, the browser stays put", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unauthorized", reason: "session_idle" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(adminApi.tickets()).rejects.toBeInstanceOf(ApiError);
    expect(assign).not.toHaveBeenCalled();
  });
});
