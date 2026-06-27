import { describe, it, expect } from "vitest";
import {
  nextQuestionCode,
  parseMarkedWord,
  shuffleArr,
  genDistractorLetters,
} from "@/lib/questions/question-utils";

// RNG xác định (mulberry32) để test phần có ngẫu nhiên.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("nextQuestionCode", () => {
  it("sinh seq 001 khi chưa có mã nào", () => {
    expect(nextQuestionCode("G1_W01_1_ENG", [])).toBe("G1_W01_1_ENG_001");
  });

  it("bỏ qua seq đã dùng, lấy số nhỏ nhất còn trống", () => {
    expect(
      nextQuestionCode("G1_W01_1_ENG", [
        "G1_W01_1_ENG_001",
        "G1_W01_1_ENG_003",
      ]),
    ).toBe("G1_W01_1_ENG_002");
  });

  it("không tính mã của bài khác (prefix khác)", () => {
    expect(
      nextQuestionCode("G1_W01_1_ENG", ["G1_W01_1_MATH_001"]),
    ).toBe("G1_W01_1_ENG_001");
  });

  it("pad 3 chữ số", () => {
    const used = Array.from({ length: 9 }, (_, i) =>
      `G1_W01_1_ENG_${String(i + 1).padStart(3, "0")}`,
    );
    expect(nextQuestionCode("G1_W01_1_ENG", used)).toBe("G1_W01_1_ENG_010");
  });
});

describe("parseMarkedWord", () => {
  it("tách prefix/hidden/suffix hợp lệ", () => {
    expect(parseMarkedWord("h[el]lo")).toEqual({
      prefix: "h",
      hidden: "el",
      suffix: "lo",
    });
  });

  it("ẩn ở đầu / ở cuối", () => {
    expect(parseMarkedWord("[c]at")).toEqual({
      prefix: "",
      hidden: "c",
      suffix: "at",
    });
    expect(parseMarkedWord("ca[t]")).toEqual({
      prefix: "ca",
      hidden: "t",
      suffix: "",
    });
  });

  it("trả null khi không có cặp [..] hợp lệ", () => {
    expect(parseMarkedWord("hello")).toBeNull();
    expect(parseMarkedWord("h[e]l[o]")).toBeNull();
    expect(parseMarkedWord("h[12]o")).toBeNull(); // chỉ chấp nhận chữ cái
    expect(parseMarkedWord("")).toBeNull();
  });
});

describe("shuffleArr", () => {
  it("giữ nguyên phần tử (chỉ đổi thứ tự), không sửa mảng gốc", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffleArr(src, mulberry32(42));
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(src).toEqual([1, 2, 3, 4, 5]); // không mutate
  });

  it("xác định khi tiêm cùng rng", () => {
    const a = shuffleArr([1, 2, 3, 4, 5], mulberry32(7));
    const b = shuffleArr([1, 2, 3, 4, 5], mulberry32(7));
    expect(a).toEqual(b);
  });
});

describe("genDistractorLetters", () => {
  it("không trả chữ nằm trong exclude và đủ số lượng", () => {
    const exclude = new Set(["a", "b", "c"]);
    const out = genDistractorLetters(exclude, 4, mulberry32(1));
    expect(out).toHaveLength(4);
    out.forEach((c) => expect(exclude.has(c)).toBe(false));
    expect(new Set(out).size).toBe(out.length); // không trùng
  });

  it("n <= 0 trả mảng rỗng", () => {
    expect(genDistractorLetters(new Set(), 0)).toEqual([]);
    expect(genDistractorLetters(new Set(), -3)).toEqual([]);
  });
});
