import AoiStakes from "../assets/race_thumnail/AoiStakes.webp";
import ArimaKinen from "../assets/race_thumnail/ArimaKinen.webp";
import ChunichiShimbunHai from "../assets/race_thumnail/ChunichiShimbunHai.webp";
import Debut from "../assets/race_thumnail/Debut.webp";
import DiamondStakes from "../assets/race_thumnail/DiamondStakes.webp";
import HakodateJuniorStakes from "../assets/race_thumnail/HakodateJuniorStakes.webp";
import JapanCup from "../assets/race_thumnail/JapanCup.webp";
import JapaneseDerby from "../assets/race_thumnail/JapaneseDerby.webp";
import KyotoJuniorStakes from "../assets/race_thumnail/KyotoJuniorStakes.webp";
import MileChampionship from "../assets/race_thumnail/MileChampionship.webp";
import NHK from "../assets/race_thumnail/NHK.webp";
import NiigataJuniorStakes from "../assets/race_thumnail/NiigataJuniorStakes.webp";
import OkaSho from "../assets/race_thumnail/OkaSho.webp";
import OsakaHai from "../assets/race_thumnail/OsakaHai.webp";
import SatsukiSho from "../assets/race_thumnail/SatsukiSho.webp";
import SaudiArabiaRoyalCup from "../assets/race_thumnail/SaudiArabiaRoyalCup.webp";
import SteelBallRun from "../assets/race_thumnail/SteelBallRun.webp";
import TakarazukaKinen from "../assets/race_thumnail/TakarazukaKinen.webp";
import TennoShoAutumn from "../assets/race_thumnail/TennoShoAutumn.webp";
import TennoShoSpring from "../assets/race_thumnail/TennoShoSpring.webp";

export const fallbackRaceImg = Debut;

export const raceImageMap = {
  "AoiStakes": AoiStakes,
  "ArimaKinen": ArimaKinen,
  "ChunichiShimbunHai": ChunichiShimbunHai,
  "Debut": Debut,
  "DiamondStakes": DiamondStakes,
  "HakodateJuniorStakes": HakodateJuniorStakes,
  "JapanCup": JapanCup,
  "JapaneseDerby": JapaneseDerby,
  "KyotoJuniorStakes": KyotoJuniorStakes,
  "MileChampionship": MileChampionship,
  "NHK": NHK,
  "NiigataJuniorStakes": NiigataJuniorStakes,
  "OkaSho": OkaSho,
  "OsakaHai": OsakaHai,
  "SatsukiSho": SatsukiSho,
  "SaudiArabiaRoyalCup": SaudiArabiaRoyalCup,
  "SteelBallRun": SteelBallRun,
  "TakarazukaKinen": TakarazukaKinen,
  "TennoShoAutumn": TennoShoAutumn,
  "TennoShoSpring": TennoShoSpring,
};

export function normalizeRaceImageKey(value = "") {
  return String(value).replace(/[^A-Za-z0-9]/g, "");
}

export function getRaceImage(race) {
  const idKey = normalizeRaceImageKey(race?.id);
  const nameKey = normalizeRaceImageKey(String(race?.name || "").replace(/\d+m?$/i, ""));

  return raceImageMap[race?.id] || raceImageMap[idKey] || raceImageMap[nameKey] || fallbackRaceImg;
}
