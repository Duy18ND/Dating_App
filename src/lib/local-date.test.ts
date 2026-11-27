import { describe, expect, it } from "vitest";
import { parseLocalDate } from "./local-date";

describe("parseLocalDate", () => {
  it("reads a plain date as local midnight, never shifted by the UTC offset", () => {
    const d = parseLocalDate("2024-02-14");
    expect(d).not.toBeNull();
    expect([d!.getFullYear(), d!.getMonth(), d!.getDate(), d!.getHours()]).toEqual([2024, 1, 14, 0]);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseLocalDate("")).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
    expect(parseLocalDate("not a date")).toBeNull();
  });

  it("still accepts full ISO timestamps", () => {
    expect(parseLocalDate("2024-02-14T10:00:00Z")?.toISOString()).toBe("2024-02-14T10:00:00.000Z");
  });
});
