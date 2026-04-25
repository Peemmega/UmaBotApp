import { useMemo } from "react";
import horseshoe from "../assets/icons/horseshoe.png";
import "../styles/horseshoe.css";

export default function HorseshoeBackground() {
  const items = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      scale: 0.6 + Math.random(),
    }));
  }, []);

  return (
    <div className="horseshoe-bg">
      {items.map((item) => (
        <img
          key={item.id}
          src={horseshoe}
          className="horseshoe"
          style={{
            left: item.left,
            top: item.top,
            animationDelay: item.delay,
            "--scale": item.scale,
          }}
        />
      ))}
    </div>
  );
}