import { describe, expect, test } from "vitest";
import { ticketFormSchema, validateCategory } from "@/care-desk/web/validation";

describe("validateCategory", () => {
  test("passes when no categories are offered", () => {
    expect(validateCategory("", [])).toBeNull();
    expect(validateCategory(undefined, [])).toBeNull();
    expect(validateCategory("IT", [])).toBeNull();
  });

  test("requires one of the offered categories", () => {
    expect(validateCategory("", ["IT"])).toBe("Please choose a category.");
    expect(validateCategory(undefined, ["IT"])).toBe("Please choose a category.");
    expect(validateCategory("HR", ["IT"])).toBe("Please choose a category.");
    expect(validateCategory("IT", ["IT", "Finance"])).toBeNull();
  });
});

describe("ticketFormSchema", () => {
  test("accepts a request without a category", () => {
    const parsed = ticketFormSchema.safeParse({
      subject: "Laptop",
      description: "My laptop does not boot.",
    });
    expect(parsed.success).toBe(true);
  });

  test("trims fields and reports each problem", () => {
    const parsed = ticketFormSchema.safeParse({
      category: " IT ",
      subject: "  Hi  ",
      description: "x".repeat(501),
    });
    expect(parsed.success).toBe(false);
    const paths = parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0]));
    expect(paths.sort()).toEqual(["description", "subject"]);
  });

  test("trims the category name", () => {
    const parsed = ticketFormSchema.safeParse({
      category: " IT ",
      subject: "Laptop",
      description: "My laptop does not boot.",
    });
    expect(parsed.success && parsed.data.category).toBe("IT");
  });
});
