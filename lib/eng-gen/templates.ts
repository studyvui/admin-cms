// ============================================================
// STUDYVUI — Template Registry + 9 templates (TS port).
// Gộp _index.js + 7 file template (vocab_image/audio/match, phonics,
// sentence_reorder, listening_audio, review_mixed) — đều là data.
// ============================================================
import type { Template, Skill, BlueprintType, DistractorStrategy, Rng } from "./types";

type RawTemplate = Partial<Template> & { template_id: string };

function normalize(t: RawTemplate): Template {
  return {
    template_id: t.template_id,
    skill: (t.skill || "vocabulary") as Skill,
    blueprint_type: (t.blueprint_type || "image_choice") as BlueprintType,
    difficulty_range: Array.isArray(t.difficulty_range) ? t.difficulty_range : [1, 3],
    vocab_pool: Array.isArray(t.vocab_pool) ? t.vocab_pool : [],
    phonics_pool: Array.isArray(t.phonics_pool) ? t.phonics_pool : [],
    sentence_pool: Array.isArray(t.sentence_pool) ? t.sentence_pool : [],
    question_text_pool: Array.isArray(t.question_text_pool) ? t.question_text_pool : [],
    answer_formula: t.answer_formula || "vocab_word",
    distractor_strategy: (t.distractor_strategy || "same_topic") as DistractorStrategy,
    required_assets: Array.isArray(t.required_assets) ? t.required_assets : [],
    use_ai_wording: Boolean(t.use_ai_wording),
    complexity_hint: typeof t.complexity_hint === "number" ? t.complexity_hint : 1,
  };
}

// ── 9 template (data) — port y nguyên pools từ vanilla ────────
const RAW_TEMPLATES: RawTemplate[] = [
  // vocab_image_choice L1-L3
  {
    template_id: "vocab_image_choice_l1", skill: "vocabulary", blueprint_type: "image_choice",
    difficulty_range: [1, 1], distractor_strategy: "same_topic", required_assets: ["image"], complexity_hint: 1,
    question_text_pool: ["What is this?", "Look and choose.", "Which word matches the picture?", "Find the right word.", "Can you name this?", "Look at the picture. What is it?", "Choose the correct word.", "What word matches the picture?"],
  },
  {
    template_id: "vocab_image_choice_l2", skill: "vocabulary", blueprint_type: "image_choice",
    difficulty_range: [2, 2], distractor_strategy: "similar_spelling", required_assets: ["image"], complexity_hint: 2,
    question_text_pool: ["Which word matches the picture?", "Look carefully and choose.", "Find the right word for the picture.", "What word describes this picture?", "Choose the correct word.", "Pick the word that goes with the picture.", "Which word is correct?"],
  },
  {
    template_id: "vocab_image_choice_l3", skill: "vocabulary", blueprint_type: "image_choice",
    difficulty_range: [3, 3], distractor_strategy: "similar_sound", required_assets: ["image"], complexity_hint: 2,
    question_text_pool: ["Which word matches the picture?", "Look at the picture. Choose the right word.", "Find the correct word.", "What is the right name for this?", "Choose carefully. Which word is correct?", "Identify the correct word for this picture.", "Select the word that matches the image."],
  },
  // vocab_audio_choice L1-L2
  {
    template_id: "vocab_audio_choice_l1", skill: "vocabulary", blueprint_type: "audio_choice",
    difficulty_range: [1, 1], distractor_strategy: "same_topic", required_assets: ["audio"], complexity_hint: 1,
    question_text_pool: ["Listen and choose.", "What do you hear?", "Listen carefully and pick.", "Which word did you hear?", "Hear and select.", "Listen. Which word is it?", "Listen and find the word."],
  },
  {
    template_id: "vocab_audio_choice_l2", skill: "vocabulary", blueprint_type: "audio_choice",
    difficulty_range: [2, 2], distractor_strategy: "similar_sound", required_assets: ["audio"], complexity_hint: 2,
    question_text_pool: ["Listen carefully and choose.", "Which word do you hear?", "Listen. What is the word?", "Hear the word and pick the right one.", "Listen and select the correct word.", "Which word matches what you heard?", "Listen again and choose."],
  },
  // vocab_match_word L1-L2
  {
    template_id: "vocab_match_word_l1", skill: "vocabulary", blueprint_type: "match_word",
    difficulty_range: [1, 1], distractor_strategy: "same_topic", required_assets: ["image"], complexity_hint: 1,
    answer_formula: "matched_word",
    question_text_pool: ["Match the word to the picture.", "Find the right picture.", "Connect word and image.", "Which picture goes with this word?", "Match word to picture.", "Find the picture for this word.", "Which picture shows this word?"],
  },
  {
    template_id: "vocab_match_word_l2", skill: "vocabulary", blueprint_type: "match_word",
    difficulty_range: [2, 2], distractor_strategy: "same_topic", required_assets: ["image"], complexity_hint: 2,
    answer_formula: "matched_word",
    question_text_pool: ["Match the word to the correct picture.", "Find the picture that matches.", "Which picture goes with this word?", "Connect the word to its picture.", "Look carefully. Match word to picture.", "Find the right image for this word.", "Select the matching picture."],
  },
  // phonics_missing_letter L1-L3
  {
    template_id: "phonics_missing_letter_l1", skill: "phonics", blueprint_type: "missing_letter",
    difficulty_range: [1, 1], distractor_strategy: "similar_sound", required_assets: [], complexity_hint: 1,
    answer_formula: "correct_letter",
    phonics_pool: ["_at", "_og", "_ig", "_un", "_en", "c_t", "d_g", "h_t", "r_n", "s_n", "p_n", "t_p", "c_p", "m_p", "b_g", "_it", "_op", "_up", "b_t", "f_n"],
    question_text_pool: ["Fill in the missing letter.", "Complete the word.", "What letter is missing?", "Choose the correct letter.", "Which letter completes the word?", "Find the missing letter.", "Add the missing letter to complete the word."],
  },
  {
    template_id: "phonics_missing_letter_l2", skill: "phonics", blueprint_type: "missing_letter",
    difficulty_range: [2, 2], distractor_strategy: "similar_sound", required_assets: [], complexity_hint: 2,
    answer_formula: "correct_letter",
    phonics_pool: ["fr_g", "sl_p", "cr_b", "dr_m", "gr_b", "fl_g", "bl_t", "cl_p", "pl_g", "tr_p", "st_p", "sk_p", "sw_m", "sn_p", "sc_n", "sp_t", "sm_g", "sl_d", "br_g", "cr_p"],
    question_text_pool: ["What letter is missing?", "Fill in the missing letter.", "Complete the word.", "Choose the correct letter.", "Which letter completes the word?", "Find the missing letter to complete the word.", "Pick the letter that fits."],
  },
  {
    template_id: "phonics_missing_letter_l3", skill: "phonics", blueprint_type: "missing_letter",
    difficulty_range: [3, 3], distractor_strategy: "similar_sound", required_assets: [], complexity_hint: 3,
    answer_formula: "correct_letter",
    phonics_pool: ["ban_", "han_", "lis_", "mis_", "pas_", "li_t", "fi_t", "be_t", "bo_t", "du_t", "cl_mp", "tr_mp", "st_mp", "cr_ft", "dr_ft", "spl_t", "spr_g", "str_p", "scr_p", "shr_d"],
    question_text_pool: ["Which letter completes the word?", "Fill in the missing letter.", "What letter is missing?", "Choose the correct letter to complete.", "Find the missing letter.", "Which letter fits here?", "Complete the word by choosing the right letter."],
  },
  // sentence_reorder L1-L2
  {
    template_id: "sentence_reorder_l1", skill: "sentence", blueprint_type: "reorder",
    difficulty_range: [1, 1], distractor_strategy: "mixed", required_assets: [], complexity_hint: 1,
    answer_formula: "ordered_sentence",
    sentence_pool: ["I am happy", "She is tall", "He can run", "I like cats", "It is red", "We are here", "I see you", "She has books", "He is big", "I love dogs", "She can sing", "He eats rice", "I am good", "We play ball", "It is hot"],
    question_text_pool: ["Put the words in order.", "Make a sentence.", "Arrange the words.", "Fix the sentence.", "Put the words in the correct order.", "Arrange the words to make a sentence.", "Order the words correctly."],
  },
  {
    template_id: "sentence_reorder_l2", skill: "sentence", blueprint_type: "reorder",
    difficulty_range: [2, 2], distractor_strategy: "mixed", required_assets: [], complexity_hint: 2,
    answer_formula: "ordered_sentence",
    sentence_pool: ["The cat is big", "I like apples", "He can run fast", "We go to school", "My dog is cute", "I see a bird", "They play games", "The sun is hot", "She has a book", "He is very tall", "I have two cats", "She likes to read", "We eat lunch now", "He plays with toys", "I am at home"],
    question_text_pool: ["Put the words in order.", "Arrange the words to make a sentence.", "Fix the sentence.", "Make a correct sentence.", "Put the words in the right order.", "Order the words to form a sentence.", "Rearrange the words correctly."],
  },
  // listening_audio_choice L1-L2
  {
    template_id: "listening_audio_choice_l1", skill: "listening", blueprint_type: "audio_choice",
    difficulty_range: [1, 1], distractor_strategy: "same_topic", required_assets: ["audio"], complexity_hint: 1,
    question_text_pool: ["Listen and choose.", "What did you hear?", "Listen and pick.", "Choose what you heard.", "Listen. What is it?", "Hear and choose the right answer.", "Listen carefully and select."],
  },
  {
    template_id: "listening_audio_choice_l2", skill: "listening", blueprint_type: "audio_choice",
    difficulty_range: [2, 2], distractor_strategy: "similar_sound", required_assets: ["audio"], complexity_hint: 2,
    question_text_pool: ["Listen carefully and choose.", "What did you hear?", "Listen and pick the right answer.", "Choose what you heard.", "Listen again and choose.", "Hear the sentence and select.", "Listen and find the correct answer."],
  },
  // review_mixed
  {
    template_id: "review_image_choice", skill: "review", blueprint_type: "image_choice",
    difficulty_range: [1, 2], distractor_strategy: "mixed", required_assets: ["image"], complexity_hint: 2,
    question_text_pool: ["Review time! What is this?", "Let's review! Choose correctly.", "Remember this word?", "Which word is correct?", "Review: Look and choose.", "Do you remember this? Choose the right word.", "Time to review! What word is this?"],
  },
  {
    template_id: "review_audio_choice", skill: "review", blueprint_type: "audio_choice",
    difficulty_range: [1, 2], distractor_strategy: "mixed", required_assets: ["audio"], complexity_hint: 2,
    question_text_pool: ["Review time! Listen and choose.", "Let's review! What did you hear?", "Remember this word? Listen and pick.", "Which word is correct?", "Review: Listen and select.", "Do you remember this? Listen carefully.", "Time to review! Choose what you heard."],
  },
];

const STORE: Template[] = RAW_TEMPLATES.map(normalize);

export function loadTemplates(
  skill: Skill | null,
  blueprintType: BlueprintType | null,
  difficultyRange: [number, number],
): Template[] {
  const [minD, maxD] = Array.isArray(difficultyRange) ? difficultyRange : [1, 3];
  return STORE.filter((t) => {
    if (skill && t.skill !== skill) return false;
    if (blueprintType && t.blueprint_type !== blueprintType) return false;
    const [tMin, tMax] = t.difficulty_range;
    return tMax >= minD && tMin <= maxD;
  });
}

export function pickRandomTemplate(
  skill: Skill,
  blueprintType: BlueprintType | null,
  difficultyRange: [number, number],
  rng: Rng,
): Template | null {
  const pool = loadTemplates(skill, blueprintType, difficultyRange);
  if (pool.length === 0) return null;
  const r = typeof rng === "function" ? rng() : Math.random();
  return pool[Math.floor(r * pool.length)];
}

export function getAllTemplates(): Template[] {
  return STORE.slice();
}
