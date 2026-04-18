# twitch-chat-widget-v2

A rewrite of [twitch-chat-widget](https://github.com/aidenwallis/twitch-chat-widget), built with [Lit](https://lit.dev) Web Components. Lighter and faster than the original React version, with third-party emote and badge support.

Messages are held back for `1000ms` and suppressed if a moderator deletes them in that window, preventing chat from jumping on bot deletions.

## Usage

Access the hosted version via the [Cloudflare Pages](https://pages.cloudflare.com) deployment:

```
https://twitch-chat-widget.nateb.ca/<twitch_id>-<twitch_username>
```

For example, `aca30doesgames` has a Twitch user ID of `115356177`:

```
https://twitch-chat-widget.nateb.ca/115356177-aca30doesgames
```

## Query Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `theme` | `default`, `simple`, `emote_dark` | `default` | Visual theme |
| `fadeout` | seconds, `off` | `15` | Seconds before messages fade out (`off` disables) |
| `seventv_live` | `1` | off | Subscribe to live 7TV emote-set updates via SSE |
| `seventv_paints` | `1` | off | Fetch and render 7TV namepaints on chatter names |

**Examples:**

```
# Simple theme, fade out after 10 seconds
https://twitch-chat-widget.nateb.ca/115356177-aca30doesgames?theme=simple&fadeout=10

# Default theme, no fade, live 7TV emote updates, namepaints
https://twitch-chat-widget.nateb.ca/115356177-aca30doesgames?fadeout=off&seventv_live=1&seventv_paints=1
```

## Supported Services

| Service | Features |
|---------|----------|
| <img src="https://assets.twitch.tv/assets/favicon-32-e29e246c157142c94346.png" width="20" /> **[Twitch](https://www.twitch.tv/)** | **Emotes:** Global, Channel, Sub, Bits<br>**Badges:** Global, Channel (Sub, Bits)<br>**Moderation:** Delete Messages, Timeouts, Bans, Chat Clears |
| <img src="https://7tv.app/favicon.svg" width="20" /> **[7TV](https://7tv.app/)** | **Emotes:** Global, Channel, Zero-Width<br>**Live Updates:** Channel emote set via SSE (`?seventv_live=1`)<br>**User Customization:** Namepaints (`?seventv_paints=1`) |
| <img src="https://betterttv.com/favicon.png" width="20" /> **[BTTV](https://betterttv.com/)** | **Emotes:** Global, Channel |
| <img src="https://www.frankerfacez.com/static/images/favicon-32.png" width="20" /> **[FFZ](https://www.frankerfacez.com/)** | **Emotes:** Global, Channel |

## TODO

Feature ideas not yet implemented:

- **7TV personal/special emote sets** — sets assigned to individual chatters rather than the channel
- **7TV badges** — cosmetic badges granted to 7TV subscribers/staff
- **BTTV live emote-set updates** — equivalent of the existing `?seventv_live` feature for BTTV channel emotes
- **FFZ badges** — global and channel-level FFZ badge support
