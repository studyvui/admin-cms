import { describe, it, expect } from "vitest";
import { toCreatePayload, toUpdatePayload } from "../news-form";

describe("news-form toCreatePayload", () => {
  it("chỉ gồm field bắt buộc khi hook/image trống", () => {
    const payload = toCreatePayload({
      type: "update",
      title: "Tiêu đề",
      hook: "",
      content: "Nội dung dài hơn 10 ký tự",
      image: "",
    });
    expect(Object.keys(payload).sort()).toEqual(["content", "title", "type"]);
  });

  it("gồm đủ hook + image khi có giá trị", () => {
    const payload = toCreatePayload({
      type: "tip",
      title: "Tiêu đề",
      hook: "Hook ngắn",
      content: "Nội dung dài hơn 10 ký tự",
      image: "https://cdn.studyvui.vn/news_images/a.jpg",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "content",
      "hook",
      "image",
      "title",
      "type",
    ]);
  });
});

describe("news-form toUpdatePayload", () => {
  it("luôn gồm đủ 5 field (cho phép xoá hook/image bằng chuỗi rỗng)", () => {
    const payload = toUpdatePayload({
      type: "event",
      title: "Tiêu đề",
      hook: "",
      content: "Nội dung dài hơn 10 ký tự",
      image: "",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "content",
      "hook",
      "image",
      "title",
      "type",
    ]);
  });
});
