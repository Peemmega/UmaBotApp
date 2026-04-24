import React, { useEffect, useState } from "react";
import icon from "../assets/icons/uma-icon.gif";
import "../styles/loading.css";

export default function LoadingScreen() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHide(true);
    }, 1200);

    return () => clearTimeout(timer);
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