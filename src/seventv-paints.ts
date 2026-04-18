/**
 * 7TV namepaint support.
 *
 * Paints are fetched lazily per unique chatter (two requests: one REST to get the 7TV
 * user ObjectID, one GQL to get the full paint definition). Results are cached for the
 * session so each chatter is only ever fetched once regardless of how many messages
 * they send.
 */

export type PaintStyle = {
  /** CSS value for `background-image` (gradient or url()). */
  backgroundImage: string;
  /** CSS `filter` value for drop-shadows, or null when the paint has no shadows. */
  dropShadow: string | null;
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

// ─── GQL query ───────────────────────────────────────────────────────────────

const GQL_QUERY = `
  query GetUserPaint($id: ObjectID!) {
    user(id: $id) {
      style {
        paint {
          id name function color angle shape image_url repeat
          stops { at color }
          shadows { x_offset y_offset radius color }
        }
      }
    }
  }
`;

async function fetchPaintBySeventvId(seventvId: string): Promise<PaintStyle | null> {
  const resp = await fetch("https://7tv.io/v3/gql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GQL_QUERY, variables: { id: seventvId } }),
  });

  if (!resp.ok) return null;

  const json = await resp.json();
  const paint: SeventvPaintData | undefined = json?.data?.user?.style?.paint;
  if (!paint) return null;

  return computePaintStyle(paint);
}

// ─── Cache & public API ───────────────────────────────────────────────────────

/**
 * Map from Twitch user ID → a settled Promise that resolves to PaintStyle or null.
 * Caching the Promise (not just the result) ensures simultaneous first-messages from
 * the same user share a single in-flight fetch rather than spawning duplicates.
 */
const cache = new Map<string, Promise<PaintStyle | null>>();

/**
 * Fetch and cache the 7TV namepaint for a given Twitch user ID.
 * Returns `null` if the user has no 7TV account, no paint, or if any request fails.
 */
export function fetchPaint(twitchUserId: string): Promise<PaintStyle | null> {
  const existing = cache.get(twitchUserId);
  if (existing) return existing;

  const promise = (async (): Promise<PaintStyle | null> => {
    try {
      const resp = await fetch(`https://7tv.io/v3/users/twitch/${encodeURIComponent(twitchUserId)}`);
      if (!resp.ok) return null;

      const data = await resp.json();
      const seventvId: string | undefined = data?.user?.id;
      const paintId: string | undefined = data?.user?.style?.paint_id;

      // Skip the GQL call entirely if the user has no paint assigned.
      if (!seventvId || !paintId) return null;

      return await fetchPaintBySeventvId(seventvId);
    } catch {
      return null;
    }
  })();

  cache.set(twitchUserId, promise);
  return promise;
}
