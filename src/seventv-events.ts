import {
  resolveRelevant7tvURL,
  SEVENTV_EMOTE_FLAG_ZERO_WIDTH,
  seventvUser,
  type SeventvEmote,
} from "./external-data";

type SeventvDispatchBody = {
  pushed?: readonly PushedItem[];
  pulled?: readonly PulledItem[];
};

type PushedItem = {
  key: string;
  value?: SeventvEmote;
};

type PulledItem = {
  key: string;
  value?: { name?: string };
  old_value?: { name?: string };
};

type SeventvDispatchPayload = {
  type?: string;
  body?: SeventvDispatchBody;
};

function buildEventsUrl(emoteSetID: string) {
  return `https://events.7tv.io/v3@emote_set.update%3Cobject_id=${encodeURIComponent(emoteSetID)}%3E`;
}

export class SeventvEventSource {
  private source: EventSource | null = null;
  private connectedSetId: string | null = null;

  connect(emoteSetID: string) {
    if (this.connectedSetId === emoteSetID && this.source) {
      return;
    }

    this.disconnect();
    this.connectedSetId = emoteSetID;

    const url = buildEventsUrl(emoteSetID);
    this.source = new EventSource(url);

    this.source.addEventListener("dispatch", (event: Event) => {
      const messageEvent = event as MessageEvent<string>;
      try {
        const data = JSON.parse(messageEvent.data) as SeventvDispatchPayload;
        this.onDispatch(data);
      } catch (error) {
        console.error("Failed to parse 7TV dispatch event:", error);
      }
    });

    this.source.onerror = () => {
      console.error("7TV EventSource connection error");
    };
  }

  disconnect() {
    this.source?.close();
    this.source = null;
    this.connectedSetId = null;
  }

  private onDispatch(data: SeventvDispatchPayload) {
    const body = data.body;
    if (!body) return;

    for (const item of body.pushed ?? []) {
      if (item.key !== "emotes" || !item.value?.name || !item.value?.data?.host) {
        continue;
      }

      const flags = (item.value.flags ?? 0) | (item.value.data?.flags ?? 0);
      const zeroWidth = (flags & SEVENTV_EMOTE_FLAG_ZERO_WIDTH) !== 0;
      seventvUser.set(item.value.name, {
        id: item.value.id,
        url: resolveRelevant7tvURL(item.value.data.host),
        zeroWidth,
      });
      console.log(`[7TV] emote added: ${item.value.name}${zeroWidth ? " (zero-width)" : ""}`);
    }

    for (const item of body.pulled ?? []) {
      if (item.key !== "emotes") continue;

      const name = item.old_value?.name ?? item.value?.name;
      if (name) {
        seventvUser.delete(name);
        console.log(`[7TV] emote removed: ${name}`);
      }
    }
  }
}
