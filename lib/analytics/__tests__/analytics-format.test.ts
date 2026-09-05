import { describe, it, expect } from "vitest";
import { formatPercent, formatHourLabel, formatNumberVn } from "@/lib/analytics/analytics-format";

describe("formatPercent", () => {
  it("0.756 -> '75.6%'", () => {
    expect(formatPercent(0.756)).toBe("75.6%");
  });

  it("0 -> '0.0%'", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("1 -> '100.0%'", () => {
    expect(formatPercent(1)).toBe("100.0%");
  });
});

describe("formatHourLabel", () => {
  it("8 -> '08:00'", () => {
    expect(formatHourLabel(8)).toBe("08:00");
  });

  it("0 -> '00:00'", () => {
    expect(formatHourLabel(0)).toBe("00:00");
  });

  it("23 -> '23:00'", () => {
    expect(formatHourLabel(23)).toBe("23:00");
  });
});

describe("formatNumberVn", () => {
  it("định dạng số nguyên với dấu phân cách nghìn kiểu Việt Nam", () => {
    expect(formatNumberVn(12345)).toBe("12.345");
  });

  it("số nhỏ hơn 1000 giữ nguyên", () => {
    expect(formatNumberVn(42)).toBe("42");
  });
});
