import openSound from "../assets/sounds/click.mp3";
import closeSound from "../assets/sounds/close.mp3";
import clickSound from "../assets/sounds/click.mp3";
import saveSound from "../assets/sounds/click.mp3";

const sounds = {
  open: new Audio(openSound),
  close: new Audio(closeSound),
  click: new Audio(clickSound),
  save: new Audio(saveSound),
};

let enabled = true;
let volume = 0.5;

export function playSound(name) {
  if (!enabled) return;

  const sound = sounds[name];
  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;
  sound.volume = volume;
  sound.play().catch(() => {});
}

export function setSoundEnabled(value) {
  enabled = value;
}

export function toggleSound() {
  enabled = !enabled;
  return enabled;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundVolume(value) {
  volume = Math.max(0, Math.min(1, value));
}