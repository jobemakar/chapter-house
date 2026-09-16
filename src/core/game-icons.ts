/** Shared icon vocabulary for current and future integrated game chrome. */
export class GameIcons {
  static markup(
    name: "sound" | "muted" | "fullscreen" | "help" | "pause" | "play",
  ) {
    const paths = {
      sound: "M3 9h4l5-5v16l-5-5H3z M16 8c3 2 3 6 0 8 M19 5c5 4 5 10 0 14",
      muted: "M3 9h4l5-5v16l-5-5H3z M16 9l6 6 M22 9l-6 6",
      fullscreen: "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5",
      help: "M9 8a3 3 0 116 0c0 2-3 2-3 5 M12 17v.2 M21 12a9 9 0 11-18 0 9 9 0 0118 0",
      pause: "M8 5v14 M16 5v14",
      play: "M7 4l13 8-13 8z",
    };
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
  }
}
