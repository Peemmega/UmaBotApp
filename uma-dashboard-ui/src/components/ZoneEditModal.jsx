import React, { useMemo, useState } from "react";
import { playSound } from "../utils/soundManager";

import plusIcon from "../assets/icons/add.png";
import minusIcon from "../assets/icons/reduce.png";
import resetIcon from "../assets/icons/reset.png";
import editIcon from "../assets/icons/change_icon.png";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const ZONE_FIELDS = [
  ["total_bonus", "เพิ่มแต้มผลรวม"],
  ["dice_bonus", "เพิ่มจำนวนลูกเต๋า d/kh (2 แต้ม)"],
  ["min_bonus", "เพิ่มค่าทอยลูกเต๋าต่ำสุด"],
  ["selected_bonus", "เพิ่มคะแนนลูกเต๋าที่ถูกเลือก"],
  ["max_bonus", "เพิ่มค่าทอยลูกเต๋าสูงสุด"],
  ["stamina_recover", "ฟื้นฟู Stamina"],
];

export default function ZoneEditModal({ player, zone, onClose, onSaved }) {
  const [closing, setClosing] = useState(false);
  const [zoneName, setZoneName] = useState(zone?.name || "ชื่อ Zone");

  const [draft, setDraft] = useState({
    total_bonus: zone?.total_bonus ?? 0,
    dice_bonus: zone?.dice_bonus ?? 0,
    min_bonus: zone?.min_bonus ?? 0,
    selected_bonus: zone?.selected_bonus ?? 0,
    max_bonus: zone?.max_bonus ?? 0,
    stamina_recover: zone?.stamina_recover ?? 0,
  });

  const [saving, setSaving] = useState(false);

  const usedPoints = useMemo(() => {
    return (
      draft.total_bonus +
      draft.min_bonus +
      draft.selected_bonus +
      draft.max_bonus +
      draft.stamina_recover +
      draft.dice_bonus * 2
    );
  }, [draft]);

  const zonePoints = player?.zone?.points ?? 0;
  const originalUsed =
    (zone?.total_bonus ?? 0) +
    (zone?.min_bonus ?? 0) +
    (zone?.selected_bonus ?? 0) +
    (zone?.max_bonus ?? 0) +
    (zone?.stamina_recover ?? 0) +
    (zone?.dice_bonus ?? 0) * 2;

  const totalPool = zonePoints + originalUsed;
  const remaining = totalPool - usedPoints;

  const closeModal = () => {
    playSound("close");
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const changeValue = (key, amount) => {
    const cost = key === "dice_bonus" ? 2 : 1;

    setDraft((prev) => {
      if (amount > 0 && remaining < cost) return prev;

      const nextValue = Math.max(0, (prev[key] ?? 0) + amount);

      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const resetDraft = () => {
    playSound("click");
    setDraft({
      total_bonus: zone?.total_bonus ?? 0,
      dice_bonus: zone?.dice_bonus ?? 0,
      min_bonus: zone?.min_bonus ?? 0,
      selected_bonus: zone?.selected_bonus ?? 0,
      max_bonus: zone?.max_bonus ?? 0,
      stamina_recover: zone?.stamina_recover ?? 0,
    });
  };

  const saveZone = async () => {
    try {
      setSaving(true);
      playSound("click");

      const payload = {
        user_id: String(player?.user_id),
        name: zoneName.trim(),
        points: remaining,
        ...draft,
      };

      const res = await fetch(`${BOT_API_BASE}/player/zone/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Update zone failed");
      }

      playSound("save");
      onSaved?.(data.zone || payload);
    } catch (err) {
      console.error(err);
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`zone-edit-backdrop ${closing ? "closing" : ""}`} onClick={closeModal}>
      <div className={`zone-edit-modal ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="zone-edit-banner">zone</div>

        <div className="zone-edit-body">
          <button className="zone-edit-image-btn">
            <img src={editIcon} />
          </button>

          <div className="zone-edit-image-frame">
            {zone?.image_url ? (
              <img src={zone.image_url} className="zone-edit-main-image" />
            ) : (
              <div className="zone-image-placeholder">Zone Image</div>
            )}
          </div>

          <div className="zone-edit-name-wrap">
            <input
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="zone-edit-name-input"
              maxLength={32}
            />
            <button className="zone-name-edit-small">
              <img src={editIcon} />
            </button>
          </div>

          <div className="zone-divider" />

          <div className="zone-point-line">
            <span>Zone pt คงเหลือ</span>
            <strong>{remaining}</strong>
          </div>

          <div className="zone-edit-list">
            {ZONE_FIELDS.map(([key, label]) => (
              <div className="zone-edit-row" key={key}>
                <div className="zone-edit-label">{label}</div>

                <button
                  className="zone-adjust-btn"
                  onClick={() => changeValue(key, -1)}
                  disabled={(draft[key] ?? 0) <= 0 || saving}
                >
                  <img src={minusIcon} />
                </button>

                <div className="zone-edit-value">{draft[key] ?? 0}</div>

                <button
                  className="zone-adjust-btn plus"
                  onClick={() => changeValue(key, 1)}
                  disabled={remaining < (key === "dice_bonus" ? 2 : 1) || saving}
                >
                  <img src={plusIcon} />
                </button>
              </div>
            ))}
          </div>

          <div className="zone-edit-actions">
            <button className="zone-cancel-btn" onClick={closeModal}>
              ยกเลิก
            </button>

            <button className="zone-save-btn" onClick={saveZone} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>

            <button className="zone-reset-btn" onClick={resetDraft}>
              <img src={resetIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}