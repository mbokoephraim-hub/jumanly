import { getFormatter, getTranslations } from "next-intl/server";
import { Button, TextArea } from "@/components/ui";
import { addNoteAction, deleteNoteAction } from "@/server/actions/learn";
import { db } from "@/server/db";
import { NOTE_MAX } from "@/server/services/learn";

/** Private notes on a lesson: only their author sees them. */
export async function LessonNotes({
  userId,
  slug,
  lessonId,
}: {
  userId: string;
  slug: string;
  lessonId: string;
}) {
  const t = await getTranslations("learn.player.notes");
  const format = await getFormatter();
  const notes = await db.lessonNote.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: "asc" },
  });
  return (
    <section id="notes" className="flex scroll-mt-24 flex-col gap-3" aria-labelledby="notes-title">
      <h2 id="notes-title" className="text-h2">
        {t("title")}
      </h2>
      {notes.length === 0 ? (
        <p className="text-[15px] text-ardoise">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="flex flex-col gap-2 rounded-card bg-blanc p-4">
              <p className="text-sm text-ardoise">
                {format.dateTime(note.createdAt, { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <p className="text-[15px] leading-6 whitespace-pre-line">{note.body}</p>
              <form action={deleteNoteAction} className="self-end">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="lesson" value={lessonId} />
                <input type="hidden" name="note" value={note.id} />
                <Button type="submit" variant="tertiary" size="sm">
                  {t("delete.text")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addNoteAction} className="flex flex-col gap-3 rounded-card bg-blanc p-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="lesson" value={lessonId} />
        <TextArea id="note-body" name="body" label={t("label")} maxLength={NOTE_MAX} required />
        <Button type="submit" variant="secondary" className="self-start">
          {t("save")}
        </Button>
      </form>
    </section>
  );
}
