/**
 * Notifications on the phone even outside the app (Web Push, Ephraïm 29/10/2026), behind an
 * interface (CLAUDE.md, conventions). PUSH_PROVIDER=fake keeps them in memory (tests); otherwise
 * they leave through the browsers' push services, signed with the platform's key pair.
 */
import webpush from "web-push";

export type PushMessage = {
  title: string;
  body: string;
  /** The page a touch opens. */
  url: string;
  /** The sender's photo, when there is one. */
  icon?: string;
  /** One notification per conversation on the phone: a newer one replaces it. */
  tag?: string;
};

export type PushDevice = { endpoint: string; p256dh: string; auth: string };
export type VapidKeys = { publicKey: string; privateKey: string };

export interface PushSender {
  readonly id: "fake" | "webpush";
  /** "gone": the device no longer accepts notifications (uninstalled, permission withdrawn). */
  send(device: PushDevice, message: PushMessage): Promise<"sent" | "gone">;
}

export class FakePushSender implements PushSender {
  readonly id = "fake";
  readonly outbox: { device: PushDevice; message: PushMessage }[] = [];

  async send(device: PushDevice, message: PushMessage) {
    this.outbox.push({ device, message });
    return "sent" as const;
  }
}

export class WebPushSender implements PushSender {
  readonly id = "webpush";

  constructor(private readonly keys: VapidKeys) {}

  async send(device: PushDevice, message: PushMessage) {
    try {
      await webpush.sendNotification(
        { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
        JSON.stringify(message),
        {
          vapidDetails: {
            subject: "mailto:assistant@jumanly.io",
            publicKey: this.keys.publicKey,
            privateKey: this.keys.privateKey,
          },
          TTL: 24 * 3600,
          urgency: "high",
          timeout: 4000,
        },
      );
      return "sent" as const;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) return "gone" as const;
      throw error;
    }
  }
}

export const makeVapidKeys = (): VapidKeys => webpush.generateVAPIDKeys();

let fake: FakePushSender | null = null;

export function pushSender(keys: VapidKeys): PushSender {
  if (process.env.PUSH_PROVIDER === "fake") return (fake ??= new FakePushSender());
  return new WebPushSender(keys);
}
