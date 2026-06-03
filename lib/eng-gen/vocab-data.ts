// ============================================================
// STUDYVUI — Vocab Provider (TS port của engine/english/data/vocab_provider.js)
// Nhúng toàn bộ canonical_vocab + ánh xạ tuần→topic. Không fetch.
// ============================================================

export interface VocabEntry {
  word: string;
  meaning: string;
}

export const VOCAB: Record<string, VocabEntry[]> = {
  greetings: [
    { word: "hello", meaning: "xin chào" },
    { word: "hi", meaning: "chào" },
    { word: "bye", meaning: "tạm biệt" },
    { word: "goodbye", meaning: "tạm biệt" },
    { word: "name", meaning: "tên" },
    { word: "please", meaning: "làm ơn" },
    { word: "thank you", meaning: "cảm ơn" },
    { word: "sorry", meaning: "xin lỗi" },
  ],
  school_items: [
    { word: "pen", meaning: "cây bút mực" },
    { word: "pencil", meaning: "bút chì" },
    { word: "book", meaning: "quyển sách" },
    { word: "bag", meaning: "cái cặp" },
    { word: "ruler", meaning: "cái thước" },
    { word: "eraser", meaning: "cục tẩy" },
    { word: "crayon", meaning: "bút màu" },
    { word: "notebook", meaning: "quyển vở" },
  ],
  colors: [
    { word: "red", meaning: "màu đỏ" },
    { word: "blue", meaning: "màu xanh dương" },
    { word: "yellow", meaning: "màu vàng" },
    { word: "green", meaning: "màu xanh lá" },
    { word: "orange", meaning: "màu cam" },
    { word: "purple", meaning: "màu tím" },
    { word: "pink", meaning: "màu hồng" },
    { word: "white", meaning: "màu trắng" },
    { word: "black", meaning: "màu đen" },
    { word: "brown", meaning: "màu nâu" },
  ],
  numbers: [
    { word: "one", meaning: "một" },
    { word: "two", meaning: "hai" },
    { word: "three", meaning: "ba" },
    { word: "four", meaning: "bốn" },
    { word: "five", meaning: "năm" },
    { word: "six", meaning: "sáu" },
    { word: "seven", meaning: "bảy" },
    { word: "eight", meaning: "tám" },
    { word: "nine", meaning: "chín" },
    { word: "ten", meaning: "mười" },
  ],
  family_members: [
    { word: "father", meaning: "bố / ba" },
    { word: "mother", meaning: "mẹ / má" },
    { word: "brother", meaning: "anh / em trai" },
    { word: "sister", meaning: "chị / em gái" },
    { word: "baby", meaning: "em bé" },
    { word: "grandmother", meaning: "bà" },
    { word: "grandfather", meaning: "ông" },
  ],
  face: [
    { word: "face", meaning: "khuôn mặt" },
    { word: "eye", meaning: "con mắt" },
    { word: "ear", meaning: "cái tai" },
    { word: "nose", meaning: "cái mũi" },
    { word: "mouth", meaning: "cái miệng" },
    { word: "hair", meaning: "tóc" },
  ],
  body_parts: [
    { word: "hand", meaning: "bàn tay" },
    { word: "head", meaning: "cái đầu" },
    { word: "leg", meaning: "cái chân" },
    { word: "arm", meaning: "cánh tay" },
    { word: "finger", meaning: "ngón tay" },
    { word: "foot", meaning: "bàn chân" },
    { word: "knee", meaning: "đầu gối" },
    { word: "shoulder", meaning: "vai" },
  ],
  toys: [
    { word: "ball", meaning: "quả bóng" },
    { word: "doll", meaning: "con búp bê" },
    { word: "train", meaning: "xe lửa đồ chơi" },
    { word: "robot", meaning: "người máy" },
    { word: "kite", meaning: "cái diều" },
    { word: "car", meaning: "xe ô tô đồ chơi" },
    { word: "blocks", meaning: "khối xếp hình" },
  ],
  wild_animals: [
    { word: "tiger", meaning: "con hổ" },
    { word: "monkey", meaning: "con khỉ" },
    { word: "elephant", meaning: "con voi" },
    { word: "bear", meaning: "con gấu" },
    { word: "lion", meaning: "con sư tử" },
    { word: "zebra", meaning: "con ngựa vằn" },
    { word: "giraffe", meaning: "con hươu cao cổ" },
    { word: "kangaroo", meaning: "con chuột túi" },
  ],
  food: [
    { word: "pizza", meaning: "bánh pizza" },
    { word: "rice", meaning: "cơm / gạo" },
    { word: "chicken", meaning: "thịt gà" },
    { word: "bread", meaning: "bánh mì" },
    { word: "egg", meaning: "quả trứng" },
    { word: "cake", meaning: "bánh kem" },
    { word: "noodle", meaning: "mì / bún" },
    { word: "fish", meaning: "cá (món ăn)" },
  ],
  drinks: [
    { word: "water", meaning: "nước lọc" },
    { word: "milk", meaning: "sữa" },
    { word: "juice", meaning: "nước ép" },
    { word: "tea", meaning: "trà" },
    { word: "lemonade", meaning: "nước chanh" },
    { word: "coconut water", meaning: "nước dừa" },
  ],
  clothing: [
    { word: "shirt", meaning: "áo sơ mi" },
    { word: "hat", meaning: "mũ / nón" },
    { word: "shoes", meaning: "giày" },
    { word: "dress", meaning: "váy đầm" },
    { word: "pants", meaning: "quần dài" },
    { word: "socks", meaning: "đôi tất" },
    { word: "coat", meaning: "áo khoác" },
    { word: "gloves", meaning: "găng tay" },
  ],
  actions: [
    { word: "run", meaning: "chạy" },
    { word: "jump", meaning: "nhảy" },
    { word: "swim", meaning: "bơi" },
    { word: "walk", meaning: "đi bộ" },
    { word: "eat", meaning: "ăn" },
    { word: "drink", meaning: "uống" },
    { word: "read", meaning: "đọc" },
    { word: "write", meaning: "viết" },
    { word: "play", meaning: "chơi" },
    { word: "sing", meaning: "hát" },
  ],
  emotions: [
    { word: "happy", meaning: "vui / hạnh phúc" },
    { word: "sad", meaning: "buồn" },
    { word: "angry", meaning: "tức giận" },
    { word: "tired", meaning: "mệt mỏi" },
    { word: "scared", meaning: "sợ hãi" },
    { word: "excited", meaning: "hào hứng" },
    { word: "surprised", meaning: "ngạc nhiên" },
  ],
  phonics_ab: [
    { word: "apple", meaning: "quả táo" },
    { word: "ant", meaning: "con kiến" },
    { word: "alligator", meaning: "cá sấu Mỹ" },
    { word: "bear", meaning: "con gấu" },
    { word: "bird", meaning: "con chim" },
    { word: "boy", meaning: "con trai" },
    { word: "ball", meaning: "quả bóng" },
  ],
  phonics_cd: [
    { word: "cat", meaning: "con mèo" },
    { word: "car", meaning: "xe ô tô" },
    { word: "cup", meaning: "cái cốc" },
    { word: "dog", meaning: "con chó" },
    { word: "duck", meaning: "con vịt" },
    { word: "door", meaning: "cái cửa" },
  ],
  phonics_ef: [
    { word: "egg", meaning: "quả trứng" },
    { word: "elephant", meaning: "con voi" },
    { word: "fan", meaning: "cái quạt" },
    { word: "fish", meaning: "con cá" },
    { word: "frog", meaning: "con ếch" },
  ],
  phonics_gh: [
    { word: "goat", meaning: "con dê" },
    { word: "girl", meaning: "con gái" },
    { word: "hat", meaning: "cái mũ" },
    { word: "house", meaning: "ngôi nhà" },
    { word: "horse", meaning: "con ngựa" },
  ],
  phonics_ij: [
    { word: "ice cream", meaning: "kem" },
    { word: "insect", meaning: "côn trùng" },
    { word: "igloo", meaning: "lều tuyết" },
    { word: "juice", meaning: "nước ép" },
    { word: "jelly", meaning: "thạch" },
  ],
  phonics_kl: [
    { word: "kite", meaning: "cái diều" },
    { word: "kangaroo", meaning: "con chuột túi" },
    { word: "lion", meaning: "con sư tử" },
    { word: "lemon", meaning: "quả chanh" },
    { word: "leaf", meaning: "cái lá" },
  ],
  phonics_mn: [
    { word: "monkey", meaning: "con khỉ" },
    { word: "mouse", meaning: "con chuột" },
    { word: "nut", meaning: "quả hạch" },
    { word: "nest", meaning: "cái tổ chim" },
    { word: "moon", meaning: "mặt trăng" },
  ],
  phonics_op: [
    { word: "orange", meaning: "quả cam" },
    { word: "octopus", meaning: "con bạch tuộc" },
    { word: "pig", meaning: "con lợn" },
    { word: "pen", meaning: "cây bút" },
    { word: "panda", meaning: "con gấu trúc" },
  ],
  phonics_qr: [
    { word: "queen", meaning: "nữ hoàng" },
    { word: "quilt", meaning: "chăn bông" },
    { word: "rabbit", meaning: "con thỏ" },
    { word: "ring", meaning: "cái nhẫn" },
    { word: "rain", meaning: "mưa" },
  ],
  phonics_st: [
    { word: "sun", meaning: "mặt trời" },
    { word: "snake", meaning: "con rắn" },
    { word: "star", meaning: "ngôi sao" },
    { word: "tiger", meaning: "con hổ" },
    { word: "tree", meaning: "cái cây" },
  ],
  phonics_uv: [
    { word: "umbrella", meaning: "cái ô / dù" },
    { word: "up", meaning: "lên / phía trên" },
    { word: "van", meaning: "xe tải nhỏ" },
    { word: "violin", meaning: "đàn vi-ô-lông" },
    { word: "vase", meaning: "bình hoa" },
  ],
  phonics_wx: [
    { word: "water", meaning: "nước" },
    { word: "window", meaning: "cái cửa sổ" },
    { word: "whale", meaning: "con cá voi" },
    { word: "fox", meaning: "con cáo" },
    { word: "box", meaning: "cái hộp" },
  ],
  phonics_yz: [
    { word: "yo-yo", meaning: "đồ chơi yo-yo" },
    { word: "yogurt", meaning: "sữa chua" },
    { word: "zebra", meaning: "ngựa vằn" },
    { word: "zoo", meaning: "vườn thú" },
    { word: "zero", meaning: "số không" },
  ],
};

export const WEEK_TOPICS: Record<number, { vocabTags: string[] }> = {
  1: { vocabTags: ["greetings"] },
  2: { vocabTags: ["phonics_ab"] },
  3: { vocabTags: ["school_items"] },
  4: { vocabTags: ["phonics_cd"] },
  5: { vocabTags: ["greetings", "school_items", "phonics_ab", "phonics_cd"] },
  6: { vocabTags: ["colors"] },
  7: { vocabTags: ["phonics_ef"] },
  8: { vocabTags: ["numbers"] },
  9: { vocabTags: ["phonics_gh"] },
  10: { vocabTags: ["greetings", "school_items", "colors", "numbers", "phonics_ab", "phonics_cd", "phonics_ef", "phonics_gh"] },
  11: { vocabTags: ["family_members"] },
  12: { vocabTags: ["phonics_ij"] },
  13: { vocabTags: ["face", "body_parts"] },
  14: { vocabTags: ["phonics_kl"] },
  15: { vocabTags: ["family_members", "face", "body_parts", "phonics_ij", "phonics_kl"] },
  16: { vocabTags: ["toys"] },
  17: { vocabTags: ["phonics_mn"] },
  18: { vocabTags: ["greetings", "school_items", "colors", "numbers", "family_members", "face", "body_parts", "toys", "phonics_ab", "phonics_cd", "phonics_ef", "phonics_gh", "phonics_ij", "phonics_kl", "phonics_mn"] },
  19: { vocabTags: ["wild_animals"] },
  20: { vocabTags: ["phonics_op"] },
  21: { vocabTags: ["food"] },
  22: { vocabTags: ["phonics_qr"] },
  23: { vocabTags: ["wild_animals", "food", "phonics_op", "phonics_qr"] },
  24: { vocabTags: ["drinks"] },
  25: { vocabTags: ["phonics_st"] },
  26: { vocabTags: ["clothing"] },
  27: { vocabTags: ["phonics_uv"] },
  28: { vocabTags: ["wild_animals", "food", "drinks", "clothing", "phonics_op", "phonics_qr", "phonics_st", "phonics_uv"] },
  29: { vocabTags: ["actions"] },
  30: { vocabTags: ["phonics_wx"] },
  31: { vocabTags: ["emotions"] },
  32: { vocabTags: ["phonics_yz"] },
  33: { vocabTags: ["actions", "emotions", "phonics_wx", "phonics_yz"] },
  34: { vocabTags: ["phonics_ab", "phonics_cd", "phonics_ef", "phonics_gh", "phonics_ij", "phonics_kl", "phonics_mn", "phonics_op", "phonics_qr", "phonics_st", "phonics_uv", "phonics_wx", "phonics_yz"] },
  35: { vocabTags: ["greetings", "school_items", "colors", "numbers", "family_members", "face", "body_parts", "toys", "wild_animals", "food", "drinks", "clothing", "actions", "emotions"] },
};

// Lookup nhanh
const _meaningMap: Record<string, string> = {};
const _topicWords: Record<string, string[]> = {};
for (const [topic, entries] of Object.entries(VOCAB)) {
  _topicWords[topic] = entries.map((e) => e.word);
  for (const e of entries) if (!_meaningMap[e.word]) _meaningMap[e.word] = e.meaning;
}

export function getWordListForWeek(_grade: number, week: number): string[] {
  const weekData = WEEK_TOPICS[week];
  if (!weekData) return [];
  const seen = new Set<string>();
  const words: string[] = [];
  for (const topic of weekData.vocabTags) {
    for (const w of _topicWords[topic] || []) {
      if (!seen.has(w)) {
        seen.add(w);
        words.push(w);
      }
    }
  }
  return words;
}

export function getTopicsForWeek(week: number): string[] {
  return (WEEK_TOPICS[week] && WEEK_TOPICS[week].vocabTags) || [];
}

export function getDistractorPool(
  topics: string | string[],
  excludeWords: string | string[],
): string[] {
  const topicList = Array.isArray(topics) ? topics : topics ? [topics] : [];
  const excludeSet = new Set(
    Array.isArray(excludeWords)
      ? excludeWords.map((w) => w.toLowerCase())
      : excludeWords
        ? [excludeWords.toLowerCase()]
        : [],
  );
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const topic of topicList) {
    for (const w of _topicWords[topic] || []) {
      if (!excludeSet.has(w.toLowerCase()) && !seen.has(w)) {
        seen.add(w);
        pool.push(w);
      }
    }
  }
  if (pool.length < 3) {
    for (const words of Object.values(_topicWords)) {
      for (const w of words) {
        if (!excludeSet.has(w.toLowerCase()) && !seen.has(w)) {
          seen.add(w);
          pool.push(w);
          if (pool.length >= 10) break;
        }
      }
      if (pool.length >= 10) break;
    }
  }
  return pool;
}

export function getWordMeaning(word: string): string | null {
  return _meaningMap[(word || "").toLowerCase()] || null;
}

export function getAllWords(): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const list of Object.values(_topicWords)) {
    for (const w of list) if (!seen.has(w)) { seen.add(w); words.push(w); }
  }
  return words;
}
