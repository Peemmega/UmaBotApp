import React, { useState } from "react";
import ZoneEditModal from "./ZoneEditModal";
import editIcon from "../assets/icons/change_icon.webp";
import { playSound } from "../utils/soundManager";

export default function ZonePanel({ userId, player, onSaved }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const zone = player?.zone || {};

  const ZONE_VALUE = {
    flat: 20,
    add_dkh: 1,
    cap_floor: 3,
    self_heal_stamina: 1,
    modify_current_speed: 0.75,
  };

  const getZoneEffectLines = (build = {}) => {
    const capFloorBuild = (build.cap_floor ?? 0) + (build.floor ?? 0) + (build.cap ?? 0);
    const effects = {
      flat: (build.flat ?? 0) * ZONE_VALUE.flat,
      add_dkh: (build.add_dkh ?? 0) * ZONE_VALUE.add_dkh,
      cap_floor: capFloorBuild * ZONE_VALUE.cap_floor,
      self_heal_stamina:
        (build.self_heal_stamina ?? 0) * ZONE_VALUE.self_heal_stamina,
      modify_current_speed:
        (build.modify_current_speed ?? 0) * ZONE_VALUE.modify_current_speed,
    };

    const lines = [];

    if (effects.flat) lines.push(`✨ เพิ่มผลรวม +${effects.flat}`);
    if (effects.add_dkh) lines.push(`🎲 เพิ่มลูกเต๋า d/kh +${effects.add_dkh}`);
    if (effects.cap_floor) lines.push(`🧱📈 เพิ่มแต้มขั้นต่ำและสูงสุด +${effects.cap_floor}`);
    if (effects.self_heal_stamina) {
      lines.push(`❤️ ฟื้นฟู STA ตัวเอง +${effects.self_heal_stamina}`);
    }
    if (effects.modify_current_speed) {
      lines.push(`👟 เพิ่มอัตราเร่ง ${effects.modify_current_speed} ระดับ`);
    }

    return lines.length ? lines : ["Zone ทำงาน แต่ยังไม่มีค่าที่อัปไว้"];
  };
  return (
    <section className="sheet-card">
      <div className="title-banner">
        <h2>Zone</h2>
      </div>

      <div className="padding-content">
        <button
          className="zone-edit-btn"
          onClick={() => {
            playSound("open");
            setIsEditOpen(true);
          }}
        >
          <img src={editIcon} alt="edit zone" />
        </button>

        <div className="zone-image-frame">
          {zone.image_url ? (
            <img src={zone.image_url} className="zone-main-image" />
          ) : (
            <div className="zone-image-placeholder">Zone Image</div>
          )}
        </div>

        <div className="zone-name-row">
          <h3>{zone.name || "ชื่อ Zone"}</h3>
        </div>

        <div className="zone-divider" />

        <div className="zone-summary">
          {getZoneEffectLines(zone?.build).map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>

      {isEditOpen && (
        <ZoneEditModal
          userId={userId}
          player={player}
          zone={zone}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updatedZone) => {
            onSaved?.(updatedZone);
            setIsEditOpen(false);
          }}
        />
      )}
    </section>
  );
}
