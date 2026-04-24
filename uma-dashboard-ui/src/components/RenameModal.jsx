import React, { useState } from "react";
import { playSound } from "../utils/soundManager";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

export default function RenameModal({ userId, currentName, onClose, onSave }) {
  const [name, setName] = useState(currentName || "");
  const [closing, setClosing] = useState(false);

  const closeModal = () => {
    playSound("close");
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      playSound("click");

      const res = await fetch(`${BOT_API_BASE}/player/username/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          username: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Update name failed");
      }

      playSound("save");
      onSave(data.username);
    } catch (err) {
      console.error(err);
      alert(String(err));
    }
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
            ยกเลิก
          </button>
          <button className="green-btn" onClick={saveName}>
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}