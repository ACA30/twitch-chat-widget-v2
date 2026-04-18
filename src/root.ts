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
    this.seventvEvents.disconnect();
  }

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
