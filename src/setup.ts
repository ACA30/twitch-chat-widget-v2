import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

type Theme = "default" | "simple" | "emote_dark";
type FetchStatus = "idle" | "loading" | "success" | "error";

@customElement("app-setup")
export class SetupElement extends LitElement {
  @state() private channelName = "";
  @state() private userID = "";
  @state() private theme: Theme = "default";
  @state() private fadeoutEnabled = true;
  @state() private fadeoutSeconds = "15";
  @state() private liveUpdates = true;
  @state() private seventvPaints = false;
  @state() private hideBots = false;
  @state() private chatCommandsEnabled = true;
  @state() private highlightMods = true;
  @state() private fetchStatus: FetchStatus = "idle";
  @state() private fetchError = "";
  @state() private copied = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #0e0e10;
      color: #efeff1;
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    .container {
      max-width: 560px;
      margin: 0 auto;
      padding: 48px 24px 64px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header svg {
      width: 40px;
      height: 40px;
      fill: #9147ff;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px;
      color: #efeff1;
    }

    .header p {
      margin: 0;
      color: #adadb8;
      font-size: 14px;
      line-height: 1.5;
    }

    .card {
      background: #18181b;
      border: 1px solid #2d2d35;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
    }

    h2 {
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #adadb8;
      margin: 0 0 20px;
    }

    .field {
      margin-bottom: 20px;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #c9c9d0;
      margin-bottom: 6px;
    }

    .input-row {
      display: flex;
      gap: 8px;
    }

    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      background: #0e0e10;
      border: 1px solid #3a3a44;
      border-radius: 6px;
      color: #efeff1;
      font-family: inherit;
      font-size: 14px;
      padding: 9px 12px;
      transition: border-color 0.15s;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }

    input[type="text"]:focus,
    input[type="number"]:focus,
    select:focus {
      border-color: #9147ff;
    }

    input[type="number"] {
      width: 100px;
    }

    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23adadb8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
      cursor: pointer;
    }

    .fetch-btn,
    .copy-btn {
      flex-shrink: 0;
      background: #9147ff;
      border: none;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 9px 16px;
      transition: background 0.15s, opacity 0.15s;
      white-space: nowrap;
    }

    .fetch-btn:hover,
    .copy-btn:hover {
      background: #772ce8;
    }

    .fetch-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .copy-btn.copied {
      background: #1f8b4c;
    }

    .copy-btn.copied:hover {
      background: #1a7a41;
    }

    .id-display {
      min-height: 38px;
      display: flex;
      align-items: center;
      padding: 9px 12px;
      background: #0e0e10;
      border: 1px solid #3a3a44;
      border-radius: 6px;
      font-size: 14px;
    }

    .id-display .user-id {
      color: #efeff1;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }

    .id-display .fetching {
      color: #adadb8;
    }

    .id-display .hint {
      color: #575761;
    }

    .id-display .error {
      color: #eb4034;
      font-size: 13px;
    }

    .hint-text {
      margin-top: 6px;
      font-size: 12px;
      color: #575761;
      line-height: 1.5;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #c9c9d0;
    }

    .toggle {
      position: relative;
      display: inline-flex;
      width: 40px;
      height: 22px;
      cursor: pointer;
      margin: 0;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .slider {
      position: absolute;
      inset: 0;
      background: #3a3a44;
      border-radius: 22px;
      transition: background 0.2s;
    }

    .slider::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      top: 3px;
      background: #efeff1;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle input:checked + .slider {
      background: #9147ff;
    }

    .toggle input:checked + .slider::before {
      transform: translateX(18px);
    }

    .sub-field {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sub-field label {
      margin: 0;
      white-space: nowrap;
      font-size: 13px;
    }

    .cmd-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .cmd-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .cmd-name {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #a970ff;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .cmd-desc {
      font-size: 13px;
      color: #adadb8;
      line-height: 1.4;
    }

    .url-card {
      border-color: #2d2d35;
    }

    .url-display {
      background: #0e0e10;
      border: 1px solid #3a3a44;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
      overflow-x: auto;
    }

    .url-display code {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #a970ff;
      white-space: nowrap;
    }

    .url-placeholder {
      font-size: 13px;
      color: #575761;
      padding: 10px 0 4px;
    }

    .theme-preview {
      margin-top: 10px;
      display: flex;
      gap: 8px;
    }

    .theme-badge {
      font-size: 11px;
      color: #adadb8;
      background: #0e0e10;
      border: 1px solid #2d2d35;
      border-radius: 4px;
      padding: 3px 8px;
    }

    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #2d2d35;
      font-size: 12px;
      color: #575761;
    }

    footer a {
      color: #575761;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: color 0.15s;
    }

    footer a:hover {
      color: #adadb8;
    }

    footer svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    .footer-left {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .footer-sep {
      color: #3a3a44;
    }
  `;

  private get generatedURL(): string {
    if (!this.channelName.trim() || !this.userID) return "";

    const login = this.channelName.trim().toLowerCase();
    const base = `${window.location.origin}/${this.userID}-${login}`;
    const params = new URLSearchParams();

    if (this.theme !== "default") params.set("theme", this.theme);

    if (!this.fadeoutEnabled) {
      params.set("fadeout", "off");
    } else {
      const secs = parseInt(this.fadeoutSeconds);
      if (!isNaN(secs) && secs !== 15) {
        params.set("fadeout", secs.toString());
      }
    }

    if (!this.liveUpdates) params.set("live", "0");
    if (this.seventvPaints) params.set("paints", "1");
    if (this.hideBots) params.set("bots", "0");
    if (!this.chatCommandsEnabled) params.set("commands", "0");
    if (!this.highlightMods) params.set("highlight_mods", "0");

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async fetchUserID() {
    const login = this.channelName.trim().toLowerCase();
    if (!login) return;

    this.fetchStatus = "loading";
    this.userID = "";

    try {
      const resp = await fetch(`https://decapi.me/twitch/id/${encodeURIComponent(login)}`);
      const text = (await resp.text()).trim();

      if (!resp.ok || !/^\d+$/.test(text)) {
        throw new Error(text || "User not found");
      }

      this.userID = text;
      this.fetchStatus = "success";
    } catch (e) {
      this.fetchError = e instanceof Error ? e.message : "Failed to fetch user ID";
      this.fetchStatus = "error";
    }
  }

  private handleChannelInput(e: Event) {
    this.channelName = (e.target as HTMLInputElement).value;
    if (this.fetchStatus !== "idle") {
      this.fetchStatus = "idle";
      this.userID = "";
    }
  }

  private handleChannelBlur() {
    if (this.channelName.trim() && this.fetchStatus === "idle") {
      this.fetchUserID();
    }
  }

  private handleChannelKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.fetchUserID();
    }
  }

  private async copyURL() {
    const url = this.generatedURL;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  private renderIDStatus() {
    switch (this.fetchStatus) {
      case "loading":
        return html`<span class="fetching">Looking up...</span>`;
      case "success":
        return html`<span class="user-id">${this.userID}</span>`;
      case "error":
        return html`<span class="error">${this.fetchError}</span>`;
      default:
        return html`<span class="hint">Enter a channel name above</span>`;
    }
  }

  render() {
    const url = this.generatedURL;
    const themeDescriptions: Record<Theme, string> = {
      default: "Standard dark chat bubbles with badges and emotes.",
      simple: "Minimal floating text with a soft outline, no background.",
      emote_dark: "Only displays messages that contain an emote.",
    };

    return html`
      <div class="container">
        <div class="header">
          <svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 0L0 4v20h6v4l4-4h4l8-8V0H2zm18 14l-4 4h-4l-4 4v-4H4V2h16v12z"/>
            <path d="M18 6h-2v6h2V6zM13 6h-2v6h2V6z"/>
          </svg>
          <h1>Twitch Chat Widget</h1>
          <p>Generate a browser source URL for OBS or other streaming software.</p>
        </div>

        <div class="card">
          <h2>Channel</h2>

          <div class="field">
            <label for="channel-input">Channel name</label>
            <div class="input-row">
              <input
                id="channel-input"
                type="text"
                placeholder="your_channel"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                .value=${this.channelName}
                @input=${this.handleChannelInput}
                @blur=${this.handleChannelBlur}
                @keydown=${this.handleChannelKeydown}
              />
              <button
                class="fetch-btn"
                @click=${this.fetchUserID}
                ?disabled=${!this.channelName.trim() || this.fetchStatus === "loading"}
              >
                ${this.fetchStatus === "loading" ? "..." : "Look up"}
              </button>
            </div>
          </div>

          <div class="field">
            <label>User ID</label>
            <div class="id-display">${this.renderIDStatus()}</div>
            ${this.fetchStatus === "error"
              ? html`<p class="hint-text">Couldn't auto-fetch the ID. You can find it at <a href="https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/" target="_blank" rel="noopener noreferrer" style="color:#a970ff">this lookup tool</a> and enter it manually below.</p>`
              : ""}
            ${this.fetchStatus === "error"
              ? html`
                <div style="margin-top:8px">
                  <input
                    type="text"
                    placeholder="Enter user ID manually"
                    @input=${(e: Event) => {
                      this.userID = (e.target as HTMLInputElement).value.trim();
                    }}
                  />
                </div>`
              : ""}
          </div>
        </div>

        <div class="card">
          <h2>Options</h2>

          <div class="field">
            <label for="theme-select">Theme</label>
            <select
              id="theme-select"
              .value=${this.theme}
              @change=${(e: Event) => {
                this.theme = (e.target as HTMLSelectElement).value as Theme;
              }}
            >
              <option value="default">Default</option>
              <option value="simple">Simple</option>
              <option value="emote_dark">Emote Dark</option>
            </select>
            <p class="hint-text">${themeDescriptions[this.theme]}</p>
          </div>

          <div class="field">
            <label>Message fade-out</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.fadeoutEnabled}
                  @change=${(e: Event) => {
                    this.fadeoutEnabled = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.fadeoutEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            ${this.fadeoutEnabled
              ? html`
                <div class="sub-field">
                  <label for="fadeout-input">Duration (seconds)</label>
                  <input
                    id="fadeout-input"
                    type="number"
                    min="1"
                    max="3600"
                    .value=${this.fadeoutSeconds}
                    @input=${(e: Event) => {
                      this.fadeoutSeconds = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>`
              : ""}
          </div>

          <div class="field">
            <label>Hide bots</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.hideBots}
                  @change=${(e: Event) => {
                    this.hideBots = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.hideBots ? "Enabled" : "Disabled"}</span>
            </div>
            <p class="hint-text">Messages from known Twitch bots won't appear in the overlay.</p>
          </div>

          <div class="field">
            <label>Live emote updates</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.liveUpdates}
                  @change=${(e: Event) => {
                    this.liveUpdates = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.liveUpdates ? "Enabled" : "Disabled"}</span>
            </div>
            <p class="hint-text">Emote sets update instantly when the channel adds or removes emotes, without a page reload.</p>
          </div>

          <div class="field">
            <label>7TV namepaints</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.seventvPaints}
                  @change=${(e: Event) => {
                    this.seventvPaints = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.seventvPaints ? "Enabled" : "Disabled"}</span>
            </div>
            <p class="hint-text">Renders 7TV users' custom name gradients and styles on their chat names.</p>
          </div>

          <div class="field">
            <label>Broadcaster/mod commands</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.chatCommandsEnabled}
                  @change=${(e: Event) => {
                    this.chatCommandsEnabled = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.chatCommandsEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p class="hint-text">The broadcaster and moderators can reload or reconnect the overlay by typing commands in chat.</p>
          </div>

          <div class="field">
            <label>Highlight mod/broadcaster messages</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  type="checkbox"
                  .checked=${this.highlightMods}
                  @change=${(e: Event) => {
                    this.highlightMods = (e.target as HTMLInputElement).checked;
                  }}
                />
                <span class="slider"></span>
              </label>
              <span>${this.highlightMods ? "Enabled" : "Disabled"}</span>
            </div>
            <p class="hint-text">Moderator messages get a subtle green tint; broadcaster messages get red.</p>
          </div>
        </div>

        ${this.chatCommandsEnabled ? html`
        <div class="card">
          <h2>Chat Commands</h2>
          <ul class="cmd-list">
            <li class="cmd-row">
              <span class="cmd-name">!reloadchat</span>
              <span class="cmd-desc">Reloads the overlay page.</span>
            </li>
            <li class="cmd-row">
              <span class="cmd-name">!reloadws</span>
              <span class="cmd-desc">Re-fetches all emote and badge data and reconnects the 7TV EventSource.</span>
            </li>
            <li class="cmd-row">
              <span class="cmd-name">!reconnectchat</span>
              <span class="cmd-desc">Reconnects the Twitch IRC WebSocket.</span>
            </li>
          </ul>
          <p class="hint-text" style="margin-top:14px">Only the broadcaster and moderators can trigger these. A subtle checkmark appears on the command message when it is acknowledged.</p>
        </div>` : null}

        <div class="card url-card">
          <h2>Widget URL</h2>
          ${url
            ? html`
              <div class="url-display">
                <code>${url}</code>
              </div>
              <button class="copy-btn ${this.copied ? "copied" : ""}" @click=${this.copyURL}>
                ${this.copied ? "Copied!" : "Copy URL"}
              </button>`
            : html`<p class="url-placeholder">Set a channel name above to generate your URL.</p>`}
        </div>

        <footer>
          <div class="footer-left">
            <span>Created by <a href="https://broughton.sh" target="_blank" rel="noopener noreferrer">Nate Broughton</a></span>
            <span class="footer-sep">·</span>
            <span>Based on <a href="https://github.com/aidenwallis/twitch-chat-widget-2" target="_blank" rel="noopener noreferrer">original work</a> by Aiden Wallis (MIT)</span>
          </div>
          <a href="https://github.com/ACA30/twitch-chat-widget-v2" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </footer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-setup": SetupElement;
  }
}
