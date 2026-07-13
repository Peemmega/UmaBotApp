import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/skillsPage.css"; // ใช้ style เดิม

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const toast = (
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

  return typeof document === "undefined" ? toast : createPortal(toast, document.body);
}
