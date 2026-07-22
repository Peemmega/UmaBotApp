import { useMemo, useState } from "react";
import { Calculator, Gauge, Route, Sparkles } from "lucide-react";
import "../../styles/toolsPage.css";

const APTITUDES = ["G", "F", "E", "D", "C", "B", "A", "S"];
const DISTANCES = [
  { key: "sprint", label: "Sprint", turns: 8 },
  { key: "mile", label: "Mile", turns: 12 },
  { key: "medium", label: "Medium", turns: 16 },
  { key: "long", label: "Long", turns: 20 },
];
const WISDOM_VALUES = Array.from({ length: 8 }, (_, index) => index + 1);

function getWitValue({ wisdom, turn, startRate }) {
  // With G / start rate 10 this reproduces the supplied table: 110, 122, 134...
  return 100 + wisdom * startRate + (turn - 1) * (startRate + wisdom * 2);
}

export default function ToolsPage() {
  const [aptitude, setAptitude] = useState("G");
  const [distance, setDistance] = useState("medium");
  const startRate = (APTITUDES.indexOf(aptitude) + 1) * 10;
  const selectedDistance = DISTANCES.find((item) => item.key === distance) || DISTANCES[2];
  const turns = useMemo(
    () => Array.from({ length: selectedDistance.turns }, (_, index) => index + 1),
    [selectedDistance.turns]
  );

  return (
    <section className="tools-page" aria-labelledby="tools-title">
      <header className="tools-page-header">
        <span className="tools-page-icon"><Calculator size={27} /></span>
        <div>
          <p>เครื่องมือคำนวณ</p>
          <h1 id="tools-title">Wit Calculator</h1>
          <span>คำนวณค่า Wisdom ตามระดับ Aptitude และ Turn ของสนาม</span>
        </div>
      </header>

      <section className="wit-calculator" aria-label="Wit calculator">
        <div className="wit-controls">
          <label className="wit-control">
            <span><Sparkles size={16} /> Aptitude</span>
            <select value={aptitude} onChange={(event) => setAptitude(event.target.value)}>
              {APTITUDES.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
            </select>
          </label>
          <label className="wit-control">
            <span><Route size={16} /> สนาม</span>
            <select value={distance} onChange={(event) => setDistance(event.target.value)}>
              {DISTANCES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <div className="wit-rate-card">
            <span><Gauge size={16} /> Wit start rate</span>
            <strong>{startRate}</strong>
          </div>
        </div>

        <div className="wit-table-scroll">
          <table className="wit-table">
            <thead>
              <tr>
                <th className="wit-label-cell" rowSpan="2">Wisdom</th>
                <th className="wit-turn-heading" colSpan={turns.length}>Turn · {selectedDistance.label}</th>
              </tr>
              <tr>{turns.map((turn) => <th key={turn}>{turn}</th>)}</tr>
            </thead>
            <tbody>
              {WISDOM_VALUES.map((wisdom) => (
                <tr key={wisdom}>
                  <th scope="row">{wisdom}</th>
                  {turns.map((turn) => <td key={turn}>{getWitValue({ wisdom, turn, startRate })}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
