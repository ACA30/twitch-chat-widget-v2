import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { DelayedQueue } from "./delayed-queue";
import { ImageFragment } from "./fragment";
import "./message";
import { FragmentedChatMessage, TwitchConnection } from "./twitch-connection";
import { chatCommands, hideBots, isEmoteOnly } from "./url";

const MAX_BUFFER = 100;

@customElement("app-messages")
export class MessagesElement extends LitElement {
  @property()
  channelLogin?: string;

  private delayedQueue = new DelayedQueue<FragmentedChatMessage>(
    1000,
    (m) => m.id,
    (m) => m.sender.login,
    (m) => {
      this.buffer.push(m);

      const toRemove = this.buffer.length - MAX_BUFFER;
      if (toRemove > 0) {
        this.buffer.splice(0, toRemove);
      }

      this.requestUpdate();
    },
  );
  private connection = new TwitchConnection();

  static styles = css`
    #messages {
      position: fixed;
      margin: 0;
      padding: 0;
      left: 0;
      bottom: 0;
      width: 100vw;
    }

    .message {
      list-style: none;
    }
  `;

  @property()
  private buffer: FragmentedChatMessage[] = [];

  @state()
  private commandAckIds: Set<string> = new Set();

  private lastEmoteImage?: string;

  constructor() {
    super();

    // we delay message appearances to allow for fossabot to time things out
    this.connection.onMessage((message) => {
      if (hideBots && message.sender.badges.some((b) => b.id === "bot-badge")) {
        return;
      }
      if (isEmoteOnly() && !this.shouldIncludeMessageInEmoteOnly(message)) {
        return;
      }
      this.delayedQueue.push(message);
    });

    this.connection.onDeleteMessage((id) => {
      // if message is on screen, remove it
      const idx = this.buffer.findIndex((m) => m.id === id);
      idx !== -1 && this.buffer.splice(idx, 1);

      // if message is in pending, evict it from the indexes and buffers
      this.delayedQueue.evictEvent(id);
    });
    this.connection.onUserTimeout((login) => {
      // clear from screen
      this.buffer = this.buffer.filter((m) => m.sender.login !== login);

      // evict from the queue if it's not on screen yet
      this.delayedQueue.evictAllEventsInGroup(login);
    });

    if (chatCommands) this.connection.onCommand((cmd, messageId) => {
      this.commandAckIds = new Set([...this.commandAckIds, messageId]);

      switch (cmd) {
        case "!reloadchat":
        case "!refreshchat":
          console.log("[chat-cmd] Reloading page...");
          window.location.reload();
          break;
        case "!reconnectchat":
          console.log("[chat-cmd] Reconnecting to Twitch IRC...");
          this.connection.reconnect();
          break;
        case "!reloadws":
          console.log("[chat-cmd] Reloading external emote/badge data and reconnecting 7TV EventSource...");
          this.dispatchEvent(new CustomEvent("reloadws", { bubbles: true, composed: true }));
          break;
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.connectAndJoin();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.delayedQueue.cleanup();
  }

  render() {
    return html`
      <ul id="messages">
        ${repeat(
          this.buffer,
          (m) => m.id,
          (message) => html`
            <li id="${message.id}" class="message">
              <app-message .message=${message} .commandAck=${this.commandAckIds.has(message.id)}></app-message>
            </li>
          `,
        )}
      </ul>
    `;
  }

  protected updated(changed: Map<string, string>) {
    changed.has("channelLogin") && this.connectAndJoin();
    this.scrollToBottom();
  }

  private connectAndJoin() {
    this.channelLogin && this.connection.join(this.channelLogin);
    this.connection.connect();
  }

  private scrollToBottom() {
    const el = document.getElementById("messages");
    el && (el.scrollTop = el.scrollHeight + 100);
  }

  private shouldIncludeMessageInEmoteOnly(message: FragmentedChatMessage) {
    const firstEmote = message.content.fragments.find((f) => f.type === "image") as ImageFragment;
    if (!firstEmote) {
      return false; // no emotes in msg
    }

    if (firstEmote.image === this.lastEmoteImage) {
      return false; // same emote as before
    }

    this.lastEmoteImage = firstEmote.image;
    return true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-messages": MessagesElement;
  }
}
