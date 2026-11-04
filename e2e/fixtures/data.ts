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

// Bài học Toán cho trang AI Sinh đề Toán (lessonType "calculation" có built-in qua nhóm "addition").
export const MATH_LESSON = {
  id: "44444444-4444-4444-8444-444444444444",
  courseId: "55555555-5555-4555-8555-555555555555",
  code: "G1_W01_MATH",
  week: 1,
  orderIndex: 1,
  name: "Phép cộng trong 10",
  lessonType: "calculation",
  skills: ["calculation"],
  status: "published",
  isPremium: false,
  vocabulary: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
export const MATH_LESSONS = [MATH_LESSON];

// Asset (R2) cho trang Kho asset.
function asset(key: string, type: "image" | "audio", size: number) {
  return {
    key,
    url: `https://cdn.studyvui.vn/${key}`,
    size,
    lastModified: "2026-01-01T00:00:00Z",
    type,
  };
}
export const ASSETS = [
  asset("grade1/english/cat.png", "image", 12345),
  asset("grade1/english/dog.png", "image", 23456),
  asset("audio/grade1/english/cat.mp3", "audio", 34567),
];

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

// ---- Fixture bổ sung cho e2e/questions-dom-golden.spec.ts (mục 93 Đợt 4b): phủ MỌI kiểu mà
// hộp thoại Thêm/Sửa câu hỏi và modal Xem thử rẽ nhánh. KHÔNG đổi hằng có sẵn ở trên. ----

// Bài không phải Tiếng Anh (mode json) và bài Toán Lớp 1 có catalog "Dạng bài" (cùng khoá học để
// dialog liệt kê được; mã "G1_W01_MATH" khớp MATH_ARCHETYPES_G1).
export const LESSON_PLAIN = {
  ...LESSON,
  id: "66666666-6666-4666-8666-666666666666",
  code: "G1_W02_1_VOCAB",
  name: "Từ vựng chung",
  skills: ["vocab", "grammar"],
};
export const LESSON_MATH_G1 = {
  ...LESSON,
  id: "77777777-7777-4777-8777-777777777777",
  code: "G1_W01_MATH",
  name: "Phép cộng trong 10",
  lessonType: "calculation",
  skills: ["calculation"],
};

export const Q_G_IMAGE_PER = q({
  id: "q-gimp-0010",
  code: "G1_W01_1_ENG_010",
  type: "image_choice",
  content: { prompt: "Chọn ảnh đúng", image: "apple.png", options: ["apple", "banana", "cherry", "grape"] },
  correctAnswer: "banana",
  assetRefs: ["apple.png", "banana.png", "cherry.png", "grape.png"],
});
export const Q_G_AUDIO_PLAIN = q({
  id: "q-gaud-0011",
  code: "G1_W01_1_ENG_011",
  type: "audio_choice",
  skill: "listening",
  content: { prompt: "", audio: "word.mp3", options: ["cat", "dog", "fish", "bird"], optionImages: ["cat.png"] },
  correctAnswer: "cat",
  assetRefs: ["word.mp3", "cat.png"],
});
export const Q_G_LETTER = q({
  id: "q-glet-0012",
  code: "G1_W01_1_ENG_012",
  type: "missing_letter",
  content: {
    prompt: "",
    word: "hello",
    pattern: "h__lo",
    prefix: "h",
    suffix: "lo",
    blanks: 2,
    tiles: ["e", "l", "x", "y"],
  },
  correctAnswer: "el",
  assetRefs: ["hello.mp3"],
});
export const Q_G_REORDER = q({
  id: "q-gre-0013",
  code: "G1_W01_1_ENG_013",
  type: "reorder",
  content: {
    prompt: "Sắp xếp thành câu",
    items: ["pen", "a", "is", "It"],
    correct_order: ["It", "is", "a", "pen"],
  },
  correctAnswer: "It is a pen",
  assetRefs: ["g1_sent_pen.mp3"],
});
export const Q_G_MATCHING = q({
  id: "q-gmat-0014",
  code: "G1_W01_1_ENG_014",
  type: "matching",
  content: {
    prompt: "Nối câu hỏi với câu trả lời",
    image: "g1_sent_name_nam.webp",
    pair: { left: "What is your name?", right: "I am Nam" },
    distractors: [
      { left: "What is this?", right: "It is a pen" },
      { left: "How old are you?", right: "I am six" },
    ],
    pairs: [
      ["What is your name?", "I am Nam"],
      ["What is this?", "It is a pen"],
      ["How old are you?", "I am six"],
    ],
  },
  correctAnswer: "What is your name?|I am Nam",
  assetRefs: ["g1_sent_name_nam.webp"],
});
export const Q_G_MATCHING_LEGACY = q({
  id: "q-gmatl-0015",
  code: "G1_W01_1_ENG_015",
  type: "matching",
  content: { prompt: "Cũ", pairs: [] },
  correctAnswer: "",
});
export const Q_G_FILL_BLANK = q({
  id: "q-gfb-0016",
  code: "G1_W01_1_ENG_016",
  type: "fill_blank",
  content: {
    prompt: "Chọn từ đúng",
    prefix: "It is a",
    suffix: "",
    answer: "pen",
    distractors: ["book", "bag"],
    options: ["pen", "book", "bag"],
  },
  correctAnswer: "pen",
});
export const Q_G_COUNT = q({
  id: "q-gcnt-0017",
  code: "G1_W01_1_ENG_017",
  type: "count_objects",
  skill: "counting",
  content: { prompt: "Có bao nhiêu quả táo?", options: ["2", "3", "4", "5"] },
  correctAnswer: "3",
  assetRefs: ["apples3.png"],
});
export const Q_G_NUMREC = q({
  id: "q-gnum-0018",
  code: "G1_W01_1_ENG_018",
  type: "number_recognition",
  skill: "counting",
  content: { prompt: "Số này là số mấy?" },
  correctAnswer: "7",
  assetRefs: ["seven.png"],
});
export const Q_G_COMPARE = q({
  id: "q-gcmp-0019",
  code: "G1_W01_1_ENG_019",
  type: "compare_numbers",
  skill: "comparison",
  content: { prompt: "So sánh", numbers: [3, 5] },
  correctAnswer: "<",
});
export const Q_G_JSON = q({
  id: "q-gjson-0020",
  code: "G1_W01_1_ENG_020",
  type: "unknown_type",
  content: { prompt: "Kiểu lạ", foo: 1, nested: { a: [1, 2] } },
  correctAnswer: "x",
});
export const Q_G_JSON_OPTS = q({
  id: "q-gjsono-0021",
  code: "G1_W01_1_ENG_021",
  type: "unknown_type",
  content: { prompt: "Lạ có lựa chọn", options: ["u", "v"] },
  correctAnswer: "u",
  assetRefs: ["x.png", "y.mp3"],
});

/** Bộ câu hỏi đầy đủ mọi kiểu cho golden (cùng lesson ENG). */
export const QUESTIONS_GOLDEN = [
  Q_MC,
  Q_IMAGE,
  Q_AUDIO,
  Q_LETTER,
  Q_G_IMAGE_PER,
  Q_G_AUDIO_PLAIN,
  Q_G_LETTER,
  Q_G_REORDER,
  Q_G_MATCHING,
  Q_G_MATCHING_LEGACY,
  Q_G_FILL_BLANK,
  Q_G_COUNT,
  Q_G_NUMREC,
  Q_G_COMPARE,
  Q_G_JSON,
  Q_G_JSON_OPTS,
];

// Cấu hình hệ thống + hồ sơ cá nhân cho trang Cài đặt (Settings, GĐ1).
export const SETTINGS_FIXTURE = [
  {
    id: "s-maintenance",
    key: "system.maintenance_mode",
    value: false,
    valueType: "boolean",
    category: "system",
    label: "Chế độ bảo trì",
    description: "Tạm khoá truy cập học sinh khi bật.",
    isPublic: false,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "s-max-upload",
    key: "system.max_upload_mb",
    value: 20,
    valueType: "number",
    category: "system",
    label: "Giới hạn upload (MB)",
    description: null,
    isPublic: false,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "s-support-email",
    key: "general.support_email",
    value: "support@studyvui.vn",
    valueType: "string",
    category: "general",
    label: "Email hỗ trợ",
    description: null,
    isPublic: true,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export const PROFILE_FIXTURE = {
  id: "u-admin",
  email: "admin@studyvui.vn",
  name: "Admin E2E",
  role: "admin",
  avatarUrl: null,
};

// Người dùng (GĐ2 Quản lý người dùng) — id "u-admin" TRÙNG với USERS.admin trong
// e2e/helpers/auth.ts (loginAs) để test được kịch bản "tự bảo vệ" (ẩn nút Khoá/Xoá dòng chính mình).
export const USER_ADMIN_SELF = {
  id: "u-admin",
  email: "admin@studyvui.vn",
  name: "Admin E2E",
  role: "admin",
  isActive: true,
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  deletedAt: null,
};

export const USER_STUDENT = {
  id: "u-student-0001",
  email: "student1@studyvui.vn",
  name: "Học sinh Một",
  role: "student",
  isActive: true,
  avatarUrl: null,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-01-15T00:00:00Z",
  deletedAt: null,
};

export const USER_TEACHER_INACTIVE = {
  id: "u-teacher-0002",
  email: "teacher2@studyvui.vn",
  name: "Giáo viên Hai",
  role: "teacher",
  isActive: false,
  avatarUrl: null,
  createdAt: "2026-02-01T00:00:00Z",
  updatedAt: "2026-02-01T00:00:00Z",
  deletedAt: null,
};

export const USERS_LIST_FIXTURE = {
  items: [USER_ADMIN_SELF, USER_STUDENT, USER_TEACHER_INACTIVE],
  total: 3,
  page: 1,
  limit: 20,
};

export const USER_STATS_FIXTURE = {
  total: 3,
  byRole: {
    student: 1,
    parent: 0,
    teacher: 1,
    editor: 0,
    admin: 1,
    qa: 0,
    support: 0,
  },
  active: 2,
  inactive: 1,
  deleted: 0,
  newLast30Days: 1,
};

// Lưới golden mục 93 Đợt 4c (e2e/dot4c-dom-golden.spec.ts): đủ trạng thái cho bảng Người dùng.
// VIP tính theo đồng hồ đóng băng 2026-11-04 trong spec.
export const USER_STUDENT_VIP_ACTIVE = {
  ...USER_STUDENT,
  id: "u-student-vip-0003",
  email: "student3@studyvui.vn",
  name: "Học sinh Ba VIP",
  vipUntil: "2026-12-31T00:00:00Z",
};

export const USER_STUDENT_VIP_EXPIRED = {
  ...USER_STUDENT,
  id: "u-student-vip-0004",
  email: "student4@studyvui.vn",
  name: "Học sinh Bốn hết hạn",
  vipUntil: "2026-10-01T00:00:00Z",
};

export const USER_PARENT = {
  ...USER_STUDENT,
  id: "u-parent-0005",
  email: "parent5@studyvui.vn",
  name: "Phụ huynh Năm",
  role: "parent",
};

export const USER_DELETED = {
  ...USER_STUDENT,
  id: "u-deleted-0006",
  email: "deleted6@studyvui.vn",
  name: "Người dùng đã xoá",
  isActive: false,
  deletedAt: "2026-03-01T00:00:00Z",
};

export const USERS_GOLDEN_FIXTURE = {
  items: [
    USER_ADMIN_SELF,
    USER_STUDENT,
    USER_TEACHER_INACTIVE,
    USER_STUDENT_VIP_ACTIVE,
    USER_STUDENT_VIP_EXPIRED,
    USER_PARENT,
    USER_DELETED,
  ],
  total: 7,
  page: 1,
  limit: 20,
};

export const USERS_ONLY_DELETED_FIXTURE = {
  items: [USER_DELETED],
  total: 1,
  page: 1,
  limit: 20,
};

export const USERS_PAGED_FIXTURE = {
  items: Array.from({ length: 20 }, (_, i) => ({
    ...USER_STUDENT,
    id: `u-paged-${String(i + 1).padStart(4, "0")}`,
    email: `paged${i + 1}@studyvui.vn`,
    name: `Học sinh trang ${i + 1}`,
  })),
  total: 45,
  page: 1,
  limit: 20,
};

export const USERS_EMPTY_FIXTURE = { items: [], total: 0, page: 1, limit: 20 };

// Bài học Toán các lớp / loại bài cho lưới golden trang AI Sinh đề Toán (mã G{lớp}_W{tuần}_MATH).
function mathLesson(code: string, grade: number, week: number, lessonType: string, name: string) {
  return {
    ...MATH_LESSON,
    id: `4444${grade}${String(week).padStart(2, "0")}-4444-4444-8444-444444444444`,
    code,
    week,
    name,
    lessonType,
    skills: [lessonType],
  };
}
export const MATH_LESSONS_GOLDEN = [
  MATH_LESSON,
  mathLesson("G1_W02_MATH", 1, 2, "sequence", "Dãy số"),
  mathLesson("G1_W03_MATH", 1, 3, "comparison", "So sánh số"),
  mathLesson("G2_W01_MATH", 2, 1, "calculation", "Cộng trừ trong 100"),
  mathLesson("G3_W01_MATH", 3, 1, "area", "Diện tích"),
  mathLesson("G4_W01_MATH", 4, 1, "division", "Phép chia"),
  mathLesson("G5_W01_MATH", 5, 1, "decimal", "Số thập phân"),
];

// Bài học Tiếng Anh có từ vựng đủ nghĩa / ảnh / audio để trang AI Sinh đề sinh được cả 3 chế độ.
const VOCAB_GOLDEN = ["cat", "dog", "bird", "fish", "frog", "duck"].map((w, i) => ({
  word: w,
  meaning: ["con mèo", "con chó", "con chim", "con cá", "con ếch", "con vịt"][i],
  imageUrl: `https://cdn.studyvui.vn/grade1/english/${w}.png`,
  audioUrl: `https://cdn.studyvui.vn/audio/grade1/english/${w}.mp3`,
}));
export const LESSON_ENG_RICH = { ...LESSON, vocabulary: VOCAB_GOLDEN };
// Tuần 2: kỹ năng "phonics" (lọc danh sách Kỹ năng) và bài học có kỹ năng KHÔNG map được (tuần 3).
export const LESSON_ENG_PHONICS = {
  ...LESSON,
  id: "22222222-2222-4222-8222-222222222223",
  code: "G1_W02_1_ENG",
  week: 2,
  orderIndex: 2,
  name: "Âm đầu",
  skills: ["phonics"],
  vocabulary: VOCAB_GOLDEN.slice(0, 4),
};
export const LESSON_ENG_UNMAPPED = {
  ...LESSON,
  id: "22222222-2222-4222-8222-222222222224",
  code: "G1_W03_1_ENG",
  week: 3,
  orderIndex: 3,
  name: "Kỹ năng lạ",
  skills: ["xyz"],
  vocabulary: VOCAB_GOLDEN.slice(0, 4),
};
export const LESSONS_ENG_GOLDEN = [LESSON_ENG_RICH, LESSON_ENG_PHONICS, LESSON_ENG_UNMAPPED];
export const ASSETS_ENG_GOLDEN = VOCAB_GOLDEN.map((v) => ({
  key: `grade1/english/${v.word}.png`,
  url: `https://cdn.studyvui.vn/grade1/english/${v.word}.png`,
  size: 1000,
  lastModified: "2026-01-01T00:00:00Z",
  type: "image" as const,
}));

export const MATH_USER_TEMPLATE = {
  id: "tpl-user-0001",
  lessonType: "calculation",
  skill: "calculation",
  grade: 1,
  text: "Tính: {a} + {b} = ?",
  formula: "a + b",
  condition: "a + b <= 10",
  vars: [
    { name: "a", type: "number", min: 1, max: 5 },
    { name: "b", type: "number", min: 1, max: 5 },
  ],
  distractorCount: 3,
  source: "user",
};

// Báo cáo phân tích (GĐ3) — fixture cho e2e/analytics.spec.ts.

export const ANALYTICS_OVERVIEW_FIXTURE = {
  dau: 12,
  wau: 45,
  mau: 120,
  answersLast30Days: 3200,
  accuracyLast30Days: 0.782,
};

export const ANALYTICS_ACTIVE_LEARNERS_30D = [
  { day: "2026-09-02", learners: 18 },
  { day: "2026-09-03", learners: 22 },
  { day: "2026-09-04", learners: 15 },
];

export const ANALYTICS_ACTIVE_LEARNERS_7D = [
  { day: "2026-09-03", learners: 22 },
  { day: "2026-09-04", learners: 15 },
];

export const ANALYTICS_WEEKLY_MINUTES_FIXTURE = [
  { weekStart: "2026-08-24", label: "24/08 - 30/08", learners: 40, avgMinutesPerLearner: 22.5 },
  { weekStart: "2026-08-31", label: "31/08 - 06/09", learners: 45, avgMinutesPerLearner: 25.1 },
];

export const ANALYTICS_HOUR_HISTOGRAM_FIXTURE = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  answers: hour >= 18 && hour <= 21 ? 200 : 10,
}));

export const ANALYTICS_SUBJECT_SPLIT_FIXTURE = [
  { subject: "english", answers: 2000, correct: 1600, accuracy: 0.8, learners: 90 },
  { subject: "math", answers: 1200, correct: 900, accuracy: 0.75, learners: 60 },
];

export const ANALYTICS_PROBLEM_LESSONS_FIXTURE = [
  {
    id: "lesson-1",
    code: "ENG-G1-W3",
    name: "Bài 3: Colors",
    subject: "english",
    grade: 1,
    attempts: 150,
    wrong: 90,
    learners: 40,
    wrongRate: 0.6,
  },
];

// Chi tiết học viên hoạt động ngày 2026-09-03 (drill-down từ chart active-learners).
export const ANALYTICS_ACTIVE_LEARNERS_DETAIL_0903 = [
  {
    id: "u1",
    name: "Nguyễn Văn A",
    email: "a@studyvui.vn",
    answers: 10,
    correct: 8,
    accuracy: 0.8,
    mainSubject: "english",
  },
  {
    id: "u2",
    name: "Trần Thị B",
    email: "b@studyvui.vn",
    answers: 5,
    correct: 3,
    accuracy: 0.6,
    mainSubject: "math",
  },
];

export const NEWS_DRAFT = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "bai-nhap-e2e",
  type: "tip",
  title: "Bài nháp E2E",
  hook: null,
  content: "<p>Nội dung nháp</p>",
  image: null,
  status: "draft",
  source: "manual",
  publishedAt: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

export const NEWS_PUBLISHED = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "bai-da-dang-e2e",
  type: "update",
  title: "Bài đã đăng E2E",
  hook: "<i>Hook</i>",
  content: "<p>Nội dung đã đăng</p>",
  image: "https://cdn.studyvui.vn/news_images/e2e.jpg",
  status: "published",
  source: "manual",
  publishedAt: "2026-09-02T00:00:00Z",
  createdAt: "2026-09-02T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};

export const NEWS_LIST = [NEWS_PUBLISHED, NEWS_DRAFT];
