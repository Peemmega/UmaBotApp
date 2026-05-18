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

export const tcgStyleThemes = STYLE_THEMES;

export const tcgAssets = {
  cardBack: "",
  trainer: "/tcg/cards/trainers/UMT_001.webp",
  carrot: "/tcg/cards/carrots/UMC_01.webp",
};

function getCard(cardsById, cardId) {
  return cardsById?.[cardId] || null;
}

function expandDeckList(mainDeck, cardsById) {
  return Object.entries(mainDeck || {}).flatMap(([cardId, quantity]) => {
    const card = getCard(cardsById, cardId);
    return card ? Array.from({ length: quantity }, () => ({ ...card })) : [];
  });
}

export function shuffleCards(cards) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function createDeckInstance(deck, playerId, cardsById = {}) {
  return shuffleCards(expandDeckList(deck.mainDeck, cardsById)).map((card, index) => ({
    ...card,
    instanceId: `${playerId}-${deck.id}-${index + 1}`,
    status: "active",
  }));
}

export function createTrainerCard(playerId, trainerId = "UMT-001", cardsById = {}) {
  const trainer = getCard(cardsById, trainerId) || getCard(cardsById, "UMT-001");
  return {
    ...trainer,
    instanceId: `${playerId}-trainer-card`,
    style: "Wit",
    status: "active",
  };
}

export function createCarrotCard(playerId, index, cardsById = {}) {
  const carrot = getCard(cardsById, "UMC-01") || {
    id: "UMC-01",
    name: "Carrot",
    type: "Carrot",
    image: tcgAssets.carrot,
  };
  return {
    ...carrot,
    instanceId: `${playerId}-carrot-${index}`,
    style: "Stamina",
    status: "active",
  };
}
