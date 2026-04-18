import { isEmoteOnly } from "./url";

export type Emote = {
  id: string;
  url: string;
  /** 7TV only: emote has zero-width flag (overlays previous emote). */
  zeroWidth?: boolean;
};

/** 7TV `Emote.flags` — overlay on previous emote when set. */
export const SEVENTV_EMOTE_FLAG_ZERO_WIDTH = 1 << 8;

function normalizeEmoteFlags(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function isSeventvZeroWidth(emote: Pick<SeventvEmote, "flags" | "data">) {
  const flags =
    normalizeEmoteFlags(emote.flags) | normalizeEmoteFlags(emote.data?.flags);
  return (flags & SEVENTV_EMOTE_FLAG_ZERO_WIDTH) !== 0;
}

export class ExternalStore<ExternalResponse, InternalModel> {
  private store: Record<string, InternalModel> = {};

  constructor(
    private urlFunc: (channelID: string) => string,
    private mapFunc: (body: ExternalResponse) => Record<string, InternalModel>,
  ) {}

  load(channelID: string) {
    this.store = {};

    return fetch(this.urlFunc(channelID))
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`invalid response received: ${resp?.status ?? "unknown"}`);
        }
        return resp.json() as ExternalResponse;
      })
      .then((body) => {
        body && (this.store = this.mapFunc(body) || {});
      });
  }

  get(code: string) {
    return this.store[code] || null;
  }

  set(name: string, value: InternalModel) {
    this.store[name] = value;
  }

  delete(name: string) {
    delete this.store[name];
  }

  /** Delete all entries where the predicate returns true. Used for ID-based removal when the key is a code/name. */
  deleteWhere(pred: (value: InternalModel, key: string) => boolean) {
    for (const key of Object.keys(this.store)) {
      if (pred(this.store[key]!, key)) {
        delete this.store[key];
      }
    }
  }
}

type BttvEmote = { id: string; code: string };
export function bttvURL(id: string) {
  return `https://cdn.betterttv.net/emote/${encodeURIComponent(id)}/${isEmoteOnly() ? "3" : "1"}x`;
}

const bttvGlobal = new ExternalStore<readonly BttvEmote[], Emote>(
  () => "https://api.betterttv.net/3/cached/emotes/global",
  (body) =>
    body.reduce((acc, cur) => {
      acc[cur.code] = { id: cur.id, url: bttvURL(cur.id) };
      return acc;
    }, {} as Record<string, Emote>),
);

export const bttvUser = new ExternalStore<{ channelEmotes: readonly BttvEmote[]; sharedEmotes: readonly BttvEmote[] }, Emote>(
  (id: string) => `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(id)}`,
  (body) =>
    [...body.channelEmotes, ...body.sharedEmotes].reduce((acc, cur) => {
      acc[cur.code] = { id: cur.id, url: bttvURL(cur.id) };
      return acc;
    }, {} as Record<string, Emote>),
);

export type SeventvEmote = {
  id: string;
  name: string;
  flags?: number;
  data: {
    flags?: number;
    host: {
      url: string;
      files: readonly {
        name: string;
        width: number;
        height: number;
        format: "WEBP" | "AVIF"; // i don't know
      }[];
    };
  };
};

// they give us a shit ton of metadata... they can't just tell us the emote or use a consistent format... *cries*
export function resolveRelevant7tvURL(host: SeventvEmote["data"]["host"]) {
  let selected = host.files[0];

  for (const file of host.files) {
    if (file.format !== "WEBP") {
      // prefer a single format... please, jesus christ
      continue;
    }

    if (selected.format !== "WEBP") {
      selected = file; // replace with a webp
      continue;
    }

    const isEligableForReplacement = isEmoteOnly()
      ? file.width > selected.width || file.height > selected.height
      : file.width < selected.width || file.height < selected.height;
    if (isEligableForReplacement) {
      // try to select the best sized emote. having size enums would be too convenient so we have to guess instead.
      selected = file;
    }
  }

  return host.url + "/" + selected.name;
}

const seventvGlobal = new ExternalStore<{ emotes: readonly SeventvEmote[] }, Emote>(
  () => "https://7tv.io/v3/emote-sets/global",
  (body) =>
    body?.emotes?.reduce((acc, cur) => {
      acc[cur.name] = {
        id: cur.id,
        url: resolveRelevant7tvURL(cur.data.host),
        zeroWidth: isSeventvZeroWidth(cur),
      };
      return acc;
    }, {} as Record<string, Emote>),
);

let seventvUserEmoteSetID: string | undefined;

export const seventvUser = new ExternalStore<
  { emote_set: { id: string; emotes: readonly SeventvEmote[] } },
  Emote
>(
  (channelID: string) => `https://7tv.io/v3/users/twitch/${encodeURIComponent(channelID)}`,
  (body) => {
    seventvUserEmoteSetID = body?.emote_set?.id;
    return (
      body?.emote_set?.emotes?.reduce((acc, cur) => {
        acc[cur.name] = {
          id: cur.id,
          url: resolveRelevant7tvURL(cur.data.host),
          zeroWidth: isSeventvZeroWidth(cur),
        };
        return acc;
      }, {} as Record<string, Emote>) ?? {}
    );
  },
);

export function getSeventvUserEmoteSetID() {
  return seventvUserEmoteSetID;
}

type FfzEmote = { id: number; name: string; urls: Record<string, string> };
const findFfzURL = (urls: Record<string, string>) => {
  const keys = Object.keys(urls).sort();
  return urls[keys[isEmoteOnly() ? keys.length - 1 : 0]];
};

const ffzGlobal = new ExternalStore<
  {
    default_sets: readonly number[];
    sets: Record<string, { emoticons: readonly FfzEmote[] }>;
  },
  Emote
>(
  () => "https://api.frankerfacez.com/v1/set/global",
  (body) => {
    const out: Record<string, Emote> = {};
    for (const setID of body?.default_sets) {
      const set = body?.sets[setID.toString()];
      if (!set) continue;

      for (const emote of set?.emoticons) {
        out[emote.name] = { id: emote.id.toString(), url: findFfzURL(emote.urls) };
      }
    }

    return out;
  },
);

const ffzUser = new ExternalStore<
  { room: { set: number }; sets: Record<string, { emoticons: readonly FfzEmote[] }> },
  Emote
>(
  (channelID: string) => `https://api.frankerfacez.com/v1/room/id/${encodeURIComponent(channelID)}`,
  (body) =>
    body?.sets[body?.room?.set?.toString() || ""]?.emoticons?.reduce((acc, cur) => {
      acc[cur.name] = { id: cur.id.toString(), url: findFfzURL(cur.urls) };
      return acc;
    }, {} as Record<string, Emote>),
);

export type Badge = Record<string, { alt: string; url: string }>;
type FossaAsset = { alt: string; url: string };

function parseFossaBadges(body: {
  data: readonly {
    id: string;
    versions: readonly {
      id: string;
      asset_1x?: FossaAsset;
      asset_2x?: FossaAsset;
      asset_4x?: FossaAsset;
    }[];
  }[];
}) {
  const out: Record<string, Badge> = {};
  for (const badge of body?.data) {
    const versions: Badge = {};
    for (const version of badge?.versions) {
      const asset = version?.asset_1x || version?.asset_2x || version?.asset_4x;
      if (!asset) continue;
      versions[version.id] = asset;
    }

    out[badge.id] = versions;
  }
  return out;
}

const globalBadges = new ExternalStore(
  () => "https://api.fossabot.com/v2/cached/twitch/badges/global",
  parseFossaBadges,
);

const userBadges = new ExternalStore(
  (channelID: string) => `https://api.fossabot.com/v2/cached/twitch/badges/users/${encodeURIComponent(channelID)}`,
  parseFossaBadges,
);

export function lookupBadge(id: string, version: string) {
  const userBadge = userBadges.get(id);
  if (userBadge && userBadge[version]) {
    return userBadge[version];
  }

  const globalBadge = globalBadges.get(id);
  if (globalBadge && globalBadge[version]) {
    return globalBadge[version];
  }

  return null;
}

/** Channel user sets first, then globals — provider order: 7TV, BTTV, FFZ. */
export function lookupEmote(code: string) {
  return (
    seventvUser.get(code) ??
    bttvUser.get(code) ??
    ffzUser.get(code) ??
    seventvGlobal.get(code) ??
    bttvGlobal.get(code) ??
    ffzGlobal.get(code) ??
    null
  );
}

export function loadData(channelID: string) {
  return Promise.all([
    globalBadges.load(channelID),
    userBadges.load(channelID),
    bttvGlobal.load(channelID),
    bttvUser.load(channelID),
    ffzGlobal.load(channelID),
    ffzUser.load(channelID),
    seventvGlobal.load(channelID),
    seventvUser.load(channelID),
  ]).catch((error) => console.error(`Failed to load emote stores: ${error}`));
}
