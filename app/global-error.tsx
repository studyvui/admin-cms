"use client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
          <h2>Đã có lỗi xảy ra</h2>
          <p style={{ color: "#666" }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
