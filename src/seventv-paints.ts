/**
 * 7TV namepaint + badge support.
 *
 * Cosmetics are fetched lazily per unique chatter (one REST call to get the 7TV user
 * ObjectID + active cosmetic IDs, then one GQL call to resolve the full definitions).
 * Results are cached for the session so each chatter is only ever fetched once.
 */

export type PaintStyle = {
  /** CSS value for `background-image` (gradient or url()). */
  backgroundImage: string;
  /** CSS `filter` value for drop-shadows, or null when the paint has no shadows. */
  dropShadow: string | null;
};

export type SeventvBadge = {
  url: string;
  alt: string;
};

export type SeventvCosmetics = {
  paint: PaintStyle | null;
  badge: SeventvBadge | null;
};

// ─── ARGB helpers ────────────────────────────────────────────────────────────

/** Convert a signed 32-bit ARGB int (as returned by 7TV) to `rgba(r, g, b, a)`. */
function argbToRgba(color: number): string {
  const u = color >>> 0; // treat as unsigned
  const r = (u >> 24) & 0xff;
  const g = (u >> 16) & 0xff;
  const b = (u >> 8) & 0xff;
  const a = (u & 0xff) / 255;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

// ─── Paint CSS computation ────────────────────────────────────────────────────

type Stop = { at: number; color: number };
type Shadow = { x_offset: number; y_offset: number; radius: number; color: number };

type SeventvPaintData = {
  id: string;
  name: string;
  function?: string;
  color?: number | null;
  angle?: number;
  shape?: string;
  image_url?: string | null;
  repeat?: boolean;
  stops?: Stop[];
  shadows?: Shadow[];
};

function computePaintStyle(paint: SeventvPaintData): PaintStyle {
  let backgroundImage: string;

  const hasStops = (paint.stops?.length ?? 0) > 0;
  if (hasStops && paint.function) {
    const baseFunction = paint.repeat ? `repeating-${paint.function}` : paint.function;
    const gradientFunction = baseFunction.toLowerCase().replace(/_/g, "-");
    const isLinear = gradientFunction.includes("linear");

    const stops = (paint.stops ?? [])
      .map((s) => `${argbToRgba(s.color)} ${(s.at * 100).toFixed(1)}%`)
      .join(", ");

    const direction = isLinear ? `${paint.angle ?? 0}deg` : (paint.shape ?? "circle");
    backgroundImage = `${gradientFunction}(${direction}, ${stops})`;
  } else if (paint.image_url) {
    backgroundImage = `url('${paint.image_url}')`;
  } else if (paint.color != null) {
    backgroundImage = `linear-gradient(${argbToRgba(paint.color)}, ${argbToRgba(paint.color)})`;
  } else {
    backgroundImage = "";
  }

  let dropShadow: string | null = null;
  if (paint.shadows?.length) {
    dropShadow = paint.shadows
      .map((s) => `drop-shadow(${argbToRgba(s.color)} ${s.x_offset}px ${s.y_offset}px ${s.radius}px)`)
      .join(" ");
  }

  return { backgroundImage, dropShadow };
}

// ─── Badge URL helpers ────────────────────────────────────────────────────────

type SeventvBadgeData = {
  name?: string;
  tooltip?: string;
  host?: {
    url: string;
    files?: readonly { name: string; format: string }[];
  };
};

function resolveBadge(data: SeventvBadgeData): SeventvBadge | null {
  const files = data.host?.files;
  const file =
    files?.find((f) => f.name.startsWith("1x") && f.format === "WEBP") ??
    files?.find((f) => f.format === "WEBP") ??
    files?.[0];
  if (!file || !data.host?.url) return null;
  return {
    url: `https:${data.host.url}/${file.name}`,
    alt: data.tooltip || data.name || "7TV Badge",
  };
}

// ─── GQL query ───────────────────────────────────────────────────────────────

const GQL_QUERY = `
  query GetUserCosmetics($id: ObjectID!) {
    user(id: $id) {
      style {
        paint {
          id name function color angle shape image_url repeat
          stops { at color }
          shadows { x_offset y_offset radius color }
        }
        badge {
          id name tooltip
          host { url files { name format } }
        }
      }
    }
  }
`;

async function fetchCosmeticsBySeventvId(seventvId: string): Promise<SeventvCosmetics> {
  const resp = await fetch("https://7tv.io/v3/gql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GQL_QUERY, variables: { id: seventvId } }),
  });

  if (!resp.ok) return { paint: null, badge: null };

  const json = await resp.json();
  const style = json?.data?.user?.style;

  const paint: SeventvPaintData | undefined = style?.paint;
  const badgeData: SeventvBadgeData | undefined = style?.badge;

  return {
    paint: paint ? computePaintStyle(paint) : null,
    badge: badgeData ? resolveBadge(badgeData) : null,
  };
}

// ─── Cache & public API ───────────────────────────────────────────────────────

/**
 * Map from Twitch user ID → a settled Promise<SeventvCosmetics>.
 * Caching the Promise ensures simultaneous first-messages share a single in-flight fetch.
 */
const cache = new Map<string, Promise<SeventvCosmetics>>();

/**
 * Fetch and cache the 7TV cosmetics (paint + badge) for a given Twitch user ID.
 * Both fields are null if the user has no 7TV account or no cosmetics assigned.
 */
export function fetchSeventvCosmetics(twitchUserId: string): Promise<SeventvCosmetics> {
  const existing = cache.get(twitchUserId);
  if (existing) return existing;

  const promise = (async (): Promise<SeventvCosmetics> => {
    try {
      const resp = await fetch(`https://7tv.io/v3/users/twitch/${encodeURIComponent(twitchUserId)}`);
      if (!resp.ok) return { paint: null, badge: null };

      const data = await resp.json();
      const seventvId: string | undefined = data?.user?.id;
      const paintId: string | undefined = data?.user?.style?.paint_id;
      const badgeId: string | undefined = data?.user?.style?.badge_id;

      // No 7TV account, or no cosmetics assigned at all — skip the GQL call.
      if (!seventvId || (!paintId && !badgeId)) return { paint: null, badge: null };

      return await fetchCosmeticsBySeventvId(seventvId);
    } catch {
      return { paint: null, badge: null };
    }
  })();

  cache.set(twitchUserId, promise);
  return promise;
}

/** @deprecated Use fetchSeventvCosmetics and read `.paint` instead. */
export function fetchPaint(twitchUserId: string): Promise<PaintStyle | null> {
  return fetchSeventvCosmetics(twitchUserId).then((c) => c.paint);
}
