import { CARD_DATABASE, getCard } from "./tcgCards";

const MAX_COPIES_PER_CARD = 4;
const MAIN_DECK_SIZE = 40;

function hydrateDeck(deck) {
  const validation = validateDeck(deck);
  const cards = expandDeckList(deck.mainDeck);
  const keyCards = Object.keys(deck.mainDeck)
    .slice(0, 3)
    .map((cardId) => getCard(cardId)?.name || cardId);

  return {
    ...deck,
    cards,
    keyCards,
    mainDeckCount: cards.length,
    trainerCard: getCard(deck.trainer),
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
  const total = Object.values(mainDeck).reduce((sum, quantity) => sum + quantity, 0);

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

const DECKS = [
  {
    id: "starter-speed",
    name: "Starter Speed Deck",
    description: "Basic 40-card starter deck using UMTD01 trainee cards.",
    style: "Speed",
    highlight: "Simple trainee spread for online board testing.",
    tags: ["Starter", "Tempo", "Low cost"],
    trainer: "UMT-001",
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
    description: "Basic 40-card starter deck using UMTD02 trainee cards.",
    style: "Stamina",
    highlight: "Uses the newer UMTD02 image set for card database checks.",
    tags: ["Starter", "Steady", "Board tests"],
    trainer: "UMT-002",
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
    description: "Basic 40-card starter deck using UMTD03 trainee cards.",
    style: "Stamina",
    highlight: "Uses the newer UMTD03 image set for card database checks.",
    tags: ["Starter", "Steady", "Board tests"],
    trainer: "UMT-003",
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
    description: "Basic 40-card starter deck using UMTD04 trainee cards.",
    style: "Stamina",
    highlight: "Uses the newer UMTD04 image set for card database checks.",
    tags: ["Starter", "Steady", "Board tests"],
    trainer: "UMT-002",
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
    description: "Basic 40-card starter deck using UMTD05 trainee cards.",
    style: "Stamina",
    highlight: "Uses the newer UMTD05 image set for card database checks.",
    tags: ["Starter", "Steady", "Board tests"],
    trainer: "UMT-002",
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

export const predefinedTcgDecks = DECKS.map(hydrateDeck);
