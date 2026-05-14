import { useState } from "react";
import { tcgAssets } from "../../data/tcgMockCards";

export default function CardBack({ compact = false, label = "UMA" }) {
  const [failed, setFailed] = useState(false);
  const hasImage = tcgAssets.cardBack && !failed;

  return (
    <div className={`tcg-card-back ${compact ? "compact" : ""}`}>
      {hasImage && (
        <img
          className="tcg-card-back-image"
          src={tcgAssets.cardBack}
          alt=""
          draggable="false"
          onError={() => setFailed(true)}
        />
      )}
      {!hasImage && (
        <>
          <div className="tcg-card-back-mark">{label}</div>
          <div className="tcg-card-back-ring" />
        </>
      )}
    </div>
  );
}
