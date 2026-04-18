const params = new URLSearchParams(window.location.search);

export type Theme = (typeof validThemes)[number];
const validThemes = ["default", "simple", "emote_dark"] as const;
const themeValue = (params.get("theme") || "default") as Theme;
export const theme = validThemes.includes(themeValue) ? themeValue : "default";

export function parseChannelFromURL() {
  const [, chunk] = window.location.pathname.split("/");
  if (!chunk) {
    return null;
  }

  const [channelID, channelLogin] = chunk.split("-");
  if (!(channelID && channelLogin)) {
    return null;
  }

  return [channelID, channelLogin] as const;
}


export const fadeout= resolveFadeout();
function resolveFadeout() {
  const raw = params.get("fadeout");
  if (raw === "off" || raw === "none") {
    return null;
  }

  if (!raw) {
    return "15s";
  }

  const value = parseInt(raw);
  if (isNaN(value) || value < 0) {
    return "15s";
  }

  return `${value}s`;
}



export function isEmoteOnly() {
  return theme === "emote_dark";
}

/**
 * When true, fetch and display 7TV namepaints for chatters.
 * Primary: `?paints=1`. Legacy alias: `?seventv_paints=1`.
 */
export const seventvPaints = resolveBoolParam("paints", "seventv_paints");

/** When false (`?bots=0`), messages from users with the Twitch bot badge are hidden. Defaults to true. */
export const hideBots = (() => {
  const raw = params.get("bots");
  if (raw === null) return false;
  const v = raw.toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
})();

/**
 * When true (the default), connect to both the BTTV WebSocket and 7TV SSE for live
 * channel emote updates. Set `?live=0` to opt out of all live connections.
 */
export const liveUpdates = (() => {
  const raw = params.get("live");
  if (raw === null) return true;
  const v = raw.toLowerCase();
  return !(v === "0" || v === "false" || v === "off" || v === "no");
})();

/** When false, mod/broadcaster message gradient highlights and role icons are hidden. Defaults to true. */
export const highlightMods = (() => {
  const raw = params.get("highlight_mods");
  if (raw === null) return true;
  const v = raw.toLowerCase();
  return !(v === "0" || v === "false" || v === "off" || v === "no");
})();

/** When false, broadcaster/moderator chat commands (!reloadchat, !reloadws, etc.) are disabled. Defaults to true. */
export const chatCommands = (() => {
  const raw = params.get("commands");
  if (raw === null) return true;
  const v = raw.toLowerCase();
  return !(v === "0" || v === "false" || v === "off" || v === "no");
})();
function resolveBoolParam(...keys: string[]) {
  for (const key of keys) {
    const raw = params.get(key);
    if (raw !== null) {
      const v = raw.toLowerCase();
      return v === "1" || v === "true" || v === "yes" || v === "on";
    }
  }
  return false;
}

