// Dữ liệu giả cho E2E — shape khớp lib/types.ts (Course/Lesson/Question).
// Lesson code chứa "_ENG" → dialog câu hỏi hiện đủ 5 mode (xem isEngLesson trong question-dialog.tsx).

export const COURSE = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "ENG_G1",
  name: "Tiếng Anh Lớp 1",
  subject: "english",
  grade: 1,
  isActive: true,
};

export const LESSON = {
  id: "22222222-2222-4222-8222-222222222222",
  courseId: COURSE.id,
  code: "G1_W01_1_ENG",
  week: 1,
  orderIndex: 1,
  name: "Lời chào",
  lessonType: "vocabulary",
  skills: ["vocab", "listening"],
  status: "published",
  isPremium: false,
  vocabulary: [{ word: "hello", meaning: "xin chào" }],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

export const COURSES = [COURSE];
export const LESSONS = [LESSON];

interface FQuestion {
  id: string;
  lessonId: string;
  code: string;
  type: string;
  skill: string;
  difficulty: number;
  content: Record<string, unknown>;
  correctAnswer: string;
  assetRefs: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

function q(
  partial: Pick<FQuestion, "id" | "code" | "type" | "content" | "correctAnswer"> &
    Partial<FQuestion>,
): FQuestion {
  return {
    lessonId: LESSON.id,
    skill: "vocab",
    difficulty: 1,
    assetRefs: [],
    status: "draft",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

export const Q_MC = q({
  id: "q-mc-0001",
  code: "G1_W01_1_ENG_001",
  type: "multiple_choice",
  content: { prompt: "Chọn từ đúng", options: ["cat", "dog", "fish", "bird"] },
  correctAnswer: "dog",
});

export const Q_IMAGE = q({
  id: "q-img-0002",
  code: "G1_W01_1_ENG_002",
  type: "image_choice",
  content: {
    prompt: "Đây là gì?",
    image: "apple.png",
    options: ["apple", "banana", "cherry", "grape"],
  },
  correctAnswer: "apple",
  assetRefs: ["apple.png"],
});

export const Q_AUDIO = q({
  id: "q-aud-0003",
  code: "G1_W01_1_ENG_003",
  type: "audio_choice",
  skill: "listening",
  content: {
    prompt: "Nghe rồi chọn",
    audio: "word.mp3",
    options: ["cat", "dog", "fish", "bird"],
    optionImages: ["cat.png", "dog.png", "fish.png", "bird.png"],
  },
  correctAnswer: "dog",
  assetRefs: ["word.mp3", "cat.png", "dog.png", "fish.png", "bird.png"],
});

export const Q_LETTER = q({
  id: "q-let-0004",
  code: "G1_W01_1_ENG_004",
  type: "missing_letter",
  content: {
    prompt: "Điền chữ còn thiếu",
    word: "hello",
    prefix: "h",
    suffix: "lo",
    blanks: 2,
    tiles: ["e", "l", "x", "y"],
  },
  correctAnswer: "el",
});

export const Q_DEPRECATED = q({
  id: "q-dep-0005",
  code: "G1_W01_1_ENG_005",
  type: "multiple_choice",
  content: { prompt: "Câu cũ", options: ["a", "b", "c", "d"] },
  correctAnswer: "a",
  status: "deprecated",
});

export const QUESTIONS = [Q_MC, Q_IMAGE, Q_AUDIO, Q_LETTER, Q_DEPRECATED];
