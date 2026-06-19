export function playCheckSound() {
  const audio = new Audio('/sounds/check.ogg');
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

export function playUncheckSound() {
  const audio = new Audio('/sounds/uncheck.ogg');
  audio.volume = 0.5;
  audio.play().catch(() => {});
}
