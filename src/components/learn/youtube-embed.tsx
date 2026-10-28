import { youtubeEmbedUrl } from "@/lib/youtube";

/**
 * A YouTube lesson played inside Jumanly (privacy-enhanced player, 16:9). The page never offers a
 * link to watch it elsewhere.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[inherit] bg-black">
      <iframe
        src={youtubeEmbedUrl(id)}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}
