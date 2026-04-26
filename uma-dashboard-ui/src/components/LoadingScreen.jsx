import React, { useEffect, useState } from "react";
import icon from "../assets/icons/uma-icon.webp";
import "../styles/loading.css";

export default function LoadingScreen({ onFinished }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    // เริ่ม fade
    const fadeTimer = setTimeout(() => {
      setHide(true);
    }, 2000);

    // รอ fade เสร็จค่อย remove
    const removeTimer = setTimeout(() => {
      onFinished?.();
    }, 2700); // ต้องมากกว่า transition (650ms)

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className={`loading-screen ${hide ? "hide" : ""}`}>
      <div className="loading-card">
        <img src={icon} className="loading-icon" />
        <div className="loading-title">Tracen Academy RP</div>

        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>

        <div className="loading-text">Now Loading...</div>
      </div>
    </div>
  );
}