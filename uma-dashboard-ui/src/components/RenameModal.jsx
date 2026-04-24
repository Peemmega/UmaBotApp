import React, { useState } from "react";
import { playSound } from "../utils/soundManager";

export default function RenameModal({ currentName, onClose, onSave }) {
  const [name, setName] = useState(currentName || "");
  const [closing, setClosing] = useState(false);

  const closeModal = () => {
    playSound("close");
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    playSound("save");
    onSave(trimmed);
  };

  return (
    <div className={`rename-backdrop ${closing ? "closing" : ""}`} onClick={closeModal}>
      <div className={`rename-modal ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="rename-header">
          <h2>เปลี่ยนชื่อผู้ใช้</h2>
          <button className="rename-close-btn" onClick={closeModal}>×</button>
        </div>

        <div className="rename-body">
          <div className="rename-label">ชื่อที่แสดงบน Profile และการแข่ง</div>

          <input
            className="rename-input"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="ใส่ชื่อใหม่"
            autoFocus
          />

          <div className="rename-counter">{name.length}/24</div>
        </div>

        <div className="rename-footer">
          <button className="white-btn" onClick={closeModal}>
            Cancel
          </button>
          <button className="green-btn" onClick={saveName}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}