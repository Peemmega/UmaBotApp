import { getCard } from "./tcgCards";
import { expandDeckList } from "./tcgDecks";

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

export function createDeckInstance(deck, playerId) {
  return shuffleCards(expandDeckList(deck.mainDeck)).map((card, index) => ({
    ...card,
    instanceId: `${playerId}-${deck.id}-${index + 1}`,
    status: "active",
  }));
}

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
