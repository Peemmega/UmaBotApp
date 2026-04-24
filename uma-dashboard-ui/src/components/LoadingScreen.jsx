import React, { useEffect, useState } from "react";
import icon from "../assets/icons/uma-icon.gif";
import "../styles/loading.css";

export default function LoadingScreen({ onFinished }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setHide(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      onFinished?.();
    }, 2900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinished]);

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