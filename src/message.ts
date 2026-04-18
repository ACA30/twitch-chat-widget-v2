import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { ColorCorrection } from "./color-correction";
import { lookupBadge, lookupFfzBadges } from "./external-data";
import { Fragment } from "./fragment";
import { PaintStyle, SeventvBadge, fetchSeventvCosmetics } from "./seventv-paints";
import { FragmentedChatMessage } from "./twitch-connection";
import { Theme, isEmoteOnly, theme, fadeout, seventvPaints, highlightMods } from "./url";

const colorCorrection = new ColorCorrection();

const themes: Record<Theme, ReturnType<typeof css>> = {
  simple: css`
    :host {
      font-family: Fredoka, Inter, sans-serif;
    }

    .content {
      text-shadow: 0 0 2px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000;
      font-weight: 500;
    }
  `,
  default: css`
    .message {
      background-color: #1b1d20;
      padding: 10px 7px;
      border-radius: 4px;
      font-size: 16px;
      animation: message-enter 0.15s ease;
    }

    .message-mod {
      background: linear-gradient(to right, transparent 67%, rgba(74, 222, 128, 0.18) 100%), #1b1d20;
    }

    .message-broadcaster {
      background: linear-gradient(to right, transparent 67%, rgba(248, 113, 113, 0.18) 100%), #1b1d20;
    }

    @keyframes message-enter {
      from {
        transform: translateY(10px);
        opacity: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0px);
      }
    }
  `,
  emote_dark: css`
    .emote {
      height: 30rem;
    }

    .emote-content {
      display: block;
      text-align: center;
      padding: 3rem 0;
    }
  `,
};

@customElement("app-message")
export class MessageElement extends LitElement {
  @property()
  message?: FragmentedChatMessage;

  @property({ type: Boolean })
  commandAck = false;

  @state()
  private paint: PaintStyle | null = null;

  @state()
  private seventvBadge: SeventvBadge | null = null;

  static styles = [
    css`
      :host {
        font-family: Inter, sans-serif;
      }

      .container {
        padding-bottom: 5px;
      }

      .content {
        color: #fff;
      }

      .message {
        font-family: 16px;
        word-wrap: break-word;
        line-height: 1.5;
        vertical-align: middle;
      }

      .emote {
        margin-bottom: -7px;
        display: inline;
      }

      .emote-stack {
        display: inline-block;
        position: relative;
        vertical-align: middle;
        line-height: 0;
        margin-bottom: -7px;
      }

      .emote-stack .emote-base {
        display: block;
        margin-bottom: 0;
      }

      .emote-stack .emote-overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        margin-bottom: 0;
      }

      .badges {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        vertical-align: middle;
        margin-right: 1px;
      }

      .badge {
        display: block;
        flex-shrink: 0;
      }

      .message {
        position: relative;
      }

      .name {
        font-weight: 500;
        padding-right: 3px;
      }

      .name-painted {
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }

      @keyframes fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      @keyframes cmd-ack {
        from { opacity: 0; transform: translateY(-50%) scale(0.6); }
        to   { opacity: 0.45; transform: translateY(-50%) scale(1); }
      }

      .cmd-ack {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        animation: cmd-ack 0.2s ease forwards;
        opacity: 0;
        line-height: 1;
      }

      .message.message-has-icon {
        padding-right: 28px;
      }

      .message-has-icon .cmd-ack {
        right: 26px;
      }

      .mod-sword {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.5;
        color: #4ade80;
        line-height: 1;
      }

      .broadcaster-crown {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.5;
        color: #f87171;
        line-height: 1;
      }
    `,
    themes[theme],
  ];

  connectedCallback() {
    super.connectedCallback();
    if (this.message?.sender.id) {
      fetchSeventvCosmetics(this.message.sender.id).then((c) => {
        this.seventvBadge = c.badge;
        if (seventvPaints) this.paint = c.paint;
      });
    }
  }

  render() {
    if (!this.message) {
      return null;
    }

    if (isEmoteOnly()) {
      const firstEmote = this.message.content.fragments.find((f) => f.type === "image");
      if (!firstEmote) return null;
      return html`<div class="emote-content">${renderFragment(firstEmote)}</div> `;
    }

    const fadeoutAnimation = fadeout ? `fade-out 0.15s ease ${fadeout} forwards` : "none";
    const isMod = highlightMods && this.message.sender.mod;
    const isBroadcaster = highlightMods && this.message.sender.broadcaster;

    return html`
      <div class="container" style="animation: ${fadeoutAnimation};">
        <div class="${classMap({ message: true, "message-mod": isMod, "message-broadcaster": isBroadcaster, "message-has-icon": isMod || isBroadcaster })}">
          <span class="badges">
            ${map(this.message.sender.badges, (badge) => {
              const version = lookupBadge(badge.id, badge.version);
              if (!version) return null;
              return html`<img src="${version.url}" alt="${version.alt}" class="badge" />`;
            })}
            ${this.seventvBadge
              ? html`<img src="${this.seventvBadge.url}" alt="${this.seventvBadge.alt}" title="${this.seventvBadge.alt}" class="badge" />`
              : null}
            ${map(lookupFfzBadges(this.message.sender.login), (badge) =>
              html`<img src="${badge.url}" alt="${badge.alt}" title="${badge.alt}" class="badge" />`,
            )}
          </span>
          <span
            class="${classMap({ name: true, "name-painted": !!this.paint?.backgroundImage })}"
            style="${styleMap(resolveNameStyle(this.message.sender, this.paint))}"
            >${renderName(this.message.sender)}:</span
          >
          <span class="${classMap({ content: true, italic: this.message.content.action })}"
            >${map(this.message.content.fragments, renderFragment)}</span
          >
          ${isMod
            ? html`<span class="mod-sword" aria-label="Moderator" title="Moderator">
                <svg width="12" height="12" viewBox="0 0 512.001 512.001" fill="currentColor" aria-hidden="true" role="presentation">
                  <path d="M237.737,359.117l-84.853-84.853c-17.546-17.546-46.093-17.546-63.639,0c-5.857,5.857-5.857,15.356,0,21.213l127.279,127.279c5.857,5.858,15.356,5.858,21.213,0C255.284,405.21,255.284,376.663,237.737,359.117z"/>
                  <rect x="80.466" y="371.548" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -251.5829 195.7215)" width="59.999" height="59.999"/>
                  <path d="M89.248,465.187l-42.432-42.432C29.573,405.51,0.006,417.76,0,442.147v24.859c0,12.409,5.044,23.647,13.196,31.799c8.152,8.152,19.39,13.196,31.799,13.196h24.859C94.233,511.997,106.487,482.425,89.248,465.187z"/>
                  <path d="M494.9,0.135L346.408,21.349c-3.719,0.528-7.106,2.444-9.488,5.345L160.255,239.209l45.662,45.662l137.886-137.886c5.863-5.863,15.351-5.863,21.213,0c5.862,5.863,5.863,15.351,0,21.213L227.13,306.084l45.662,45.662l212.515-176.664c2.9-2.382,4.816-5.77,5.345-9.488l21.213-148.493C513.213,7.758,504.242-1.212,494.9,0.135z"/>
                </svg>
              </span>`
            : null}
          ${isBroadcaster
            ? html`<span class="broadcaster-crown" aria-label="Broadcaster" title="Broadcaster">
                <svg width="12" height="12" viewBox="0 0 467.968 467.968" fill="currentColor" aria-hidden="true" role="presentation">
                  <path d="M264.704,96.512H51.2c-28.16,0-51.2,23.04-51.2,51.2v172.544c0,28.16,23.04,51.2,51.2,51.2h213.504c28.16,0,51.2-23.04,51.2-51.2V147.712C315.904,119.04,292.864,96.512,264.704,96.512z"/>
                  <path d="M430.08,124.672c-3.072,0.512-6.144,2.048-8.704,3.584l-79.872,46.08V293.12l80.384,46.08c14.848,8.704,33.28,3.584,41.984-11.264c2.56-4.608,4.096-9.728,4.096-15.36V154.368C467.968,135.424,450.048,120.064,430.08,124.672z"/>
                </svg>
              </span>`
            : null}
          ${this.commandAck
            ? html`<span class="cmd-ack" aria-hidden="true">
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>`
            : null}
        </div>
      </div>
    `;
  }
}

function renderFragment(fragment: Fragment) {
  switch (fragment.type) {
    case "text": {
      return fragment.text;
    }

    case "image": {
      const overlays = fragment.overlayImages;
      if (overlays?.length) {
        return html`<span class="emote-stack">
          <img src="${fragment.image}" alt="${fragment.text}" class="emote emote-base" />
          ${overlays.map(
            (src) => html`<img src="${src}" alt="" class="emote emote-overlay" aria-hidden="true" />`,
          )}
        </span>`;
      }

      return html`<img src="${fragment.image}" alt="${fragment.text}" class="emote" />`;
    }
  }
}

function renderName(sender: FragmentedChatMessage["sender"]) {
  return sender.displayName.toLowerCase() === sender.login.toLowerCase()
    ? sender.displayName
    : `${sender.displayName} (${sender.login})`;
}

function resolveNameColor(sender: FragmentedChatMessage["sender"]) {
  return sender.color || "#aaa";
}

function resolveNameStyle(
  sender: FragmentedChatMessage["sender"],
  paint: PaintStyle | null,
): Record<string, string> {
  if (paint?.backgroundImage) {
    return {
      backgroundImage: paint.backgroundImage,
      ...(paint.dropShadow ? { filter: paint.dropShadow } : {}),
    };
  }

  return { color: colorCorrection.calculate(resolveNameColor(sender)) };
}

declare global {
  interface HTMLElementTagNameMap {
    "app-message": MessageElement;
  }
}
