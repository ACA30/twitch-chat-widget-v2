import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import { getSeventvUserEmoteSetID, loadData } from "./external-data";
import { SeventvEventSource } from "./seventv-events";
import "./messages";
import "./setup";
import { parseChannelFromURL, seventvLiveUpdates } from "./url";

@customElement("app-root")
export class RootElement extends LitElement {
  @state()
  private channelLogin?: string;

  @state()
  private showSetup = false;

  private seventvEvents = new SeventvEventSource();
  private channelID?: string;

  static styles = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    this.channelLogin = undefined;
    this.showSetup = false;

    const parsed = parseChannelFromURL();
    if (!parsed) {
      this.showSetup = true;
      return;
    }

    this.channelID = parsed[0];
    this.addEventListener("reloadws", this.handleReloadWS);

    loadData(parsed[0]).then(() => {
      this.channelLogin = parsed[1];
      const setID = getSeventvUserEmoteSetID();
      if (setID && seventvLiveUpdates) {
        this.seventvEvents.connect(setID);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("reloadws", this.handleReloadWS);
    this.seventvEvents.disconnect();
  }

  private handleReloadWS = () => {
    if (!this.channelID) return;
    this.seventvEvents.disconnect();
    loadData(this.channelID).then(() => {
      const setID = getSeventvUserEmoteSetID();
      if (setID && seventvLiveUpdates) {
        console.log(`[chat-cmd] Reconnecting 7TV EventSource for emote set ${setID}`);
        this.seventvEvents.connect(setID);
      } else {
        console.log("[chat-cmd] External data reloaded (7TV live updates not enabled, skipping EventSource reconnect)");
      }
    });
  };

  render() {
    if (this.showSetup) {
      return html`<app-setup></app-setup>`;
    }
    return html`
      ${when(this.channelLogin, () => html`<app-messages channelLogin="${this.channelLogin}"></app-messages>`)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": RootElement;
  }
}
