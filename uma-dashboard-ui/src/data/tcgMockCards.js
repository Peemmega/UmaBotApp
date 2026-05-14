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

export function createDeckInstance(deck, playerId) {
  return deck.cards.map((card, index) => ({
    ...card,
    instanceId: `${playerId}-${deck.id}-${index + 1}`,
    status: "active",
  }));
}
