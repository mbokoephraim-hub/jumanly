/**
 * Video for Learn behind an interface (CLAUDE.md, conventions): adaptive HLS playback, so the
 * player can lower the quality on a slow network. Bunny Stream is used when its library and
 * delivery host are configured; otherwise the fake adapter only plays direct https addresses
 * (handy in local and preview) and every other lesson shows its text instead.
 */
export type VideoPlayback = {
  /** HLS playlist (.m3u8) or, for the fake adapter, any https video file. */
  src: string;
  poster?: string;
  /** Low-quality MP4 for very slow connections, when the provider generates one. */
  lowMp4?: string;
};

export interface VideoProvider {
  readonly id: "fake" | "bunny";
  playback(videoId: string | null): VideoPlayback | null;
}

export class FakeVideoProvider implements VideoProvider {
  readonly id = "fake";

  playback(videoId: string | null) {
    return videoId && /^https:\/\/\S+$/.test(videoId) ? { src: videoId } : null;
  }
}

export class BunnyVideoProvider implements VideoProvider {
  readonly id = "bunny";

  constructor(private readonly host: string) {}

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
  if (process.env.VIDEO_PROVIDER === "bunny" && host) return new BunnyVideoProvider(host);
  return new FakeVideoProvider();
}
