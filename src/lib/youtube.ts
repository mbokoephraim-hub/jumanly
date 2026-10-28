/**
 * YouTube lessons (27/10/2026): a lesson may play a YouTube video, embedded in Jumanly only (no
 * link out). The lesson keeps it as `youtube:<id>` in `videoId`; the admin pastes any usual link.
 */
const ID = /^[\w-]{11}$/;
const PREFIX = "youtube:";

/** The video id of a YouTube link (watch, youtu.be, embed, shorts, live) or of `youtube:<id>`. */
export function youtubeIdOf(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (text.startsWith(PREFIX)) {
    const id = text.slice(PREFIX.length);
    return ID.test(id) ? id : null;
  }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id =
      first === "watch"
        ? url.searchParams.get("v")
        : ["embed", "shorts", "live", "v"].includes(first ?? "")
          ? (second ?? null)
          : null;
  }
  return id && ID.test(id) ? id : null;
}

/** What is stored in `Lesson.videoId` for a YouTube link. */
export function youtubeVideoId(id: string) {
  return `${PREFIX}${id}`;
}

/** The link shown back in the admin form. */
export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** The privacy-enhanced embed, without suggestions from other channels at the end. */
export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

/** The video's own picture, used as the cover of a course published from a YouTube link. */
export function youtubeThumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
