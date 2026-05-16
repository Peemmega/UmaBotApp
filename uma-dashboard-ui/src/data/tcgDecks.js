import { CARD_DATABASE, getCard } from "./tcgCards";

const MAX_COPIES_PER_CARD = 4;
const MAIN_DECK_SIZE = 40;

function buildDeck({
  id,
  name,
  description,
  style,
  highlight,
  tags,
  trainer,
  mainDeck,
}) {
  const validation = validateDeck({ trainer, mainDeck });
  const cards = expandDeckList(mainDeck);
  const coverCardId = Object.keys(mainDeck)[0];
  const coverCard = getCard(coverCardId);
  const keyCards = Object.keys(mainDeck)
    .slice(0, 3)
    .map((cardId) => getCard(cardId)?.name || cardId);

  return {
    id,
    name,
    description,
    style,
    highlight,
    tags,
    trainer,
    mainDeck,
    cards,
    coverCard,
    keyCards,
    mainDeckCount: cards.length,
    trainerCard: getCard(trainer),
    validation,
  };
}

export function expandDeckList(mainDeck) {
  return Object.entries(mainDeck || {}).flatMap(([cardId, quantity]) => {
    const card = getCard(cardId);
    return card ? Array.from({ length: quantity }, () => ({ ...card })) : [];
  });
}

export function validateDeck(deck) {
  const errors = [];
  const mainDeck = deck.mainDeck || {};
  const total = Object.values(mainDeck).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  if (total !== MAIN_DECK_SIZE) {
    errors.push(`Main Deck must contain ${MAIN_DECK_SIZE} cards, got ${total}`);
  }

  Object.entries(mainDeck).forEach(([cardId, quantity]) => {
    const card = CARD_DATABASE[cardId];
    if (!card) {
      errors.push(`Unknown card id in Main Deck: ${cardId}`);
      return;
    }
    if (quantity < 1) errors.push(`${cardId} quantity must be at least 1`);
    if (quantity > MAX_COPIES_PER_CARD) {
      errors.push(`${cardId} exceeds ${MAX_COPIES_PER_CARD} copies`);
    }
    if (card.type === "Trainer") {
      errors.push(`Trainer card cannot be in Main Deck: ${cardId}`);
    }
  });

  const trainer = CARD_DATABASE[deck.trainer];
  if (!trainer) {
    errors.push(`Unknown trainer id: ${deck.trainer}`);
  } else if (trainer.type !== "Trainer") {
    errors.push(`Trainer slot must be a Trainer card: ${deck.trainer}`);
  }

  return { valid: errors.length === 0, errors };
}

const STARTER_DECKS = [
  {
    id: "starter-speed",
    name: "Starter Speed Deck",
    description: "Basic 40-card starter deck built for early tempo tests.",
    style: "Speed",
    highlight: "Fast open and simple board transitions.",
    tags: ["Starter", "Tempo", "Low cost"],
    trainer: "UMT-002",
    mainDeck: {
      "UMTD01-01": 4,
      "UMTD01-02": 4,
      "UMTD01-03": 4,
      "UMTD01-04": 4,
      "UMTD01-05": 4,
      "UMTD01-06": 4,
      "UMTD01-07": 4,
      "UMTD01-08": 4,
      "UMTD01-09": 4,
      "UMTD01-10": 4,
    },
  },
  {
    id: "starter-stamina",
    name: "Starter Stamina Deck",
    description: "Basic 40-card starter deck built for slower setup tests.",
    style: "Stamina",
    highlight: "Life zone and longer game flow checks.",
    tags: ["Starter", "Steady", "Board tests"],
    trainer: "UMT-003",
    mainDeck: {
      "UMTD02-01": 4,
      "UMTD02-02": 4,
      "UMTD02-03": 4,
      "UMTD02-04": 4,
      "UMTD02-05": 4,
      "UMTD02-06": 4,
      "UMTD02-07": 4,
      "UMTD02-08": 4,
      "UMTD02-09": 4,
      "UMTD02-10": 4,
    },
  },
  {
    id: "starter-power",
    name: "Starter Power Deck",
    description: "Basic 40-card starter deck built for field pressure tests.",
    style: "Power",
    highlight: "High power trainees and layout checks.",
    tags: ["Starter", "Power", "Board push"],
    trainer: "UMT-004",
    mainDeck: {
      "UMTD03-01": 4,
      "UMTD03-02": 4,
      "UMTD03-03": 4,
      "UMTD03-04": 4,
      "UMTD03-05": 4,
      "UMTD03-06": 4,
      "UMTD03-07": 4,
      "UMTD03-08": 4,
      "UMTD03-09": 4,
      "UMTD03-10": 4,
    },
  },
  {
    id: "starter-gut",
    name: "Starter Gut Deck",
    description: "Basic 40-card starter deck built for tap/rest tests.",
    style: "Guts",
    highlight: "Repeated tap and move interactions.",
    tags: ["Starter", "Rest synergy", "Pressure"],
    trainer: "UMT-005",
    mainDeck: {
      "UMTD04-01": 4,
      "UMTD04-02": 4,
      "UMTD04-03": 4,
      "UMTD04-04": 4,
      "UMTD04-05": 4,
      "UMTD04-06": 4,
      "UMTD04-07": 4,
      "UMTD04-08": 4,
      "UMTD04-09": 4,
      "UMTD04-10": 4,
    },
  },
  {
    id: "starter-wit",
    name: "Starter Wit Deck",
    description: "Basic 40-card starter deck built for draw and control tests.",
    style: "Wit",
    highlight: "Tricks, draw flow, and future keyword hooks.",
    tags: ["Starter", "Draw", "Control"],
    trainer: "UMT-001",
    mainDeck: {
      "UMTD05-01": 4,
      "UMTD05-02": 4,
      "UMTD05-03": 4,
      "UMTD05-04": 4,
      "UMTD05-05": 4,
      "UMTD05-06": 4,
      "UMTD05-07": 4,
      "UMTD05-08": 4,
      "UMTD05-09": 4,
      "UMTD05-10": 4,
    },
  },
];

const CUSTOM_DECKS = [
  {
    id: "sakura-laurel",
    name: "Sakura Laurel Deck",
    description: "Sakura lineup built around Laurel and UMTD04 support.",
    style: "Speed",
    highlight: "Sakura Laurel leads the tempo package.",
    tags: ["Custom", "Sakura", "Tempo"],
    trainer: "UMT-006",
    mainDeck: {
      "UMBT01-01": 4,
      "UMBT01-03": 4,
      "UMBT01-02": 2,
      "UMTD04-02": 4,
      "UMTD04-05": 4,
      "UMBT01-04": 4,
      "UMBT01-06": 3,
      "UMTD04-08": 4,
      "UMTD04-07": 4,
      "UMBT01-08": 4,
      "UMTD04-10": 3,
    },
  },
  {
    id: "v-family",
    name: "V Family Deck",
    description: "V family core backed by Opera O and Meisho Doto.",
    style: "Stamina",
    highlight: "Vixena, Cheval Grand, and Vivlos anchor the deck.",
    tags: ["Custom", "V Family", "Stamina"],
    trainer: "UMT-003",
    mainDeck: {
      "UMBT01-14": 4,
      "UMBT01-15": 4,
      "UMBT01-16": 4,
      "UMBT01-17": 4,
      "UMBT01-18": 4,
      "UMTD02-01": 4,
      "UMTD02-03": 4,
      "UMTD02-07": 2,
      "UMTD02-08": 4,
      "UMTD02-09": 2,
      "UMTD02-10": 4,
    },
  },
  {
    id: "tiara",
    name: "Tiara Deck",
    description: "Almond Eye package mixed with the UMTD01 Tiara suite.",
    style: "Speed",
    highlight: "Almond Eye and Oguri Cap share the top end.",
    tags: ["Custom", "Tiara", "Hybrid"],
    trainer: "UMT-002",
    mainDeck: {
      "UMBT01-09": 4,
      "UMTD01-02": 2,
      "UMBT01-11": 4,
      "UMTD01-03": 4,
      "UMTD01-04": 4,
      "UMTD01-01": 2,
      "UMTD01-05": 2,
      "UMBT01-12": 2,
      "UMTD01-08": 2,
      "UMBT01-13": 2,
      "UMTD01-07": 4,
      "UMTD01-09": 4,
      "UMTD01-10": 4,
    },
  },
  {
    id: "admire-vega",
    name: "Admire Vega Deck",
    description: "Admire Vega booster cards with UMTD03 power support.",
    style: "Power",
    highlight: "Admire Vega drives a compact 40-card pressure plan.",
    tags: ["Custom", "Admire Vega", "Power"],
    trainer: "UMT-004",
    mainDeck: {
      "UMTD03-02": 4,
      "UMBT01-19": 4,
      "UMBT01-20": 4,
      "UMBT01-21": 4,
      "UMBT01-22": 4,
      "UMTD03-04": 4,
      "UMTD03-05": 4,
      "UMTD03-08": 4,
      "UMTD03-09": 4,
      "UMTD03-10": 4,
    },
  },
  {
    id: "still-in-love",
    name: "Still in love Deck",
    description: "Still in love list with Daring Tact and UMTD01 events.",
    style: "Guts",
    highlight: "Still in love leads a lean event-heavy shell.",
    tags: ["Custom", "Still in love", "Events"],
    trainer: "UMT-002",
    mainDeck: {
      "UMBT01-10": 4,
      "UMTD01-02": 2,
      "UMBT01-11": 4,
      "UMTD01-03": 4,
      "UMTD01-04": 4,
      "UMBT01-12": 3,
      "UMTD01-08": 4,
      "UMBT01-13": 3,
      "UMTD01-07": 4,
      "UMTD01-09": 4,
      "UMTD01-10": 4,
    },
  },
];

export const predefinedTcgDecks = [...STARTER_DECKS, ...CUSTOM_DECKS].map(
  buildDeck
);
