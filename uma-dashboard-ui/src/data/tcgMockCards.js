const cardAssetModules = {
  ...import.meta.glob("../assets/tcg/cards/trainees/UMTD01_*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/trainees/UMTD02_*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/trainees/UMTD03_*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/trainees/UMTD04_*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/trainees/UMTD05_*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/trainers/UMT_001.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../assets/tcg/cards/carrots/UMC_01.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
};

function findAsset(pattern) {
  const entry = Object.entries(cardAssetModules).find(([path]) =>
    pattern.test(path)
  );
  return entry?.[1] || "";
}

function findAssets(pattern) {
  return Object.entries(cardAssetModules)
    .filter(([path]) => pattern.test(path))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url);
}

const TRAINEE_IMAGES = {
  Speed: findAssets(/trainees\/UMTD01_/),
  Stamina: findAssets(/trainees\/UMTD02_/),
  Power: findAssets(/trainees\/UMTD03_/),
  Guts: findAssets(/trainees\/UMTD04_/),
  Wit: findAssets(/trainees\/UMTD05_/),
};

const FALLBACK_TRAINEE_IMAGES = findAssets(/trainees\//);

const STYLE_THEMES = {
  Speed: {
    color: "#20b8ff",
    accent: "#e1f6ff",
    tags: ["Fast open", "Tempo", "Low cost"],
  },
  Stamina: {
    color: "#f47b41",
    accent: "#fff0e8",
    tags: ["Defense", "Life pressure", "Late game"],
  },
  Power: {
    color: "#f1b525",
    accent: "#fff7dc",
    tags: ["High power", "Breakthrough", "Board push"],
  },
  Guts: {
    color: "#ef5d86",
    accent: "#ffe9f0",
    tags: ["Rest synergy", "Comeback", "Pressure"],
  },
  Wit: {
    color: "#8c78ff",
    accent: "#f0edff",
    tags: ["Draw", "Tricks", "Control"],
  },
};

export const tcgAssets = {
  cardBack: findAsset(/card-back/i),
  trainer: findAsset(/trainers\/UMT_001/) || findAsset(/trainers\//),
  carrot: findAsset(/carrots\/UMC_01/) || findAsset(/carrots\//),
  cardImage: (style, index) => {
    const styleImages = TRAINEE_IMAGES[style] || [];
    return (
      styleImages[index % styleImages.length] ||
      FALLBACK_TRAINEE_IMAGES[index % FALLBACK_TRAINEE_IMAGES.length] ||
      ""
    );
  },
};

const CARD_NAMES = {
  Speed: ["Silent Sprint", "Corner Dash", "Front Runner", "Blue Gear"],
  Stamina: ["Long Climb", "Deep Breath", "Iron Pace", "Green Endurance"],
  Power: ["Final Push", "Heavy Drive", "Gold Stride", "Hill Breaker"],
  Guts: ["Last Spurt", "Fighting Pose", "Pink Resolve", "Never Fold"],
  Wit: ["Race Read", "Clean Line", "Violet Plan", "Smart Timing"],
};

const TYPES = ["Trainee", "Trainer", "Event"];

function makeCard(style, index) {
  const names = CARD_NAMES[style];
  const type = TYPES[index % TYPES.length];
  const cost = (index % 4) + 1;

  return {
    id: `${style.toLowerCase()}-${index + 1}`,
    name: names[index % names.length],
    type,
    cost,
    power: type === "Trainee" ? 2000 + cost * 1000 + (index % 3) * 500 : 0,
    style,
    image: tcgAssets.cardImage(style, index),
    text:
      type === "Trainee"
        ? `${style} trainee for sandbox playtesting. Battle logic is not active yet.`
        : `${type} card prepared for future carrot, battle, and keyword rules.`,
  };
}

function buildDeck(style, description, highlight) {
  const cards = Array.from({ length: 20 }, (_, index) => makeCard(style, index));

  return {
    id: `${style.toLowerCase()}-deck`,
    name: `${style} Deck`,
    description,
    style,
    highlight,
    tags: STYLE_THEMES[style].tags,
    keyCards: cards.slice(0, 3).map((card) => card.name),
    cards,
  };
}

export const tcgStyleThemes = STYLE_THEMES;

export const predefinedTcgDecks = [
  buildDeck(
    "Speed",
    "Low-cost tempo deck for testing quick hand-to-field turns.",
    "Plays early cards and keeps pressure on the field."
  ),
  buildDeck(
    "Stamina",
    "Defensive deck with sturdy trainees and slower setup turns.",
    "Good for testing long games and Life Zone movement."
  ),
  buildDeck(
    "Power",
    "Board-focused deck with higher power mock trainees.",
    "Best for checking field layout and rested attackers."
  ),
  buildDeck(
    "Guts",
    "Comeback deck built around active/rest sandbox states.",
    "Useful for repeatedly tapping and moving cards."
  ),
  buildDeck(
    "Wit",
    "Utility deck with trainers and events for future rule hooks.",
    "Good base for draw, keyword, and control experiments."
  ),
];

export function createTrainerCard(playerId) {
  return {
    id: `trainer-${playerId}`,
    instanceId: `${playerId}-trainer-card`,
    name: "Trainer",
    type: "Trainer",
    cost: 0,
    power: 0,
    style: "Wit",
    status: "active",
    image: tcgAssets.trainer,
    text: "Starting trainer card for sandbox playtesting.",
  };
}

export function createCarrotCard(playerId, index) {
  return {
    id: "carrot-token",
    instanceId: `${playerId}-carrot-${index}`,
    name: "Carrot",
    type: "Carrot",
    cost: 0,
    power: 0,
    style: "Stamina",
    status: "active",
    image: tcgAssets.carrot,
    text: "Resource card for future carrot costs. Tap/rest is available now.",
  };
}

export function createDeckInstance(deck, playerId) {
  return deck.cards.map((card, index) => ({
    ...card,
    instanceId: `${playerId}-${deck.id}-${index + 1}`,
    status: "active",
  }));
}
