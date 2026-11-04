// Schema form + transform THUẦN cho trang Câu hỏi (facade). Tách từ file dài ra ba file (mục 93 Đợt 4b):
//   question-form-schema.ts  — schema zod + QuestionFormValues + QuestionPayload
//   question-form-payload.ts — toPayload (form → payload lưu DB)
//   question-form-values.ts  — toFormValues / defaultFormValues (Question → form)
// `toPayload` và `toFormValues` phải ĐỐI XỨNG; test round-trip ở __tests__/question-form.test.ts.
export * from "./question-form-schema";
export * from "./question-form-payload";
export * from "./question-form-values";
