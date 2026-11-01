import "server-only";
import { getTranslations } from "next-intl/server";
import { sortGestureAction } from "@/server/actions/hire-tri";
import { db } from "@/server/db";
import { UndoBar } from "./tri-client";

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Retenu · Annuler » for 5 seconds after a gesture (`?geste=retenir&cible=…`). The name is read
 * from an application of the same offer, so a crafted address shows nothing.
 */
export async function RhUndoGesture({
  query,
  jobId,
  back,
}: {
  query: Record<string, string | string[] | undefined>;
  jobId: string;
  /** The page to come back to; the offer was already read within the organization. */
  back: string;
}) {
  const gesture = one(query.geste);
  const target = one(query.cible);
  if ((gesture !== "retenir" && gesture !== "attente") || !target) return null;
  const application = await db.application.findFirst({
    where: { id: target.slice(0, 60), jobId },
    select: {
      id: true,
      shortlistedAt: true,
      job: { select: { blindSort: true } },
      profile: { select: { user: { select: { name: true } } } },
    },
  });
  if (!application) return null;
  const t = await getTranslations("phoneRhTri");
  return (
    <UndoBar key={`${gesture}-${target}`}>
      <span>
        {application.job.blindSort && !application.shortlistedAt
          ? t("undo.holdBlind")
          : t(gesture === "retenir" ? "undo.retained" : "undo.hold", {
              name: application.profile.user.name,
            })}
      </span>
      <form action={sortGestureAction}>
        <input type="hidden" name="application" value={application.id} />
        <input type="hidden" name="job" value={jobId} />
        <input type="hidden" name="gesture" value={`annuler-${gesture}`} />
        <input type="hidden" name="back" value={back} />
        <button type="submit">{t("undo.button")}</button>
      </form>
    </UndoBar>
  );
}
