// Ngân hàng mẫu câu hỏi–đáp Tiếng Anh Lớp 1 (HK1) — nguồn cặp NHIỄU cho chế độ
// "Ghép cặp theo tranh" (matching). Thuần dữ liệu, không React.
// Cặp nhiễu BẮT BUỘC chọn từ đây (dropdown) để không lệch chương trình lớp 1.
// Đồng bộ với bộ ảnh g1_sent_*.webp trên CDN (xem PLAN/ENGLISH/prompt_anh_mau_cau_hk1.html).

export interface SentencePair {
  left: string; // câu hỏi
  right: string; // câu trả lời
}

export const G1_SENTENCE_PAIRS: SentencePair[] = [
  // W03 — What is this? (đồ dùng học tập)
  { left: "What is this?", right: "It is a pen" },
  { left: "What is this?", right: "It is a book" },
  { left: "What is this?", right: "It is a pencil" },
  { left: "What is this?", right: "It is a ruler" },
  { left: "What is this?", right: "It is a bag" },
  // W09 — What is your name? (giới thiệu tên)
  { left: "What is your name?", right: "I am Nam" },
  { left: "What is your name?", right: "My name is Lan" },
  { left: "Hello!", right: "Hello, I am Mai" },
  { left: "Nice to meet you!", right: "Nice to meet you, too" },
  // Mở rộng (pool sinh đề HK1)
  { left: "How old are you?", right: "I am six" },
  { left: "Do you like pizza?", right: "Yes, I do" },
];

/** Key ổn định cho 1 cặp (dùng làm value của <Select>). */
export function pairKey(p: SentencePair): string {
  return `${p.left}|${p.right}`;
}

/** Tìm cặp trong ngân hàng theo key; null nếu không có. */
export function pairFromKey(key: string): SentencePair | null {
  return G1_SENTENCE_PAIRS.find((p) => pairKey(p) === key) ?? null;
}
