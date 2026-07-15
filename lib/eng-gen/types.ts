// ============================================================
// STUDYVUI — English Generator — Types
// Bộ sinh đề sinh từ TỪ VỰNG của bài học (page-generators.ts).
// Không phụ thuộc DOM/window — chạy được cả client & node (test).
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
