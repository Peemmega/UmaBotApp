import { useState } from "react";
import { Dialog } from "./ui";
import { playSound } from "../utils/soundManager";
import { BOT_API_BASE } from "../api/playerApi";

export default function RenameModal({ userId, currentName, onClose, onSave, saveLocally = false }) {
  const [name, setName] = useState(currentName || "");
  const [closing, setClosing] = useState(false);

  const closeModal = () => {
    if (closing) return;
    playSound("close");
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      playSound("click");

      if (saveLocally) {
        playSound("save");
        onSave(trimmed);
        return;
      }

      const res = await fetch(`${BOT_API_BASE}/player/username/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: String(userId),
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
    <Dialog className="rename-modal" backdropClassName="rename-backdrop" closeClassName="rename-close-btn" title="เปลี่ยนชื่อผู้ใช้" closing={closing} closeDisabled={closing} onClose={closeModal}>
        <div className="rename-body">
          <label htmlFor="rename-username" className="rename-label">ชื่อที่แสดงบน Profile และการแข่ง</label>

          <input
            className="rename-input"
            id="rename-username"
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
    </Dialog>
  );
}
