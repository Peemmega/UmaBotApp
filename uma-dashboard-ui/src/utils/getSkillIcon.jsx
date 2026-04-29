import icon_concentration from "../assets/skill_icon/Concentration.webp";
import icon_acceleration from "../assets/skill_icon/Acceleration.webp";
import icon_velocity from "../assets/skill_icon/Velocity.webp";
import icon_recovery from "../assets/skill_icon/Recovery.webp";
import icon_decrease from "../assets/skill_icon/DecreaseVelocity.webp";
import icon_reduce_sta from "../assets/skill_icon/ReduceSTA.webp";
import icon_lookup from "../assets/skill_icon/LookUp.webp";
import icon_blind from "../assets/skill_icon/Blind.webp";
import icon_u_velocity from "../assets/skill_icon/UniqueSkillVelocity.webp";
import icon_u_acceleration from "../assets/skill_icon/UniqueSkillAcceleration.webp";

export function getSkillIcon(icon) {
  const iconMap = {
    Concentration: icon_concentration,
    Acceleration: icon_acceleration,
    Velocity: icon_velocity,
    Recovery: icon_recovery,
    DecreaseVelocity: icon_decrease,
    ReduceSTA: icon_reduce_sta,
    LookUp: icon_lookup,
    Blind: icon_blind,
    UniqueVelocity: icon_u_velocity,
    UniqueAcceleration: icon_u_acceleration
  };

  const src = iconMap[icon];

  return src ? (
    <img src={src} alt={icon} className="skill-icon-img" />
  ) : (
    <span>✨</span>
  );
}