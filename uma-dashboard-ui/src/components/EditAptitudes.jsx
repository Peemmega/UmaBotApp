import { useState } from "react";
import { aptitudeRows } from "../data/dashboardConfig";
import { APP_BASE_URL } from "../api/appConfig";

const ranks = ["G", "F", "E", "D", "C", "B", "A", "S"];

export default function EditAptitudes({ player, onCancel, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(
    aptitudeRows.flatMap((row) => row.items.map(({ key }) => [key, Math.min(8, Math.max(1, Number(player?.[key]) || 1))]))
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${APP_BASE_URL}/api/profile/aptitudes`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "บันทึกไม่สำเร็จ");
      onSaved(data.player);
    } catch (err) {
      setError(err.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return <form className="trainer-aptitude-editor" onSubmit={save}>
    <p>เลือกระดับความถนัดแต่ละประเภท ตั้งแต่ G ถึง S</p>
    {aptitudeRows.map((row) => <fieldset key={row.title} disabled={saving}>
      <legend>{row.title}</legend>
      <div className="trainer-aptitude-fields">{row.items.map((item) => <label key={item.key}>
        <span>{item.label}</span>
        <select value={values[item.key]} onChange={(event) => setValues((current) => ({ ...current, [item.key]: Number(event.target.value) }))}>
          {ranks.map((rank, index) => <option key={rank} value={index + 1}>{rank}</option>)}
        </select>
      </label>)}</div>
    </fieldset>)}
    {error && <p className="trainer-aptitude-error" role="alert">{error}</p>}
    <div className="trainer-aptitude-actions"><button type="submit" disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึก Aptitude"}</button><button type="button" disabled={saving} onClick={onCancel}>ยกเลิก</button></div>
  </form>;
}
