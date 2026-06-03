// ============================================================
// STUDYVUI — English Generator (TS port) — Types
// Port từ engine/english/* (vanilla) sang TypeScript thuần.
// Không phụ thuộc DOM/window — chạy được cả client & node (parity test).
// ============================================================

export type Skill = "vocabulary" | "phonics" | "sentence" | "listening" | "review";

export type BlueprintType =
  | "image_choice"
  | "audio_choice"
  | "missing_letter"
  | "reorder"
  | "match_word"
  | "true_false";

export type DistractorStrategy =
  | "same_topic"
  | "similar_spelling"
  | "similar_sound"
  | "same_letter_count"
  | "mixed";

export type Rng = () => number;

export interface Template {
  template_id: string;
  skill: Skill;
  blueprint_type: BlueprintType;
  difficulty_range: [number, number];
  vocab_pool: string[];
  phonics_pool: string[];
  sentence_pool: string[];
  question_text_pool: string[];
  answer_formula: string;
  distractor_strategy: DistractorStrategy;
  required_assets: string[];
  use_ai_wording: boolean;
  complexity_hint: number;
  // các field do difficulty engine gắn thêm (optional)
  phonics_complexity?: string;
  vocab_complexity?: string;
  distractor_similarity?: "low" | "medium" | "high";
  min_edit_distance?: number;
  sentence_words?: number;
  time_bonus_multiplier?: number;
  render_hint?: Record<string, unknown>;
  variable_rules?: Record<string, unknown>;
  _appliedDifficulty?: number;
}

export interface RenderSpec {
  blueprint_type: BlueprintType;
  vocab_word: string | null;
  image_path: string | null;
  audio_path: string | null;
  missing_word: string | null;
  gap_position: number | null;
  correct_letter: string | null;
  sentence_words: string[] | null;
  correct_order: string[] | null;
  displayed_sentence?: string;
  is_correct?: boolean;
}

export interface QuestionSpec {
  template_id: string;
  skill: Skill;
  blueprint_type: BlueprintType;
  difficulty_range: [number, number];
  distractor_strategy: DistractorStrategy;
  required_assets: string[];
  use_ai_wording: boolean;
  complexity_hint: number;
  question_text: string;
  vocab_word: string | null;
  correct_answer: string;
  distractors: string[];
  render_spec: RenderSpec;
  vars: { word: string | null; grade: number; week: number; topic?: string };
  seed: number;
}

export type LifecycleStatus = "draft" | "approved" | "rejected";

export interface GeneratedQuestion {
  id: string;
  grade: number;
  week: number;
  skill: Skill;
  blueprintType: BlueprintType;
  blueprint_type: BlueprintType;
  difficulty: number;
  lifecycleStatus: LifecycleStatus;
  components: {
    stem: string;
    vocab: string;
    meaning: string | null;
    distractors: string[];
    assets: { image: string; audio: string };
  };
  correct_answer: string;
  render_spec: RenderSpec | null;
  variable_values: Record<string, unknown>;
  distractor_strategy: DistractorStrategy;
  template_id: string;
  syncStatus: string;
  tags: string[];
  errorLog?: string;
  _qa_score?: number;
}

export interface GenReport {
  generated: number;
  duplicates: number;
  qa_failed: number;
  missing_assets: string[];
  skill?: Skill;
  blueprintType?: BlueprintType;
  week?: number;
  grade?: number;
}

export interface GenParams {
  grade?: number;
  week?: number;
  skill?: Skill;
  blueprintType?: BlueprintType;
  count?: number;
  difficultyRange?: [number, number];
  options?: { useAIWording?: boolean; seed?: number | null; wordList?: string[] };
}
