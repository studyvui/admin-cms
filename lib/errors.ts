import axios from "axios";

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Mất kết nối tới backend (lỗi mạng/CORS).";
    const m = err.response.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
    return `Lỗi ${err.response.status}`;
  }
  return "Lỗi không xác định";
}
