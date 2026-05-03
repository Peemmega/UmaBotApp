import React, { useEffect } from "react";
import "../styles/skillsPage.css"; // ใช้ style เดิม

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === "success" ? "✓" : "!"}
      </div>
      <div>
        <strong>
          {type === "success" ? "สำเร็จ" : "เกิดข้อผิดพลาด"}
        </strong>
        <p>{message}</p>
      </div>
    </div>
  );
}