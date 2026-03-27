import { describe, expect, it } from "vitest";
import { diffLocalCalendarDays, parseIsoDateLocal } from "./dateUtils";

describe("parseIsoDateLocal", () => {
  it("parses calendar dates without timezone drift", () => {
    const date = parseIsoDateLocal("2026-03-01");

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(1);
  });

  it("rejects invalid dates", () => {
    expect(parseIsoDateLocal("2026-02-30")).toBeNull();
    expect(parseIsoDateLocal("invalid")).toBeNull();
  });
});

describe("diffLocalCalendarDays", () => {
  it("counts calendar days instead of raw milliseconds", () => {
    const start = new Date("2026-03-08T12:00:00-08:00");
    const end = new Date("2026-03-09T12:00:00-07:00");

    expect(diffLocalCalendarDays(start, end)).toBe(1);
  });
});
