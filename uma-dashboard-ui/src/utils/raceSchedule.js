import AoiStakes from "../assets/race_thumnail/AoiStakes.webp";
import ArimaKinen from "../assets/race_thumnail/ArimaKinen.webp";
import AsahiHaiFuturityStakes from "../assets/race_thumnail/AsahiHaiFuturityStakes.webp";
import ChampionsCup from "../assets/race_thumnail/ChampionsCup.webp";
import ChunichiShimbunHai from "../assets/race_thumnail/ChunichiShimbunHai.webp";
import Debut from "../assets/race_thumnail/Debut.webp";
import DiamondStakes from "../assets/race_thumnail/DiamondStakes.webp";
import FebruaryStakes from "../assets/race_thumnail/FebruaryStakes.webp";
import HakodateJuniorStakes from "../assets/race_thumnail/HakodateJuniorStakes.webp";
import HanshinJuvenileFillies from "../assets/race_thumnail/HanshinJuvenileFillies.webp";
import HopefulStakes from "../assets/race_thumnail/HopefulStakes.webp";
import JapanCup from "../assets/race_thumnail/JapanCup.webp";
import JapanDirtDerby from "../assets/race_thumnail/JapanDirtDerby.webp";
import JapaneseDerby from "../assets/race_thumnail/JapaneseDerby.webp";
import JapaneseOaks from "../assets/race_thumnail/JapaneseOaks.webp";
import KashiwaKinen from "../assets/race_thumnail/KashiwaKinen.webp";
import KawasakiKinen from "../assets/race_thumnail/KawasakiKinen.webp";
import KikukaSho from "../assets/race_thumnail/KikukaSho.webp";
import KyotoJuniorStakes from "../assets/race_thumnail/KyotoJuniorStakes.webp";
import MCNambuHai from "../assets/race_thumnail/MCNambuHai.webp";
import MileChampionship from "../assets/race_thumnail/MileChampionship.webp";
import NHK from "../assets/race_thumnail/NHK.webp";
import NiigataJuniorStakes from "../assets/race_thumnail/NiigataJuniorStakes.webp";
import OkaSho from "../assets/race_thumnail/OkaSho.webp";
import OsakaHai from "../assets/race_thumnail/OsakaHai.webp";
import QueenElizabethIICup from "../assets/race_thumnail/QueenElizabethIICup.webp";
import SatsukiSho from "../assets/race_thumnail/SatsukiSho.webp";
import SaudiArabiaRoyalCup from "../assets/race_thumnail/SaudiArabiaRoyalCup.webp";
import ShukaSho from "../assets/race_thumnail/ShukaSho.webp";
import SteelBallRun from "../assets/race_thumnail/SteelBallRun.webp";
import SprintersStakes from "../assets/race_thumnail/SprintersStakes.webp";
import TakamatsunomiyaKinen from "../assets/race_thumnail/TakamatsunomiyaKinen.webp";
import TakarazukaKinen from "../assets/race_thumnail/TakarazukaKinen.webp";
import TeioSho from "../assets/race_thumnail/TeioSho.webp";
import TennoShoAutumn from "../assets/race_thumnail/TennoShoAutumn.webp";
import TennoShoSpring from "../assets/race_thumnail/TennoShoSpring.webp";
import TokyoDaishoten from "../assets/race_thumnail/TokyoDaishoten.webp";
import VictoriaMileTokyo from "../assets/race_thumnail/VictoriaMileTokyo.webp";
import YasudaKinen from "../assets/race_thumnail/YasudaKinen.webp";
import ZenNipponJuniorYushun from "../assets/race_thumnail/ZenNipponJuniorYushun.webp";

export const fallbackRaceImg = Debut;

export const raceImageMap = {
  "AoiStakes": AoiStakes,
  "ArimaKinen": ArimaKinen,
  "AsahiHaiFuturityStakes": AsahiHaiFuturityStakes,
  "ChampionsCup": ChampionsCup,
  "ChunichiShimbunHai": ChunichiShimbunHai,
  "Debut": Debut,
  "DiamondStakes": DiamondStakes,
  "FebruaryStakes": FebruaryStakes,
  "HakodateJuniorStakes": HakodateJuniorStakes,
  "HanshinJuvenileFillies": HanshinJuvenileFillies,
  "HopefulStakes": HopefulStakes,
  "JapanCup": JapanCup,
  "JapanDirtDerby": JapanDirtDerby,
  "JapaneseDerby": JapaneseDerby,
  "JapaneseOaks": JapaneseOaks,
  "KashiwaKinen": KashiwaKinen,
  "KawasakiKinen": KawasakiKinen,
  "KikukaSho": KikukaSho,
  "KyotoJuniorStakes": KyotoJuniorStakes,
  "MCNambuHai": MCNambuHai,
  "MileChampionship": MileChampionship,
  "NHK": NHK,
  "NiigataJuniorStakes": NiigataJuniorStakes,
  "OkaSho": OkaSho,
  "OsakaHai": OsakaHai,
  "QueenElizabethIICup": QueenElizabethIICup,
  "SatsukiSho": SatsukiSho,
  "SaudiArabiaRoyalCup": SaudiArabiaRoyalCup,
  "ShukaSho": ShukaSho,
  "SteelBallRun": SteelBallRun,
  "SprintersStakes": SprintersStakes,
  "TakamatsunomiyaKinen": TakamatsunomiyaKinen,
  "TakarazukaKinen": TakarazukaKinen,
  "TeioSho": TeioSho,
  "TennoShoAutumn": TennoShoAutumn,
  "TennoShoSpring": TennoShoSpring,
  "TokyoDaishoten": TokyoDaishoten,
  "VictoriaMileTokyo": VictoriaMileTokyo,
  "YasudaKinen": YasudaKinen,
  "ZenNipponJuniorYushun": ZenNipponJuniorYushun,
};

export function normalizeRaceImageKey(value = "") {
  return String(value).replace(/[^A-Za-z0-9]/g, "");
}

export function getRaceImage(race) {
  const idKey = normalizeRaceImageKey(race?.id);
  const nameKey = normalizeRaceImageKey(String(race?.name || "").replace(/\d+m?$/i, ""));

  return raceImageMap[race?.id] || raceImageMap[idKey] || raceImageMap[nameKey] || fallbackRaceImg;
}
