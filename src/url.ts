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

/** When true, fetch and display 7TV namepaints for chatters (one REST + one GQL call per unique chatter, cached). */
export const seventvPaints = resolveBoolParam("seventv_paints");

/** When true, messages from users with the Twitch bot badge (bot-badge/1) are hidden. */
export const hideBots = (() => {
  const raw = params.get("bots");
  if (raw === null) return false;
  const v = raw.toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
})();

/** When true, subscribe to 7TV emote-set SSE for live emote add/remove updates (extra connection + traffic). */
export const seventvLiveUpdates = resolveSeventvLiveUpdates();

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

function resolveSeventvLiveUpdates() {
  return resolveBoolParam("seventv_live", "7tv_live");
}
