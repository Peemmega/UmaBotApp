import React, { useMemo, useState } from "react";
import { playSound } from "../utils/soundManager";

import plusIcon from "../assets/icons/add.webp";
import minusIcon from "../assets/icons/reduce.webp";
import resetIcon from "../assets/icons/reset.webp";
import editIcon from "../assets/icons/change_icon.webp";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const ZONE_FIELDS = [
  ["flat", "เพิ่มแต้มผลรวม"],
  ["add_dkh", "เพิ่มจำนวนลูกเต๋า d/kh (3 แต้ม)"],
  ["floor", "เพิ่มค่าทอยลูกเต๋าต่ำสุด"],
  ["selected_die", "เพิ่มคะแนนลูกเต๋าที่ถูกเลือก"],
  ["cap", "เพิ่มค่าทอยลูกเต๋าสูงสุด"],
  ["self_heal_stamina", "ฟื้นฟู Stamina"],
];

const normalizeBuild = (build = {}) => ({
  flat: build.flat ?? 0,
  add_dkh: build.add_dkh ?? 0,
  floor: build.floor ?? 0,
  selected_die: build.selected_die ?? 0,
  cap: build.cap ?? 0,
  self_heal_stamina: build.self_heal_stamina ?? 0,
});

export default function ZoneEditModal({ userId, player, zone, onClose, onSaved }) {
  const [closing, setClosing] = useState(false);
  const [zoneName, setZoneName] = useState(zone?.name || "ชื่อ Zone");
  const [imageUrl, setImageUrl] = useState(zone?.image_url || "");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  const originalBuild = useMemo(
    () => normalizeBuild(zone?.build),
    [zone]
  );

  const [draft, setDraft] = useState(originalBuild);

  const usedPoints = useMemo(() => {
    return (
      draft.flat +
      draft.floor +
      draft.selected_die +
      draft.cap +
      draft.self_heal_stamina +
      draft.add_dkh * 3
    );
  }, [draft]);

  const originalUsedPoints = useMemo(() => {
    return (
      originalBuild.flat +
      originalBuild.floor +
      originalBuild.selected_die +
      originalBuild.cap +
      originalBuild.self_heal_stamina +
      originalBuild.add_dkh * 3
    );
  }, [originalBuild]);

  const MAX_ZONE_POINT = 5;
  const remaining = MAX_ZONE_POINT - usedPoints;

  const closeModal = () => {
    playSound("close");
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
  };

  const changeValue = (key, amount) => {
    const cost = key === "add_dkh" ? 3 : 1;

    setDraft((prev) => {
      if (amount > 0 && remaining < cost) return prev;

      return {
        ...prev,
        [key]: Math.max(0, (prev[key] ?? 0) + amount),
      };
    });
  };

  const resetDraft = () => {
    playSound("click");
    setDraft(originalBuild);
    setZoneName(zone?.name || "ชื่อ Zone");
    setImageUrl(zone?.image_url || "");
  };

  const saveZone = async () => {
    try {
      setSaving(true);
      playSound("click");

      const cleanImageUrl = imageUrl.trim();

      if (cleanImageUrl && !/^https?:\/\//i.test(cleanImageUrl)) {
        alert("กรุณาใส่ URL รูปที่ขึ้นต้นด้วย http:// หรือ https://");
        return;
      }

      const payload = {
        user_id: String(userId),
        name: zoneName.trim(),
        image_url: cleanImageUrl,
        build: draft,
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

      onSaved?.(
        data.zone || {
          name: payload.name,
          image_url: payload.image_url,
          points: payload.points,
          build: payload.build,
        }
      );
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
          <div className="zone-edit-image-frame">
            {imageUrl ? (
              <img src={imageUrl} className="zone-edit-main-image" />
            ) : (
              <div className="zone-image-placeholder">Zone Image</div>
            )}
          </div>

          <input
              className="zone-image-url-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="วาง Image URL เช่น https://..."
          />  

          <div className="zone-edit-name-wrap">
            {editingName ? (
              <input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="zone-edit-name-input"
                maxLength={32}
                autoFocus
              />
            ) : (
              <div className="zone-edit-name-display">{zoneName}</div>
            )}

            <button
              className="zone-name-edit-small"
              onClick={() => {
                playSound("click");
                setEditingName((prev) => !prev);
              }}
            >
              <img src={editIcon} alt="edit name" />
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
                  disabled={remaining < (key === "add_dkh" ? 3 : 1) || saving}
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