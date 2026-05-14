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

const LEGACY_CONFIRM_IDS = {
  "starter-speed": "speed-deck",
  "starter-stamina": "stamina-deck",
  "starter-power": "power-deck",
  "starter-gut": "guts-deck",
  "starter-wit": "wit-deck",
};

export function getDeckConfirmIds(deckId) {
  const legacyDeckId = LEGACY_CONFIRM_IDS[deckId];
  return legacyDeckId && legacyDeckId !== deckId
    ? [deckId, legacyDeckId]
    : [deckId];
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

export const predefinedTcgDecks = STARTER_DECKS.map(buildDeck);
