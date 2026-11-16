import { describe, expect, test } from "vitest";
import {
  defaultDashboardLabels,
  defaultWidgetLabels,
  fmt,
  resolveLabels,
} from "./labels";

const defaults = {
  plain: "Hello",
  templated: "Ticket {number} for {name}",
};

describe("resolveLabels", () => {
  test("returns the defaults when the source is null, undefined or not an object", () => {
    expect(resolveLabels(defaults, null)).toEqual(defaults);
    expect(resolveLabels(defaults, undefined)).toEqual(defaults);
    expect(resolveLabels(defaults, "Hello")).toEqual(defaults);
    expect(resolveLabels(defaults, 42)).toEqual(defaults);
    expect(resolveLabels(defaults, [])).toEqual(defaults);
  });

  test("takes a non-empty string from the source", () => {
    expect(resolveLabels(defaults, { plain: "Привет" }).plain).toBe("Привет");
  });

  test("keeps the default for empty, whitespace-only and non-string values", () => {
    expect(resolveLabels(defaults, { plain: "" }).plain).toBe("Hello");
    expect(resolveLabels(defaults, { plain: "   \n\t" }).plain).toBe("Hello");
    expect(resolveLabels(defaults, { plain: null }).plain).toBe("Hello");
    expect(resolveLabels(defaults, { plain: 7 }).plain).toBe("Hello");
    expect(resolveLabels(defaults, { plain: { text: "x" } }).plain).toBe("Hello");
  });

  test("keeps the default when a placeholder of the default is missing", () => {
    const missingOne = resolveLabels(defaults, { templated: "Заявка {number}" });
    expect(missingOne.templated).toBe(defaults.templated);
    const missingAll = resolveLabels(defaults, { templated: "Заявка" });
    expect(missingAll.templated).toBe(defaults.templated);
  });

  test("accepts a translation that keeps every placeholder, in any order", () => {
    const r = resolveLabels(defaults, { templated: "{name}: заявка {number}" });
    expect(r.templated).toBe("{name}: заявка {number}");
  });

  test("ignores keys that are not in the defaults and never adds them", () => {
    const r = resolveLabels(defaults, { extra: "x", documentId: "abc" });
    expect(Object.keys(r).sort()).toEqual(["plain", "templated"]);
  });

  test("does not mutate the defaults object", () => {
    const copy = { ...defaults };
    resolveLabels(defaults, { plain: "Changed" });
    expect(defaults).toEqual(copy);
  });

  test("resolves the real widget and dashboard defaults to themselves on an empty source", () => {
    expect(resolveLabels(defaultWidgetLabels, {})).toEqual(defaultWidgetLabels);
    expect(resolveLabels(defaultDashboardLabels, {})).toEqual(defaultDashboardLabels);
  });
});

describe("fmt", () => {
  test("substitutes string and number values", () => {
    expect(fmt("Ticket {number} for {name}", { number: 7, name: "Ann" })).toBe(
      "Ticket 7 for Ann",
    );
  });

  test("leaves unknown placeholders as they are", () => {
    expect(fmt("Hello {name}, {unknown}", { name: "Ann" })).toBe(
      "Hello Ann, {unknown}",
    );
  });

  test("leaves a placeholder whose value is null or undefined", () => {
    expect(fmt("{a} {b}", { a: null, b: undefined })).toBe("{a} {b}");
  });

  test("substitutes a placeholder every time it appears", () => {
    expect(fmt("{x} and {x}", { x: "y" })).toBe("y and y");
  });

  test("returns a template without placeholders unchanged", () => {
    expect(fmt("Plain text", { x: 1 })).toBe("Plain text");
  });
});

describe("default label keys", () => {
  const RESERVED = new Set([
    "id",
    "documentId",
    "entryId",
    "locale",
    "localizations",
    "status",
    "meta",
    "createdAt",
    "updatedAt",
    "publishedAt",
    "createdBy",
    "updatedBy",
  ]);

  test("are plain camelCase names, safe to use as CMS field names", () => {
    for (const key of [
      ...Object.keys(defaultWidgetLabels),
      ...Object.keys(defaultDashboardLabels),
    ]) {
      expect(key).toMatch(/^[a-z][A-Za-z0-9]*$/);
      expect(RESERVED.has(key)).toBe(false);
    }
  });

  test("have non-empty English defaults", () => {
    for (const value of [
      ...Object.values(defaultWidgetLabels),
      ...Object.values(defaultDashboardLabels),
    ]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
