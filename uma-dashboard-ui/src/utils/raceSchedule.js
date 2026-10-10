import ArimaKinen from "../assets/race_thumnail/ArimaKinen.webp";
import AsahiHaiFuturityStakes from "../assets/race_thumnail/AsahiHaiFuturityStakes.webp";
import ChampionsCup from "../assets/race_thumnail/ChampionsCup.webp";
import Debut from "../assets/race_thumnail/Debut.webp";
import FebruaryStakes from "../assets/race_thumnail/FebruaryStakes.webp";
import HanshinJuvenileFillies from "../assets/race_thumnail/HanshinJuvenileFillies.webp";
import HopefulStakes from "../assets/race_thumnail/HopefulStakes.webp";
import JapanCup from "../assets/race_thumnail/JapanCup.webp";
import JapanDirtDerby from "../assets/race_thumnail/JapanDirtDerby.webp";
import JapaneseDerby from "../assets/race_thumnail/JapaneseDerby.webp";
import JapaneseOaks from "../assets/race_thumnail/JapaneseOaks.webp";
import KashiwaKinen from "../assets/race_thumnail/KashiwaKinen.webp";
import KawasakiKinen from "../assets/race_thumnail/KawasakiKinen.webp";
import KikukaSho from "../assets/race_thumnail/KikukaSho.webp";
import MCNambuHai from "../assets/race_thumnail/MCNambuHai.webp";
import MileChampionship from "../assets/race_thumnail/MileChampionship.webp";
import NHK from "../assets/race_thumnail/NHK.webp";
import OkaSho from "../assets/race_thumnail/OkaSho.webp";
import OsakaHai from "../assets/race_thumnail/OsakaHai.webp";
import QueenElizabethIICup from "../assets/race_thumnail/QueenElizabethIICup.webp";
import SatsukiSho from "../assets/race_thumnail/SatsukiSho.webp";
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
import G2Race from "../assets/race_thumnail/G2_race.png";
import G3Race from "../assets/race_thumnail/G3_race.webp";

export const fallbackRaceImg = Debut;

export const raceImageMap = {
  "ArimaKinen": ArimaKinen,
  "AsahiHaiFuturityStakes": AsahiHaiFuturityStakes,
  "ChampionsCup": ChampionsCup,
  "Debut": Debut,
  "FebruaryStakes": FebruaryStakes,
  "HanshinJuvenileFillies": HanshinJuvenileFillies,
  "HopefulStakes": HopefulStakes,
  "JapanCup": JapanCup,
  "JapanDirtDerby": JapanDirtDerby,
  "JapaneseDerby": JapaneseDerby,
  "JapaneseOaks": JapaneseOaks,
  "KashiwaKinen": KashiwaKinen,
  "KawasakiKinen": KawasakiKinen,
  "KikukaSho": KikukaSho,
  "MCNambuHai": MCNambuHai,
  "MileChampionship": MileChampionship,
  "NHK": NHK,
  "OkaSho": OkaSho,
  "OsakaHai": OsakaHai,
  "QueenElizabethIICup": QueenElizabethIICup,
  "SatsukiSho": SatsukiSho,
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
  const raceName = String(race?.name || "");

  // Grade art is intentionally shared: it makes every GII/GIII race readable
  // in the directory even when that race does not have bespoke local artwork.
  if (/\(GII\)/i.test(raceName)) return G2Race;
  if (/\(GIII\)/i.test(raceName)) return G3Race;

  const idKey = normalizeRaceImageKey(race?.id);
  const nameKey = normalizeRaceImageKey(raceName.replace(/\d+m?$/i, ""));

  return raceImageMap[race?.id] || raceImageMap[idKey] || raceImageMap[nameKey] || fallbackRaceImg;
}
