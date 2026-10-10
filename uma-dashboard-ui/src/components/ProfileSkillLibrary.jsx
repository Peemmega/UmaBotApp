import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BOT_API_BASE } from "../api/playerApi";
import { getSkillIcon } from "../utils/getSkillIcon";
import { describeRaceEffect } from "../utils/raceEffects";

function getSkillRarity(skill) {
  const icon = String(skill?.icon || "");
  if (icon.startsWith("Unique")) return "unique";
  if (icon.endsWith("_rare")) return "rare";
  return "common";
}

function getSkillEffects(skill) {
  return Array.isArray(skill?.effects) ? skill.effects : [];
}

export default function ProfileSkillLibrary({ userId, username }) {
  const [skills, setSkills] = useState([]);
  const [equippedSkills, setEquippedSkills] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [equipError, setEquipError] = useState("");
  const [savingSlot, setSavingSlot] = useState(null);

  const loadPlayerSkills = async (signal) => {
    const response = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(userId)}/skills`, { signal });
    if (!response.ok) throw new Error("ไม่สามารถโหลดสกิลของผู้เล่นได้");
    setEquippedSkills(await response.json());
  };

  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();

    async function loadLibrary() {
      setLoading(true);
      setError("");
      try {
        const [catalogResponse, playerSkillsResponse] = await Promise.all([
          fetch(`${BOT_API_BASE}/skills?tag=all`, { signal: controller.signal }),
          fetch(`${BOT_API_BASE}/player/${encodeURIComponent(userId)}/skills`, { signal: controller.signal }),
        ]);
        if (!catalogResponse.ok || !playerSkillsResponse.ok) throw new Error("ไม่สามารถโหลดรายการสกิลได้");
        const [catalog, playerSkills] = await Promise.all([catalogResponse.json(), playerSkillsResponse.json()]);
        if (controller.signal.aborted) return;
        setSkills(Array.isArray(catalog) ? catalog : []);
        setEquippedSkills(playerSkills || {});
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError.message || "เกิดข้อผิดพลาดระหว่างโหลดสกิล");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadLibrary();
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!selectedSkill) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedSkill(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSkill]);

  const ownedSkillIds = useMemo(() => new Set(
    Object.values(equippedSkills || {})
      .map((skill) => String(skill?.id || skill || "").trim().toLowerCase())
      .filter(Boolean)
  ), [equippedSkills]);

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return skills
      .filter((skill) => ownedSkillIds.has(String(skill.id || "").trim().toLowerCase()))
      .filter((skill) => !query || `${skill.name || ""} ${skill.id || ""} ${(skill.tags || []).join(" ")}`.toLocaleLowerCase().includes(query))
      .sort((left, right) => String(left.name || left.id).localeCompare(String(right.name || right.id), undefined, { numeric: true, sensitivity: "base" }));
  }, [ownedSkillIds, search, skills]);

  const equipSkill = async (slot) => {
    if (!selectedSkill || getSkillRarity(selectedSkill) !== "common") return;
    setSavingSlot(slot);
    setEquipError("");
    try {
      const response = await fetch(`${BOT_API_BASE}/player/skill/equip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: String(userId), username: username || "Unknown", slot, skill_id: selectedSkill.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "ติดตั้งสกิลไม่สำเร็จ");
      await loadPlayerSkills();
      setSelectedSkill(null);
    } catch (saveError) {
      setEquipError(saveError.message || "เชื่อมต่อ server ไม่ได้");
    } finally {
      setSavingSlot(null);
    }
  };

  return (
    <section className="profile-library-panel" aria-labelledby="profile-skill-title">
      <header className="profile-library-header">
        <div>
          <span>SKILL LIBRARY</span>
          <h2 id="profile-skill-title">สกิลทั้งหมด</h2>
        </div>
        <strong>{filteredSkills.length} สกิล</strong>
      </header>

      <label className="profile-skill-search">
        <span>ค้นหาสกิล</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาจากชื่อหรือรหัสสกิล" />
      </label>

      {loading ? <p className="profile-page-status">กำลังโหลดรายการสกิล...</p> : error ? <p className="profile-page-status is-error">{error}</p> : filteredSkills.length ? (
        <div className="profile-skill-grid">
          {filteredSkills.map((skill) => {
            const rarity = getSkillRarity(skill);
            const canEquip = rarity === "common";
            const equippedSlot = Object.entries(equippedSkills || {}).find(([, value]) => String(value?.id || "") === String(skill.id))?.[0];
            return (
              <button type="button" className={`profile-skill-card rarity-${rarity}`} key={skill.id} onClick={() => { setEquipError(""); setSelectedSkill(skill); }}>
                <span className="profile-skill-icon">{getSkillIcon(skill.icon)}</span>
                <span className="profile-skill-copy">
                  <strong>{skill.name || skill.id}</strong>
                  <small>{skill.id}</small>
                </span>
                <span className={`profile-skill-state${equippedSlot ? " is-equipped" : canEquip ? " is-available" : " is-locked"}`}>
                  {equippedSlot ? `ช่อง ${equippedSlot.replace("slot_", "")}` : canEquip ? "สีขาว" : "ยังใช้ไม่ได้"}
                </span>
              </button>
            );
          })}
        </div>
      ) : <p className="profile-page-status">ไม่พบสกิลที่ตรงกับคำค้นหา</p>}

      {selectedSkill && createPortal(
        <div className="profile-skill-detail-backdrop" onMouseDown={() => setSelectedSkill(null)}>
          <section className="profile-skill-detail" role="dialog" aria-modal="true" aria-labelledby="profile-skill-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="profile-skill-detail-close" onClick={() => setSelectedSkill(null)} aria-label="ปิดรายละเอียด">×</button>
            <div className="profile-skill-detail-heading">
              <span className={`profile-skill-icon rarity-${getSkillRarity(selectedSkill)}`}>{getSkillIcon(selectedSkill.icon)}</span>
              <div><small>{selectedSkill.id}</small><h3 id="profile-skill-detail-title">{selectedSkill.name}</h3></div>
            </div>
            <div className="profile-skill-detail-meta"><span>CD {selectedSkill.cooldown ?? 0}</span><span>Cost {selectedSkill.cost ?? 0}</span><span>{getSkillRarity(selectedSkill) === "common" ? "สกิลสีขาว" : getSkillRarity(selectedSkill) === "rare" ? "สกิลหายาก" : "สกิล Unique"}</span></div>
            {selectedSkill.target ? <p><strong>เป้าหมาย:</strong> {selectedSkill.target}</p> : null}
            {selectedSkill.trigger ? <p><strong>เงื่อนไข:</strong> {selectedSkill.trigger}</p> : null}
            {getSkillEffects(selectedSkill).length ? <div className="profile-skill-effects"><strong>ผลของสกิล</strong><ul>{getSkillEffects(selectedSkill).map((effect, index) => <li key={`${selectedSkill.id}-${index}`}>{describeRaceEffect(effect)}</li>)}</ul></div> : null}
            {getSkillRarity(selectedSkill) === "common" ? (
              <div className="profile-skill-equip-slots">
                <strong>ติดตั้งในช่อง</strong>
                {Object.entries(equippedSkills || {}).some(([, value]) => String(value?.id || "") === String(selectedSkill.id)) ? (
                  <span className="profile-skill-already-equipped">ติดตั้งอยู่ในช่อง {Object.entries(equippedSkills).find(([, value]) => String(value?.id || "") === String(selectedSkill.id))?.[0]?.replace("slot_", "")}</span>
                ) : [1, 2, 3, 4].map((slot) => <button type="button" key={slot} disabled={savingSlot !== null} onClick={() => equipSkill(slot)}>{savingSlot === slot ? "กำลังบันทึก..." : `ช่อง ${slot}`}</button>)}
              </div>
            ) : <p className="profile-skill-lock-note">ตอนนี้ติดตั้งได้เฉพาะสกิลสีขาว</p>}
            {equipError ? <p className="profile-page-status is-error">{equipError}</p> : null}
          </section>
        </div>,
        document.body
      )}
    </section>
  );
}
