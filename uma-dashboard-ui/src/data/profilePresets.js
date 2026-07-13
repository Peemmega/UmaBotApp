export const PROFILE_TYPES = {
  trainee: { id: "trainee", label: "Trainee", subtitle: "Uma Musume", desk: "Trainee Desk" },
  trainer: { id: "trainer", label: "Trainer", subtitle: "Team Manager", desk: "Trainer Desk" },
  npc: { id: "npc", label: "NPC", subtitle: "Character Profile", desk: "NPC Desk" },
};

const PROFILE_STORAGE_PREFIX = "uma:profile-presets:";

function createProfiles(username = "") {
  return {
    trainee: { type: "trainee", name: username, imageUrl: "" },
    trainer: { type: "trainer", name: "Trainer", imageUrl: "", teamUmaIds: [] },
    npc: { type: "npc", name: "NPC", imageUrl: "" },
  };
}

export function loadProfilePresets(userId, username = "") {
  const fallback = createProfiles(username);
  if (!userId) return fallback;

  try {
    const saved = JSON.parse(localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`));
    if (!saved?.profiles) return fallback;

    return {
      trainee: { ...fallback.trainee, ...saved.profiles.trainee },
      trainer: { ...fallback.trainer, ...saved.profiles.trainer },
      npc: { ...fallback.npc, ...saved.profiles.npc },
    };
  } catch {
    return fallback;
  }
}

export function saveProfilePresets(userId, profiles) {
  if (!userId) return;
  localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${userId}`, JSON.stringify({ profiles }));
}

export function loadActiveProfileType(userId) {
  const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}:active`);
  return PROFILE_TYPES[stored] ? stored : "trainee";
}

export function saveActiveProfileType(userId, type) {
  if (userId && PROFILE_TYPES[type]) {
    localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${userId}:active`, type);
  }
}
