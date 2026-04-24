import React, { useState } from "react";
import ZoneEditModal from "./ZoneEditModal";
import editIcon from "../assets/icons/change_icon.png";
import { playSound } from "../utils/soundManager";

export default function ZonePanel({ player, onSaved }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const zone = player?.zone || {};

  return (
    <section className="zone-card">
      <div className="zone-banner">zone</div>

      <div className="zone-content">
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
          <div>เพิ่มแต้มรวม +{zone.total_bonus ?? 0}</div>
          <div>เพิ่มลูกเต๋า d/kh +{zone.dice_bonus ?? 0}</div>
        </div>
      </div>

      {isEditOpen && (
        <ZoneEditModal
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