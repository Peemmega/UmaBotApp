import { CARD_DATABASE, getCard } from "./tcgCards";
import {
  expandDeckList,
  predefinedTcgDecks,
  validateDeck,
} from "./tcgDecks";

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
  cardBack: "",
  trainer: getCard("UMT-001")?.image || "",
  carrot: getCard("UMC-01")?.image || "",
  cardImage: (style, index) => {
    const cards = Object.values(CARD_DATABASE).filter(
      (card) => card.type === "Trainee"
    );
    return cards[index % cards.length]?.image || "";
  },
};

export const tcgStyleThemes = STYLE_THEMES;
export { CARD_DATABASE, predefinedTcgDecks, validateDeck };

export function createTrainerCard(playerId, trainerId = "UMT-001") {
  const trainer = getCard(trainerId) || getCard("UMT-001");
  return {
    ...trainer,
    instanceId: `${playerId}-trainer-card`,
    style: "Wit",
    status: "active",
  };
}

export function createCarrotCard(playerId, index) {
  const carrot = getCard("UMC-01");
  return {
    ...carrot,
    instanceId: `${playerId}-carrot-${index}`,
    style: "Stamina",
    status: "active",
  };
}

export function createDeckInstance(deck, playerId) {
  return expandDeckList(deck.mainDeck).map((card, index) => ({
    ...card,
    instanceId: `${playerId}-${deck.id}-${index + 1}`,
    status: "active",
  }));
}
