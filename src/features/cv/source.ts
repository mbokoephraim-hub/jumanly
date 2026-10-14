import "server-only";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseCv, type CvContent } from "@/server/services/cv";
import type { PrintSource } from "./export/token";
import { resolveStyle, type CvStyle } from "./style";
import { templateOf, type CvTemplate } from "./templates/registry";

/** A CV to lay out: the live document, or the copy kept with an application or a message. */
export type CvSource = {
  title: string;
  template: CvTemplate;
  style: CvStyle;
  content: CvContent;
  photoUrl: string | null;
};

const snapshotSchema = z.object({
  title: z.string(),
  templateId: z.string(),
  content: z.unknown(),
  style: z.unknown().optional(),
});

function fromSnapshot(value: unknown, photoUrl: string | null): CvSource | null {
  const snapshot = snapshotSchema.safeParse(value);
  if (!snapshot.success) return null;
  const template = templateOf(snapshot.data.templateId);
  return {
    title: snapshot.data.title,
    template,
    style: resolveStyle(snapshot.data.style, template),
    content: parseCv(snapshot.data.content as never),
    photoUrl,
  };
}

export function cvSourceOf(
  document: {
    title: string;
    templateId: string;
    content: unknown;
    style: unknown;
  },
  photoUrl: string | null,
): CvSource {
  const template = templateOf(document.templateId);
  return {
    title: document.title,
    template,
    style: resolveStyle(document.style, template),
    content: parseCv(document.content as never),
    photoUrl,
  };
}

/** What the print page shows for a token (access was checked when the token was made). */
export async function loadCvSource(
  db: PrismaClient,
  source: PrintSource,
  id: string,
): Promise<CvSource | null> {
  if (source === "document") {
    const document = await db.document.findFirst({
      where: { id, kind: "cv" },
      include: { profile: { select: { user: { select: { image: true } } } } },
    });
    return document ? cvSourceOf(document, document.profile.user.image) : null;
  }
  if (source === "application") {
    const application = await db.application.findUnique({
      where: { id },
      select: { cvSnapshot: true, profile: { select: { user: { select: { image: true } } } } },
    });
    return application
      ? fromSnapshot(application.cvSnapshot, application.profile.user.image)
      : null;
  }
  const message = await db.message.findUnique({ where: { id }, select: { payload: true } });
  const payload = message?.payload as { document?: unknown } | null | undefined;
  return fromSnapshot(payload?.document, null);
}
