import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { GROUP_BODY_MAX, GROUP_MAX, replyGroups } from "@/server/services/hire-group-replies";
import { groupReplyEmailPreview } from "@/server/services/hire-reply-preview";

const inputSchema = z.object({
  job: z.string().trim().min(1).max(64),
  group: z.enum(replyGroups),
  ids: z.array(z.string().trim().min(1).max(64)).max(GROUP_MAX).default([]),
  application: z.string().trim().min(1).max(64),
  body: z.string().max(GROUP_BODY_MAX),
});

const noStore = { "Cache-Control": "private, no-store" };

/**
 * « Aperçu du message » of the grouped replies on a computer (web recruiter lot 4): the e-mail one
 * person would receive, rendered from the letter being written. Validate, session, the active
 * organisation, then the service checks the manage permission and keeps to the organisation's job
 * (`replyRecipients`). Nothing is stored or sent.
 */
export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const t = await getTranslations("hireReplies.strength");
  try {
    const preview = await groupReplyEmailPreview(
      db,
      { userId: user.id, organizationId: space.organizationId, role: space.role },
      {
        jobId: parsed.data.job,
        group: parsed.data.group,
        ids: parsed.data.ids,
        applicationId: parsed.data.application,
        body: parsed.data.body,
        company: space.organization.name,
        strengthText: (strength) =>
          strength.key === "generic" ? t("generic") : t(strength.key, { skill: strength.skill }),
      },
    );
    return NextResponse.json(preview, { headers: noStore });
  } catch (error) {
    if (error instanceof HireError)
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "forbidden" ? 403 : 404, headers: noStore },
      );
    throw error;
  }
}
