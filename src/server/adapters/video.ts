/**
 * Video for Learn behind an interface (CLAUDE.md, conventions): adaptive HLS playback, so the
 * player can lower the quality on a slow network. Bunny Stream is used when its library and
 * delivery host are configured; otherwise the fake adapter only plays direct https addresses
 * (handy in local and preview) and every other lesson shows its text instead.
 */
import { createHash } from "node:crypto";

export type VideoPlayback = {
  /** HLS playlist (.m3u8) or, for the fake adapter, any https video file. */
  src: string;
  poster?: string;
  /** Low-quality MP4 for very slow connections, when the provider generates one. */
  lowMp4?: string;
};

/** A direct upload from the browser to the provider (TUS), signed for one video. */
export type VideoUpload = {
  videoId: string;
  endpoint: string;
  headers: Record<string, string>;
};

/** Where the provider stands with a video: encoding, ready or failed (with a percentage). */
export type VideoStatus = { state: "processing" | "ready" | "failed"; progress: number };

export interface VideoProvider {
  readonly id: "fake" | "bunny";
  playback(videoId: string | null): VideoPlayback | null;
  /** Null when the provider takes no direct upload: the file then goes through the site. */
  createUpload(title: string): Promise<VideoUpload | null>;
  /** Null when the provider does not encode (a file is ready as sent). */
  status(videoId: string): Promise<VideoStatus | null>;
}

/**
 * Without a provider: an https address, or a file sent from the admin and served by the site
 * (`/medias/…`, Admin v2 étape 6).
 */
export class FakeVideoProvider implements VideoProvider {
  readonly id = "fake";

  playback(videoId: string | null) {
    return videoId && (/^https:\/\/\S+$/.test(videoId) || /^\/medias\/\S+$/.test(videoId))
      ? { src: videoId }
      : null;
  }

  async createUpload() {
    return null;
  }

  async status() {
    return null;
  }
}

export class BunnyVideoProvider implements VideoProvider {
  readonly id = "bunny";

  constructor(
    private readonly host: string,
    private readonly library?: { id: string; apiKey: string },
  ) {}

  /** Creates the video, then signs a TUS upload valid for two hours (Bunny Stream API). */
  async createUpload(title: string): Promise<VideoUpload | null> {
    if (!this.library) return null;
    const { id, apiKey } = this.library;
    const response = await fetch(`https://video.bunnycdn.com/library/${id}/videos`, {
      method: "POST",
      headers: { AccessKey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.slice(0, 120) }),
    });
    if (!response.ok) throw new Error(`Bunny Stream: ${response.status}`);
    const { guid } = (await response.json()) as { guid: string };
    const expire = Math.floor(Date.now() / 1000) + 2 * 3600;
    const signature = createHash("sha256").update(`${id}${apiKey}${expire}${guid}`).digest("hex");
    return {
      videoId: guid,
      endpoint: "https://video.bunnycdn.com/tusupload",
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expire),
        VideoId: guid,
        LibraryId: id,
      },
    };
  }

  async status(videoId: string): Promise<VideoStatus | null> {
    if (!this.library || !/^[\w-]{8,64}$/.test(videoId)) return null;
    const response = await fetch(
      `https://video.bunnycdn.com/library/${this.library.id}/videos/${videoId}`,
      { headers: { AccessKey: this.library.apiKey } },
    );
    if (!response.ok) return null;
    const video = (await response.json()) as { status: number; encodeProgress?: number };
    // 4 finished, 5 error, 6 upload failed; anything else is still on its way.
    const state = video.status === 4 ? "ready" : video.status >= 5 ? "failed" : "processing";
    return { state, progress: Math.max(0, Math.min(100, video.encodeProgress ?? 0)) };
  }

  playback(videoId: string | null) {
    if (!videoId || !/^[\w-]{8,64}$/.test(videoId)) return null;
    const base = `https://${this.host}/${videoId}`;
    return {
      src: `${base}/playlist.m3u8`,
      poster: `${base}/thumbnail.jpg`,
      lowMp4: `${base}/play_360p.mp4`,
    };
  }
}

export function videoProvider(): VideoProvider {
  const host = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  const library = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (process.env.VIDEO_PROVIDER === "bunny" && host)
    return new BunnyVideoProvider(host, library && apiKey ? { id: library, apiKey } : undefined);
  return new FakeVideoProvider();
}
