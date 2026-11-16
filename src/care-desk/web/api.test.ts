import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// The project ships without a login page (LOGIN_PATH is null); these tests
// cover the redirect that switches on once the host sets one.
vi.mock("./routes", () => ({ DASHBOARD_PATH: "/desk", LOGIN_PATH: "/login" }));

import { adminApi, ApiError, widgetApi } from "./api";

const assign = vi.fn();
const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function settles(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  promise.then(
    () => (settled = true),
    () => (settled = true),
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  return settled;
}

beforeEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {
    location: { pathname: "/kk/desk/0b9c", assign },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ticket poll", () => {
  test("the poll tick sends x-activity: poll", async () => {
    respond(200, []);
    await adminApi.tickets({ status: "open" }, { poll: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/care-desk/admin/tickets?status=open");
    expect(init).toEqual({ headers: { "x-activity": "poll" } });
  });

  test("user-driven loads send no activity header", async () => {
    respond(200, []);
    await adminApi.tickets({ status: "open" });
    expect(fetchMock.mock.calls[0][1]).toBeUndefined();
  });
});

describe("dashboard on an ended session", () => {
  test.each(["session_idle", "session_ended"])(
    "%s -> browser goes to the login page with the same reason, nothing rendered",
    async (reason) => {
      respond(401, { error: "unauthorized", reason });
      const pending = adminApi.tickets({}, { poll: true });
      expect(await settles(pending)).toBe(false);
      expect(assign).toHaveBeenCalledWith(`/kk/login?error=${reason}`);
    },
  );

  test("other dashboard calls redirect the same way", async () => {
    respond(401, { error: "unauthorized", reason: "session_idle" });
    expect(await settles(adminApi.ticket("t-1"))).toBe(false);
    respond(401, { error: "unauthorized", reason: "session_ended" });
    expect(await settles(adminApi.operators())).toBe(false);
    expect(assign.mock.calls).toEqual([
      ["/kk/login?error=session_idle"],
      ["/kk/login?error=session_ended"],
    ]);
  });

  test("unauthenticated -> ordinary error, no redirect", async () => {
    respond(401, { error: "unauthorized", reason: "unauthenticated" });
    await expect(adminApi.tickets()).rejects.toBeInstanceOf(ApiError);
    expect(assign).not.toHaveBeenCalled();
  });

  test("forbidden -> ordinary error, no redirect", async () => {
    respond(403, { error: "forbidden" });
    await expect(adminApi.tickets()).rejects.toMatchObject({ status: 403, reason: "forbidden" });
    expect(assign).not.toHaveBeenCalled();
  });

  test("the widget is left alone", async () => {
    respond(401, { error: "unauthorized", reason: "session_idle" });
    await expect(widgetApi.categories()).rejects.toBeInstanceOf(ApiError);
    expect(assign).not.toHaveBeenCalled();
  });
});
