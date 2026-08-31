import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BOT_API_BASE } from "../api/playerApi";
import { playSound } from "../utils/soundManager";
import "./SkillLoadoutPresetModal.css";

const PRESET_SLOTS = [1, 2, 3];

async function presetRequest(path, options) {
  const response = await fetch(`${BOT_API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Preset request failed");
  return data;
}

export default function SkillLoadoutPresetModal({
  userId,
  currentSkillIds,
  currentZone,
  onClose,
  onApplied,
}) {
  const [presets, setPresets] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState(null);
  const [message, setMessage] = useState("");

  const loadPresets = async () => {
    setLoading(true);
    try {
      const data = await presetRequest(`/player/${userId}/skill-loadout-presets`);
      const nextPresets = Array.isArray(data.presets) ? data.presets : [];
      setPresets(nextPresets);
      setNames((current) => {
        const next = { ...current };
        nextPresets.forEach((preset) => {
          next[preset.slot] = preset.name;
        });
        return next;
      });
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, [userId]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const savePreset = async (slot) => {
    setBusySlot(slot);
    setMessage("");
    try {
      const name = names[slot]?.trim() || `Preset ${slot}`;
      await presetRequest(`/player/${userId}/skill-loadout-presets/${slot}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          skill_ids: currentSkillIds,
          zone: currentZone,
        }),
      });
      playSound("save");
      setMessage(`บันทึก ${name} แล้ว`);
      await loadPresets();
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setBusySlot(null);
    }
  };

  const applyPreset = async (slot) => {
    setBusySlot(slot);
    setMessage("");
    try {
      const data = await presetRequest(`/player/${userId}/skill-loadout-presets/${slot}/apply`, {
        method: "POST",
      });
      playSound("open");
      onApplied?.(data.preset);
      setMessage(`โหลด ${data.preset?.name || `Preset ${slot}`} แล้ว`);
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setBusySlot(null);
    }
  };

  const deletePreset = async (slot) => {
    setBusySlot(slot);
    setMessage("");
    try {
      await presetRequest(`/player/${userId}/skill-loadout-presets/${slot}`, {
        method: "DELETE",
      });
      playSound("close");
      setMessage("ลบ preset แล้ว");
      await loadPresets();
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setBusySlot(null);
    }
  };

  const presetBySlot = new Map(presets.map((preset) => [preset.slot, preset]));

  return createPortal(
    <div className="skill-preset-backdrop" onMouseDown={onClose}>
      <section
        className="skill-preset-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-preset-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="skill-preset-header">
          <div>
            <span>Skill Loadout</span>
            <h2 id="skill-preset-title">Presets</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close presets">×</button>
        </header>

        <p className="skill-preset-intro">บันทึกชุดสกิลปัจจุบัน 4 ช่องและ Zone ได้สูงสุด 3 ชุด</p>
        {message ? <p className="skill-preset-message">{message}</p> : null}

        <div className="skill-preset-list">
          {PRESET_SLOTS.map((slot) => {
            const preset = presetBySlot.get(slot);
            const isBusy = busySlot === slot;
            const skillIds = preset?.skill_ids?.filter(Boolean) || [];

            return (
              <article className="skill-preset-item" key={slot}>
                <span className="skill-preset-slot">{slot}</span>
                <div className="skill-preset-content">
                  <label>
                    {/* <span>ชื่อ preset</span> */}
                    <input
                      value={names[slot] ?? preset?.name ?? `Preset ${slot}`}
                      maxLength={32}
                      onChange={(event) => setNames((current) => ({ ...current, [slot]: event.target.value }))}
                    />
                  </label>
                  {preset ? (
                    <>
                      <p><b>Skills:</b> {skillIds.length ? skillIds.join(" · ") : "ไม่มีสกิล"}</p>
                      <p><b>Zone:</b> {preset.zone?.name || "Default Zone"}</p>
                    </>
                  ) : <p>ยังไม่มี preset ในช่องนี้</p>}
                  <div className="skill-preset-actions">
                    {preset ? (
                      <button type="button" onClick={() => applyPreset(slot)} disabled={isBusy}>ใช้</button>
                    ) : null}
                    <button type="button" onClick={() => savePreset(slot)} disabled={isBusy}>
                      {preset ? "บันทึกทับ" : "บันทึก"}
                    </button>
                    {preset ? <button type="button" className="is-danger" onClick={() => deletePreset(slot)} disabled={isBusy}>ลบ</button> : null}
                  </div>
                </div>
                
              </article>
            );
          })}
        </div>

        {loading ? <p className="skill-preset-loading">กำลังโหลด preset...</p> : null}
      </section>
    </div>,
    document.body
  );
}
