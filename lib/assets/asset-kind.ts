// Phân loại asset theo đuôi file — tập trung 1 nơi (trước đây copy inline nhiều chỗ trong
// questions/page.tsx). Quy ước đuôi giữ NGUYÊN VẸN so với bản cũ.

export function isImageKey(k: string): boolean {
  return /\.(png|webp|jpe?g|gif|svg)$/i.test(k);
}

export function isAudioKey(k: string): boolean {
  return /\.(mp3|ogg|wav|m4a)$/i.test(k);
}
