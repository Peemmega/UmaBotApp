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
    name: "Oguri Cap Speed Deck",
    description: "เด็คสาย Speed ที่เน้นเปิดเกมไว ลง Trainee ต่อเนื่องเพื่อกดจังหวะตั้งแต่ต้นเกม เหมาะกับผู้เล่นที่ชอบบุกเร็วและใช้ทรัพยากรให้คุ้มในแต่ละเทิร์น",
    style: "Speed",
    highlight: "จุดเด่นคือความคล่องตัว จั่วแล้วลงสนามได้ง่าย สร้างแรงกดดันเร็ว ก่อนที่อีกฝ่ายจะตั้งบอร์ดทัน",
    tags: ["Starter", "Tempo", "Aggro"],
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
    name: "T.M. Opera Stamina Deck",
    description: "เด็คสาย Stamina ที่เน้นยืนระยะ คุมเกมกลางถึงท้ายเกม และรักษาทรัพยากรให้เพียงพอตลอดการแข่งขัน เหมาะกับผู้เล่นที่ชอบเล่นมั่นคง",
    style: "Stamina",
    highlight: "จุดเด่นคือความเสถียร เล่นยาวได้ดี ไม่หมดแรงง่าย และค่อย ๆ สร้างความได้เปรียบจากบอร์ดที่แข็งแรง",
    tags: ["Starter", "Control", "Stable"],
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
    name: "Gentildonna Power Deck",
    description: "เด็คสาย Power ที่เน้นพลังสูงและการปะทะโดยตรง ใช้การ์ดที่มีแรงกดดันบนสนามเพื่อบังคับให้อีกฝ่ายต้องตอบโต้",
    style: "Power",
    highlight: "จุดเด่นคือการสร้างบอร์ดที่แข็งและน่ากลัว ถ้าตั้งเกมได้จะบีบพื้นที่การเล่นของคู่แข่งอย่างต่อเนื่อง",
    tags: ["Starter", "Pressure", "Beatdown"],
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
    name: "Orferve Gut Deck",
    description: "เด็คสาย Gut ที่เล่นแบบดื้อและพลิกสถานการณ์ได้ดี เหมาะกับผู้เล่นที่ชอบเสี่ยงแลกจังหวะ เพื่อกลับมาได้แม้โดนกดดัน",
    style: "Gut",
    highlight: "จุดเด่นคือความอึดและการเล่นสวน เมื่อเกมเริ่มตึง เด็คนี้จะมีโอกาสสร้างจังหวะพลิกกลับได้ดี",
    tags: ["Starter", "Comeback", "Resilience"],
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
    name: "Anges Wit Deck",
    description: "เด็คสาย Wit ที่เน้นการวางแผน จัดจังหวะ และใช้การ์ดให้เกิด value สูงสุด เหมาะกับผู้เล่นที่ชอบคุมมือและเลือกจังหวะเล่นอย่างแม่นยำ",
    style: "Wit",
    highlight: "จุดเด่นคือความยืดหยุ่น มีตัวเลือกในการเล่นหลายแบบ และสามารถปรับแผนตามสถานการณ์บนสนามได้ดี",
    tags: ["Starter", "Value", "Technical"],
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

export const predefinedTcgDecks = DECKS.map(hydrateDeck);
