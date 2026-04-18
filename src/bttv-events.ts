import { bttvURL, bttvUser } from "./external-data";

type BttvMessage = {
  name: string;
  data?: {
    channel?: string;
    emote?: { id?: string; code?: string };
    emoteId?: string;
  };
};

const WS_URL = "wss://sockets.betterttv.net/ws";
const MAX_RECONNECT_MS = 30_000;

export class BttvEventSource {
  private ws: WebSocket | null = null;
  private channelId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;

  connect(channelId: string) {
    if (this.channelId === channelId && this.ws) return;
    this.disconnect();
    this.channelId = channelId;
    this.openConnection();
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
    this.channelId = null;
    this.reconnectAttempts = 0;
  }

  private openConnection() {
    if (!this.channelId) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.ws!.send(
        JSON.stringify({ name: "join_channel", data: { name: `twitch:${this.channelId}` } }),
      );
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as BttvMessage;
        this.onMessage(msg);
      } catch {
        // ignore malformed frames
      }
    };

    // onerror is always followed by onclose, so reconnect logic lives there
    this.ws.onclose = () => {
      this.ws = null;
      if (this.channelId) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    const delay = Math.min(1_000 * 2 ** this.reconnectAttempts, MAX_RECONNECT_MS);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => this.openConnection(), delay);
  }

  private onMessage(msg: BttvMessage) {
    switch (msg.name) {
      case "emote_create": {
        const id = msg.data?.emote?.id;
        const code = msg.data?.emote?.code;
        if (id && code) {
          bttvUser.set(code, { id, url: bttvURL(id) });
          console.log(`[BTTV] emote added: ${code}`);
        }
        break;
      }

      case "emote_delete": {
        const emoteId = msg.data?.emoteId;
        if (emoteId) {
          bttvUser.deleteWhere((v) => v.id === emoteId);
          console.log(`[BTTV] emote removed (id: ${emoteId})`);
        }
        break;
      }

      case "emote_update": {
        const id = msg.data?.emote?.id;
        const code = msg.data?.emote?.code;
        if (id && code) {
          bttvUser.deleteWhere((v) => v.id === id);
          bttvUser.set(code, { id, url: bttvURL(id) });
          console.log(`[BTTV] emote updated: ${code}`);
        }
        break;
      }
    }
  }
}
