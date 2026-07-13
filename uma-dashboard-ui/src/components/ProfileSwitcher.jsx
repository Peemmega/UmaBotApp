import { UserRound, UsersRound, UserCog } from "lucide-react";
import { PROFILE_TYPES } from "../data/profilePresets";
import { playSound } from "../utils/soundManager";

const icons = { trainee: UserRound, trainer: UserCog, npc: UsersRound };

export default function ProfileSwitcher({ activeType, profiles, onSelect }) {
  return (
    <div className="profile-switcher" role="group" aria-label="Switch profile">
      {Object.values(PROFILE_TYPES).map((profile) => {
        const Icon = icons[profile.id];
        const active = activeType === profile.id;
        return (
          <button
            key={profile.id}
            type="button"
            className={`profile-switcher-btn ${active ? "active" : ""}`}
            onClick={() => {
              playSound("click");
              onSelect(profile.id);
            }}
            aria-pressed={active}
            title={`Switch to ${profile.label}`}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{profiles?.[profile.id]?.name || profile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
