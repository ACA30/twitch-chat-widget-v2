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
| `paints` | `1` | off | Fetch and render 7TV namepaints on chatter names |
| `bots` | `0` | on | Set to `0` to hide messages from users with the Twitch bot badge |
| `live` | `0` | on | Disable live emote-set connections (BTTV WebSocket + 7TV SSE) |
| `commands` | `0` | on | Disable broadcaster/mod chat commands (`!reloadchat`, etc.) |
| `highlight_mods` | `0` | on | Disable gradient highlight and icon on mod/broadcaster messages |

**Examples:**

```
# Simple theme, fade out after 10 seconds
https://twitch-chat-widget.nateb.ca/115356177-aca30doesgames?theme=simple&fadeout=10

# No fade, namepaints enabled, bots hidden
https://twitch-chat-widget.nateb.ca/115356177-aca30doesgames?fadeout=off&paints=1&bots=0
```

## Chat Commands

The broadcaster and moderators can send the following commands in chat to control the overlay. A subtle checkmark appears on the command message when it is acknowledged. Commands can be disabled with `?commands=0`.

| Command | Description |
|---------|-------------|
| `!reloadchat` | Reloads the overlay page |
| `!reloadws` | Re-fetches all emote/badge data and reconnects the 7TV EventSource |
| `!reconnectchat` | Reconnects the Twitch IRC WebSocket |

## Supported Services

| Service | Features |
|---------|----------|
| <img src="https://assets.twitch.tv/assets/favicon-32-e29e246c157142c94346.png" width="20" /> **[Twitch](https://www.twitch.tv/)** | **Emotes:** Global, Channel, Sub, Bits<br>**Badges:** Global, Channel (Sub, Bits)<br>**Moderation:** Delete Messages, Timeouts, Bans, Chat Clears |
| <img src="https://7tv.app/favicon.svg" width="20" /> **[7TV](https://7tv.app/)** | **Emotes:** Global, Channel, Zero-Width<br>**Live Updates:** Channel emote set via SSE (on by default, `?live=0` to disable)<br>**Badges:** Global subscriber/staff badges<br>**User Customization:** Namepaints (`?seventv_paints=1`) |
| <img src="https://betterttv.com/favicon.png" width="20" /> **[BTTV](https://betterttv.com/)** | **Emotes:** Global, Channel<br>**Live Updates:** Channel emote set via WebSocket (on by default, `?live=0` to disable) |
| <img src="https://www.frankerfacez.com/static/images/favicon-32.png" width="20" /> **[FFZ](https://www.frankerfacez.com/)** | **Emotes:** Global, Channel<br>**Badges:** Global FFZ badges |

## TODO

Feature ideas not yet implemented:

- **7TV personal/special emote sets** — sets assigned to individual chatters rather than the channel
- **7TV personal/special emote sets** — sets assigned to individual chatters rather than the channel
