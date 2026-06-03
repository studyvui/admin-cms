// ============================================================
// STUDYVUI — Distractor Engine v2 (TS port của distractor_engine_v2.js)
// 5 chiến thuật nhiễu. Data tables port y nguyên (parity).
// ============================================================
import type { Rng, DistractorStrategy } from "./types";
import { mulberry32 } from "./rng";

function _shuffle<T>(arr: T[], rng?: Rng): T[] {
  const a = arr.slice();
  const rand = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _lower(w: string): string {
  return (w || "").toLowerCase().trim();
}

function _filterOut(arr: string[], target: string): string[] {
  const t = _lower(target);
  const seen = new Set<string>();
  return arr.filter((w) => {
    const k = _lower(w);
    if (k === t || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const WORD_BANKS: Record<string, string[]> = {
  greetings: ["hello", "goodbye", "hi", "bye", "thanks", "please", "sorry", "yes", "no", "okay"],
  animals: ["cat", "dog", "fish", "bird", "duck", "rabbit", "elephant", "lion", "monkey", "bear", "tiger", "cow", "pig", "horse", "frog", "snake", "deer", "fox", "wolf", "sheep"],
  fruits: ["apple", "banana", "orange", "grape", "mango", "strawberry", "lemon", "pear", "watermelon", "cherry", "peach", "plum", "kiwi", "coconut"],
  vegetables: ["carrot", "potato", "tomato", "onion", "corn", "pea", "bean", "pepper", "cucumber", "broccoli", "cabbage", "lettuce"],
  colors: ["red", "blue", "green", "yellow", "purple", "orange", "pink", "black", "white", "brown", "gray", "gold", "silver"],
  body_parts: ["hand", "head", "leg", "arm", "eye", "ear", "nose", "mouth", "finger", "foot", "back", "neck", "knee", "shoulder", "toe"],
  school_items: ["pen", "pencil", "book", "bag", "ruler", "eraser", "desk", "chair", "board", "crayon", "notebook", "scissors", "glue"],
  family: ["mother", "father", "brother", "sister", "baby", "grandmother", "grandfather", "uncle", "aunt", "cousin", "parent", "child"],
  food: ["milk", "bread", "egg", "rice", "soup", "cake", "cookie", "juice", "water", "meat", "fish", "noodle", "cheese", "butter"],
  clothing: ["shirt", "pants", "shoes", "hat", "socks", "dress", "coat", "jacket", "skirt", "belt", "glove", "scarf", "boots"],
  transport: ["car", "bus", "bike", "boat", "plane", "train", "truck", "ship", "taxi", "van", "helicopter", "subway"],
  weather: ["sun", "rain", "cloud", "wind", "snow", "storm", "fog", "hot", "cold", "warm", "dry", "wet", "rainbow"],
  numbers: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "zero"],
  actions: ["run", "jump", "sit", "stand", "walk", "eat", "drink", "sleep", "play", "read", "write", "draw", "sing", "dance"],
  shapes: ["circle", "square", "triangle", "rectangle", "star", "heart", "oval", "diamond", "pentagon", "hexagon"],
  places: ["school", "home", "park", "store", "hospital", "beach", "zoo", "farm", "city", "library", "market", "restaurant"],
};

const WORD_TO_CATEGORY: Record<string, string> = {};
Object.keys(WORD_BANKS).forEach((cat) => {
  WORD_BANKS[cat].forEach((w) => {
    if (!WORD_TO_CATEGORY[w]) WORD_TO_CATEGORY[w] = cat;
  });
});

const GRADE1_WORDLIST: string[] = [
  "ant", "ape", "art", "ask", "ate", "axe", "add",
  "bad", "bag", "ban", "bat", "bay", "bed", "big", "bit", "box", "bug", "bus", "but", "buy",
  "can", "cap", "car", "cat", "cop", "cot", "cow", "cry", "cup", "cut",
  "dad", "dam", "did", "dig", "dim", "dip", "dog", "dot", "dry", "dug",
  "ear", "eat", "egg", "end", "eve",
  "fan", "far", "fat", "fed", "few", "fig", "fin", "fit", "fix", "fly", "fog", "for", "fun",
  "gag", "gap", "gas", "get", "got", "gum", "gun", "gut",
  "had", "ham", "has", "hat", "hay", "hen", "her", "him", "his", "hit", "hog", "hop", "hot", "how", "hug", "hum", "hut",
  "ice", "ill", "inn", "ivy",
  "jab", "jag", "jam", "jar", "jaw", "jet", "job", "jog", "joy", "jug",
  "keg", "key", "kid", "kin", "kit",
  "lab", "lad", "lag", "lap", "law", "lay", "led", "leg", "let", "lid", "lip", "lit", "log", "lot", "low",
  "mad", "man", "map", "mat", "men", "met", "mob", "mop", "mud", "mug",
  "nab", "nag", "nap", "net", "nip", "nod", "not", "now", "nun", "nut",
  "oak", "oar", "odd", "off", "oil", "old", "one", "opt", "orb", "ore", "our", "out", "own",
  "pad", "pan", "pap", "pat", "pay", "pea", "peg", "pen", "pet", "pie", "pig", "pin", "pit", "pod", "pop", "pot", "pun", "pup", "put",
  "rag", "ram", "ran", "rap", "rat", "raw", "ray", "red", "ref", "rep", "rid", "rig", "rip", "rob", "rod", "rot", "row", "rub", "rug", "rum", "run", "rut",
  "sac", "sad", "sag", "sap", "sat", "saw", "say", "sea", "set", "sew", "sin", "sip", "sir", "sit", "six", "ski", "sky", "sly", "sob", "son", "sow", "spy", "sub", "sue", "sum", "sun", "sup",
  "tab", "tag", "tan", "tap", "tar", "tax", "tea", "ten", "tie", "tin", "tip", "toe", "too", "top", "toy", "try", "tub", "tug", "two",
  "urn", "use",
  "van", "vat", "vet", "via", "vow",
  "wag", "war", "was", "wax", "way", "web", "wed", "wet", "who", "why", "wig", "win", "wit", "woe", "wok", "won", "woo",
  "yak", "yam", "yap", "yaw", "yen", "yew", "you",
  "zap", "zen", "zip", "zoo",
  "able", "acre", "age", "ago", "aid", "aim", "air", "all", "also", "away",
  "back", "ball", "band", "base", "bath", "bear", "beat", "been", "bell", "best", "bird", "blow", "blue", "boat", "body", "bold", "bond", "born", "both",
  "call", "came", "camp", "care", "case", "cast", "cave", "city", "clam", "clap", "clay", "clip", "club", "coal", "coat", "code", "cold", "come", "cook", "cool", "copy", "core", "corn", "cost", "crab", "crew", "crop",
  "dark", "data", "date", "days", "dead", "deal", "dear", "deep", "diet", "dirt", "dish", "done", "door", "down", "drag", "draw", "drew", "drop", "drum", "dusk", "dust", "duty",
  "each", "edge", "else", "even", "ever", "evil", "exam", "exit",
  "face", "fact", "fail", "fall", "farm", "fast", "fear", "feel", "feet", "fell", "felt", "fill", "film", "find", "fine", "fire", "firm", "five", "flat", "flew", "flip", "flow", "foam", "fold", "fond", "fore", "fork", "form", "fort", "four", "free", "from", "fuel", "full",
  "gain", "game", "gave", "gear", "give", "glad", "glow", "glue", "goal", "good", "grab", "gray", "grew", "grid", "grin", "grip", "grow", "gulf", "guru",
  "half", "hall", "hang", "hard", "harm", "harp", "have", "heal", "heap", "heat", "heel", "help", "here", "hero", "hide", "high", "hill", "hint", "hold", "hole", "holy", "home", "hood", "hook", "hope", "horn", "hose", "hour", "huge", "hunt",
  "idea", "into",
  "join", "joke", "jump", "just",
  "keep", "kick", "kind", "king", "knee", "knew", "know",
  "lack", "lake", "land", "lane", "last", "late", "leaf", "leak", "lean", "leap", "left", "like", "lime", "line", "link", "list", "live", "load", "lock", "loft", "logo", "lone", "long", "look", "loop", "lose", "lost", "love", "luck", "lung",
  "made", "mail", "main", "make", "male", "mall", "mane", "many", "mark", "mask", "mass", "mast", "mate", "meal", "mean", "meet", "melt", "menu", "mess", "mild", "mile", "mind", "mine", "miss", "mode", "mold", "mole", "monk", "moon", "more", "moss", "most", "move", "much", "must",
  "nail", "name", "near", "neck", "need", "next", "nice", "node", "none", "noon", "norm", "note", "nova",
  "once", "only", "open", "over", "oven",
  "pace", "page", "pain", "pair", "palm", "park", "part", "pass", "past", "path", "peak", "peel", "peer", "pick", "pile", "pink", "pipe", "plan", "play", "plea", "plot", "plow", "plug", "plum", "plus", "poem", "poet", "pole", "pool", "poor", "pore", "port", "pose", "post", "pour", "pray", "prey", "prod", "prop", "pull", "pump", "pure", "push",
  "race", "rack", "rage", "raid", "rail", "rain", "rake", "rank", "rare", "rate", "real", "reef", "reel", "rely", "rent", "rest", "rice", "rich", "ride", "ring", "rise", "risk", "road", "roam", "roar", "role", "roll", "roof", "root", "rope", "rose", "rule", "rush",
  "safe", "sail", "sale", "salt", "same", "sand", "sane", "save", "scan", "scar", "seal", "seed", "seek", "self", "sell", "send", "sent", "shed", "ship", "shop", "shot", "show", "shut", "sick", "side", "sign", "silk", "sing", "sink", "size", "skin", "skip", "slam", "slap", "slid", "slip", "slow", "slug", "slum", "snap", "snow", "soar", "sock", "soft", "soil", "sold", "sole", "some", "song", "soon", "sort", "soul", "soup", "sour", "span", "spin", "spit", "spot", "spur", "stab", "star", "stay", "stem", "step", "stew", "stir", "stop", "stor", "stub", "stun", "such", "suit", "sure", "swap", "swim", "swam", "swum",
  "tail", "tale", "talk", "tall", "tame", "tank", "tape", "task", "team", "tear", "tell", "tent", "term", "test", "text", "than", "that", "them", "then", "they", "thin", "this", "tick", "tide", "till", "time", "tire", "toad", "told", "toll", "tomb", "tone", "tong", "took", "torn", "town", "trap", "tree", "trim", "trip", "trod", "true", "tube", "tune", "turn",
  "ugly", "upon",
  "vane", "vast", "vein", "very", "view", "vine", "void", "volt",
  "wade", "wage", "wait", "wake", "walk", "wall", "want", "ward", "warn", "wart", "wave", "weak", "wear", "week", "well", "went", "were", "west", "when", "wide", "wife", "wild", "will", "wind", "wine", "wing", "wire", "wish", "with", "wolf", "wood", "wool", "word", "wore", "work", "worm", "worn", "wrap", "wren",
  "yell", "your",
  "zero", "zone",
];

function _levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

const RHYME_GROUPS: Record<string, string[]> = {
  "-at": ["cat", "bat", "hat", "mat", "rat", "sat", "fat", "pat", "flat", "that", "chat", "splat"],
  "-og": ["dog", "fog", "log", "hog", "frog", "bog", "cog", "jog"],
  "-ig": ["big", "pig", "wig", "dig", "fig", "jig", "twig", "sprig"],
  "-un": ["sun", "run", "fun", "bun", "gun", "nun", "pun", "spun", "stun"],
  "-en": ["hen", "pen", "ten", "den", "men", "when", "then", "wren"],
  "-ot": ["hot", "pot", "dot", "got", "lot", "not", "rot", "cot", "jot", "knot"],
  "-it": ["bit", "sit", "hit", "kit", "lit", "pit", "wit", "fit", "spit", "grit"],
  "-in": ["bin", "fin", "pin", "tin", "win", "chin", "thin", "spin", "skin", "grin"],
  "-op": ["hop", "mop", "pop", "top", "cop", "drop", "stop", "shop", "crop", "prop"],
  "-ed": ["bed", "fed", "led", "red", "wed", "bread", "head", "dead", "said", "read"],
  "-ell": ["bell", "fell", "tell", "well", "sell", "spell", "shell", "smell", "yell"],
  "-ack": ["back", "pack", "rack", "sack", "black", "crack", "snack", "track", "slack", "stack"],
  "-ake": ["cake", "lake", "make", "rake", "take", "wake", "shake", "snake", "brake", "flake"],
  "-ile": ["file", "mile", "pile", "tile", "while", "smile", "style", "aisle"],
  "-ine": ["fine", "line", "mine", "nine", "pine", "vine", "wine", "shine", "spine", "dine"],
  "-ame": ["game", "name", "same", "fame", "came", "dame", "tame", "blame", "flame"],
  "-ide": ["ride", "side", "hide", "wide", "bride", "guide", "pride", "slide", "tide"],
  "-ike": ["bike", "hike", "like", "mike", "spike", "strike"],
  "-ole": ["hole", "mole", "pole", "role", "sole", "whole", "stole", "console"],
  "-one": ["bone", "cone", "lone", "tone", "zone", "stone", "phone", "throne"],
  "-oo": ["zoo", "boo", "too", "moo", "cool", "fool", "pool", "tool", "school", "moon", "noon", "soon", "spoon"],
  "-ee": ["see", "bee", "fee", "free", "tree", "three", "knee", "flee", "glee"],
  "-ay": ["day", "say", "way", "pay", "ray", "may", "play", "stay", "gray", "pray", "clay"],
  "-ow": ["cow", "now", "how", "bow", "row", "low", "blow", "flow", "grow", "show", "snow"],
  "-ight": ["night", "right", "light", "might", "fight", "sight", "bright", "flight", "tight"],
  "-all": ["ball", "call", "fall", "hall", "tall", "wall", "small", "stall"],
  "-ing": ["ring", "sing", "king", "wing", "bring", "string", "spring", "swing", "thing"],
  "-ang": ["bang", "hang", "rang", "sang", "gang", "fang"],
  "-ong": ["song", "long", "strong", "wrong", "gong", "prong"],
};

const WORD_TO_RHYME: Record<string, string[]> = {};
Object.keys(RHYME_GROUPS).forEach((group) => {
  RHYME_GROUPS[group].forEach((w) => {
    if (!WORD_TO_RHYME[w]) WORD_TO_RHYME[w] = [];
    WORD_TO_RHYME[w].push(group);
  });
});

const LETTER_VISUAL_GROUPS: Record<string, string[]> = {
  a: ["e", "o", "u"], b: ["d", "p", "q"], c: ["o", "e", "a"], d: ["b", "p", "q"],
  e: ["a", "i", "o"], f: ["t", "l"], g: ["q", "j", "y"], h: ["n", "u", "y"],
  i: ["l", "j", "t", "1"], j: ["i", "g", "y"], k: ["x", "h"], l: ["i", "j", "1"],
  m: ["n", "w"], n: ["m", "h", "u"], o: ["a", "c", "e", "u"], p: ["b", "d", "q"],
  q: ["g", "p", "d"], r: ["n", "v"], s: ["z", "c", "5"], t: ["f", "l", "i"],
  u: ["v", "n", "o"], v: ["u", "w", "y"], w: ["m", "v", "u"], x: ["k", "z"],
  y: ["v", "g", "j"], z: ["s", "x"],
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function _sameTopic(targetWord: string, count: number, rng?: Rng): string[] {
  const t = _lower(targetWord);
  const cat = WORD_TO_CATEGORY[t];
  let pool: string[] = [];
  if (cat && WORD_BANKS[cat]) pool = WORD_BANKS[cat].filter((w) => w !== t);
  if (pool.length < count) {
    const other = Object.keys(WORD_BANKS)
      .filter((c) => c !== cat)
      .flatMap((c) => WORD_BANKS[c])
      .filter((w) => w !== t);
    pool = pool.concat(other);
  }
  pool = _filterOut(pool, t);
  return _shuffle(pool, rng).slice(0, count);
}

function _similarSpelling(targetWord: string, count: number, rng?: Rng): string[] {
  const t = _lower(targetWord);
  const tLen = t.length;
  const prefix2 = t.substring(0, 2);
  const byDistance: string[] = [];
  const byPrefix: string[] = [];
  GRADE1_WORDLIST.forEach((w) => {
    if (w === t) return;
    const d = _levenshtein(w, t);
    if (w.length === tLen && d <= 2) byDistance.push(w);
    else if (w.startsWith(prefix2) && w !== t) byPrefix.push(w);
  });
  const combined = _filterOut(byDistance.concat(byPrefix), t);
  const shuffled = _shuffle(combined, rng);
  if (shuffled.length >= count) return shuffled.slice(0, count);
  const extra = _sameTopic(t, count, rng).filter((w) => !shuffled.includes(w));
  return shuffled.concat(extra).slice(0, count);
}

function _similarSound(targetWord: string, count: number, rng?: Rng): string[] {
  const t = _lower(targetWord);
  let pool: string[] = [];
  const rhymeGroups = WORD_TO_RHYME[t] || [];
  if (rhymeGroups.length > 0) {
    rhymeGroups.forEach((group) => {
      pool = pool.concat(RHYME_GROUPS[group] || []);
    });
  } else {
    Object.keys(RHYME_GROUPS).forEach((g) => {
      const stripped = g.replace(/^-/, "");
      if (t.endsWith(stripped)) pool = pool.concat(RHYME_GROUPS[g]);
    });
  }
  pool = _filterOut(pool, t);
  if (pool.length < count) {
    const extra = _similarSpelling(t, count, rng).filter((w) => !pool.includes(w));
    pool = pool.concat(extra);
  }
  return _shuffle(pool, rng).slice(0, count);
}

function _sameLetterCount(correctLetter: string, count: number, rng?: Rng): string[] {
  const c = _lower(correctLetter);
  const isVowel = VOWELS.has(c);
  let pool: string[] = [];
  if (isVowel) {
    pool = Array.from(VOWELS).filter((v) => v !== c);
  } else {
    pool = (LETTER_VISUAL_GROUPS[c] || []).filter((v) => v !== c);
    if (pool.length < count) {
      const common = ["b", "d", "f", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "w"];
      const extra = common.filter((v) => v !== c && !pool.includes(v));
      pool = pool.concat(extra);
    }
  }
  pool = pool.filter((v) => v !== c);
  return _shuffle(pool, rng).slice(0, count);
}

function _mixed(targetWord: string, count: number, rng: Rng): string[] {
  const strategies: DistractorStrategy[] = ["same_topic", "similar_spelling", "similar_sound"];
  const idx = Math.floor(rng() * strategies.length);
  return _pickByStrategy(targetWord, count, strategies[idx], rng);
}

function _pickByStrategy(targetWord: string, count: number, strategy: DistractorStrategy, rng: Rng): string[] {
  switch (strategy) {
    case "same_topic": return _sameTopic(targetWord, count, rng);
    case "similar_spelling": return _similarSpelling(targetWord, count, rng);
    case "similar_sound": return _similarSound(targetWord, count, rng);
    case "same_letter_count": return _sameLetterCount(targetWord, count, rng);
    case "mixed": return _mixed(targetWord, count, rng);
    default: return _sameTopic(targetWord, count, rng);
  }
}

export interface DistractorContext {
  seed?: number | null;
  rng?: Rng;
  grade?: number;
  pool?: string[];
}

export function pickEnglishDistractors(
  targetWord: string,
  count = 3,
  strategy: DistractorStrategy = "same_topic",
  context: DistractorContext = {},
): string[] {
  const seed = context.seed != null ? context.seed : null;
  const rng: Rng = context.rng ? context.rng : seed != null ? mulberry32(seed) : Math.random;
  return _pickByStrategy(targetWord, count, strategy, rng);
}

export function pickLetterDistractors(
  correctLetter: string,
  count = 3,
  opts: { seed?: number | null; rng?: Rng } = {},
): string[] {
  const rng: Rng = opts.rng ? opts.rng : opts.seed != null ? mulberry32(opts.seed) : Math.random;
  return _sameLetterCount(correctLetter, count, rng);
}
