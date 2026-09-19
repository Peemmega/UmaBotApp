import icon_concentration from "../assets/skill_icon/Concentration.webp";
import icon_acceleration_rare from "../assets/skill_icon/Acceleration.webp";
import icon_velocity_rare from "../assets/skill_icon/Velocity.webp";
import icon_recovery_rare from "../assets/skill_icon/Recovery.webp";
import icon_acceleration_common from "../assets/skill_icon/acceleration_common.png";
import icon_velocity_common from "../assets/skill_icon/velocity_common.png";
import icon_recovery_common from "../assets/skill_icon/stamina_common.png";
import icon_decrease from "../assets/skill_icon/DecreaseVelocity.webp";
import icon_reduce_sta from "../assets/skill_icon/ReduceSTA.webp";
import icon_lookup_rare from "../assets/skill_icon/LookUp.webp";
import icon_lookup_common from "../assets/skill_icon/lookUp_common.png";
import icon_blind from "../assets/skill_icon/Blind.webp";
import icon_navigation_rare from "../assets/skill_icon/Navigation.png";
import icon_navigation_common from "../assets/skill_icon/navigation_common.png";
import icon_u_velocity from "../assets/skill_icon/UniqueSkillVelocity.webp";
import icon_u_acceleration from "../assets/skill_icon/UniqueSkillAcceleration.webp";
import icon_passive from "../assets/skill_icon/Passive.webp";

export function getSkillIcon(icon) {
  const iconMap = {
    Concentration: icon_concentration,
    Acceleration_rare: icon_acceleration_rare,
    Velocity_rare: icon_velocity_rare,
    Recovery_rare: icon_recovery_rare,
    DecreaseVelocity: icon_decrease,
    ReduceSTA: icon_reduce_sta,
    LookUp_rare: icon_lookup_rare,
    Blind: icon_blind,
    Navigation_rare: icon_navigation_rare,
    Concentration_rare: icon_concentration,
    DecreaseVelocity_rare: icon_decrease,
    ReduceSTA_rare: icon_reduce_sta,
    Blind_rare: icon_blind,
    Passive_rare: icon_passive,
    acceleration: icon_acceleration_common,
    velocity: icon_velocity_common,
    stamina: icon_recovery_common,
    lookup: icon_lookup_common,
    navigation: icon_navigation_common,
    // Legacy keys keep historical skill snapshots renderable.
    Acceleration: icon_acceleration_rare,
    Velocity: icon_velocity_rare,
    Recovery: icon_recovery_rare,
    LookUp: icon_lookup_rare,
    Navigation: icon_navigation_rare,
    UniqueVelocity: icon_u_velocity,
    UniqueAcceleration: icon_u_acceleration,
    Passive: icon_passive
  };

  const src = iconMap[icon];

  return src ? (
    <img src={src} alt={icon} className="skill-icon-img" />
  ) : (
    <span>✨</span>
  );
}
