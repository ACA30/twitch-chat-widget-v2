import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { ColorCorrection } from "./color-correction";
import { lookupBadge } from "./external-data";
import { Fragment } from "./fragment";
import { PaintStyle, fetchPaint } from "./seventv-paints";
import { FragmentedChatMessage } from "./twitch-connection";
import { Theme, isEmoteOnly, theme, fadeout, seventvPaints } from "./url";

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
        display: inline;
      }

      .badge {
        margin-right: 2px;
        display: inline-block;
        margin-bottom: -4px;
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
    `,
    themes[theme],
  ];

  connectedCallback() {
    super.connectedCallback();
    if (seventvPaints && this.message?.sender.id) {
      fetchPaint(this.message.sender.id).then((p) => {
        this.paint = p;
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

    return html`
      <div class="container" style="animation: ${fadeoutAnimation};">
        <div class="message">
          <span class="badges">
            ${map(this.message.sender.badges, (badge) => {
              const version = lookupBadge(badge.id, badge.version);
              if (!version) {
                return null;
              }

              return html`<img src="${version.url}" alt="${version.alt}" class="badge" />`;
            })}
          </span>
          <span
            class="${classMap({ name: true, "name-painted": !!this.paint?.backgroundImage })}"
            style="${styleMap(resolveNameStyle(this.message.sender, this.paint))}"
            >${renderName(this.message.sender)}:</span
          >
          <span class="${classMap({ content: true, italic: this.message.content.action })}"
            >${map(this.message.content.fragments, renderFragment)}</span
          >
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
