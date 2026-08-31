import { useMemo, useState } from "react";
import { Calculator, Gauge, Route, Sparkles } from "lucide-react";
import { GameCard, SectionHeader } from "../../components/ui";
import "../../styles/toolsPage.css";

const APTITUDES = [
  { rank: "G", modifier: 1.0 },
  { rank: "F", modifier: 1.05 },
  { rank: "E", modifier: 1.1 },
  { rank: "D", modifier: 1.15 },
  { rank: "C", modifier: 1.2 },
  { rank: "B", modifier: 1.25 },
  { rank: "A", modifier: 1.3 },
  { rank: "S", modifier: 1.35 },
];
const DISTANCES = [
  { key: "sprint", label: "Sprint", turns: 8 },
  { key: "mile", label: "Mile", turns: 8 },
  { key: "medium", label: "Medium", turns: 12 },
  { key: "long", label: "Long", turns: 16 },
];
const WISDOM_VALUES = Array.from({ length: 8 }, (_, index) => index + 1);

function roundLikePython(value) {
  const lower = Math.floor(value);
  const fraction = value - lower;

  if (Math.abs(fraction - 0.5) < Number.EPSILON * 8) {
    return lower % 2 === 0 ? lower : lower + 1;
  }

  return Math.round(value);
}

function getWitValue({ wisdom, turn, styleModifier }) {
  // Match Discord: it starts at 100 + (10 × Wit), then adds an already-rounded
  // Wit regeneration value after each turn. Wit uses Style Aptitude only.
  const baseValue = 100 + wisdom * 10;
  const baseWitGain = 10 + wisdom * 2;
  const effectiveWitGain = roundLikePython(baseWitGain * styleModifier);
  return baseValue + effectiveWitGain * (turn - 1);
}

export default function ToolsPage() {
  const [aptitude, setAptitude] = useState("G");
  const [distance, setDistance] = useState("medium");
  const selectedAptitude = APTITUDES.find((item) => item.rank === aptitude) || APTITUDES[0];
  const aptitudeBonus = Math.round((selectedAptitude.modifier - 1) * 100);
  const selectedDistance = DISTANCES.find((item) => item.key === distance) || DISTANCES[2];
  const turns = useMemo(
    () => Array.from({ length: selectedDistance.turns }, (_, index) => index + 1),
    [selectedDistance.turns]
  );

  return (
    <section className="tools-page" aria-labelledby="tools-title">
      <GameCard className="tools-page-header-card">
        <SectionHeader
          kicker="เครื่องมือคำนวณ"
          title="Wit Calculator"
          titleClassName="tools-title"
          action={<span className="tools-page-icon" aria-hidden="true"><Calculator size={25} /></span>}
        />
        <p className="tools-page-description">คำนวณค่า Wisdom ตามระดับ Aptitude และ Turn ของสนาม</p>
      </GameCard>

      <section className="wit-calculator" aria-label="Wit calculator">
        <div className="wit-controls">
          <label className="wit-control">
            <span><Sparkles size={16} /> Style Aptitude</span>
            <select value={aptitude} onChange={(event) => setAptitude(event.target.value)}>
              {APTITUDES.map((item) => <option key={item.rank} value={item.rank}>{item.rank} (+{Math.round((item.modifier - 1) * 100)}%)</option>)}
            </select>
          </label>
          <label className="wit-control">
            <span><Route size={16} /> สนาม</span>
            <select value={distance} onChange={(event) => setDistance(event.target.value)}>
              {DISTANCES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <div className="wit-rate-card">
            <span><Gauge size={16} /> Wit regen bonus</span>
            <strong>+{aptitudeBonus}%</strong>
          </div>
        </div>

        <div className="wit-table-scroll">
          <table className="wit-table">
            <thead>
              <tr>
                <th className="wit-label-cell" rowSpan="2">Wit</th>
                <th className="wit-turn-heading" colSpan={turns.length}>Turn · {selectedDistance.label}</th>
              </tr>
              <tr>{turns.map((turn) => <th key={turn}>{turn}</th>)}</tr>
            </thead>
            <tbody>
              {WISDOM_VALUES.map((wisdom) => (
                <tr key={wisdom}>
                  <th scope="row">{wisdom}</th>
                  {turns.map((turn) => <td key={turn}>{getWitValue({ wisdom, turn, styleModifier: selectedAptitude.modifier })}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
