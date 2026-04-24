import React from "react";
import icon from "../assets/icons/uma-icon.gif";
import "../styles/loading.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
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