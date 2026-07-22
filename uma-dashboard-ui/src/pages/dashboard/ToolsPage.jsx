import { useMemo, useState } from "react";
import { Calculator, Gauge, Route, Sparkles } from "lucide-react";
import { GameCard, SectionHeader } from "../../components/ui";
import "../../styles/toolsPage.css";

const APTITUDES = [
  { rank: "G", bonus: 0 },
  { rank: "F", bonus: 5 },
  { rank: "E", bonus: 10 },
  { rank: "D", bonus: 15 },
  { rank: "C", bonus: 20 },
  { rank: "B", bonus: 25 },
  { rank: "A", bonus: 30 },
  { rank: "S", bonus: 35 },
];
const DISTANCES = [
  { key: "sprint", label: "Sprint", turns: 8 },
  { key: "mile", label: "Mile", turns: 8 },
  { key: "medium", label: "Medium", turns: 12 },
  { key: "long", label: "Long", turns: 16 },
];
const WISDOM_VALUES = Array.from({ length: 8 }, (_, index) => index + 1);

function getWitValue({ wisdom, turn, aptitudeBonus }) {
  // Turn 1 always begins at 100 + (10 × Wit), before any aptitude bonus applies.
  const baseValue = 100 + wisdom * 10 + (turn - 1) * (10 + wisdom * 2);
  return turn === 1 ? baseValue : Math.round(baseValue * (1 + aptitudeBonus / 100));
}

export default function ToolsPage() {
  const [aptitude, setAptitude] = useState("G");
  const [distance, setDistance] = useState("medium");
  const aptitudeBonus = APTITUDES.find((item) => item.rank === aptitude)?.bonus ?? 0;
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
            <span><Sparkles size={16} /> Aptitude</span>
            <select value={aptitude} onChange={(event) => setAptitude(event.target.value)}>
              {APTITUDES.map((item) => <option key={item.rank} value={item.rank}>{item.rank} (+{item.bonus}%)</option>)}
            </select>
          </label>
          <label className="wit-control">
            <span><Route size={16} /> สนาม</span>
            <select value={distance} onChange={(event) => setDistance(event.target.value)}>
              {DISTANCES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <div className="wit-rate-card">
            <span><Gauge size={16} /> Aptitude bonus</span>
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
                  {turns.map((turn) => <td key={turn}>{getWitValue({ wisdom, turn, aptitudeBonus })}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
