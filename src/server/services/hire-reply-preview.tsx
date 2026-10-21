import { render } from "@react-email/components";
import type { PrismaClient } from "@/generated/prisma/client";
import { notRetainedEmail, shortlistedEmail } from "../../../emails/_components/recruiter-content";
import TransactionalEmail from "../../../emails/transactional";
import { HireError, type HireContext } from "./hire";
import { personalize, replyRecipients, type ReplyGroup, type Strength } from "./hire-group-replies";

/**
 * The e-mail one person of a grouped reply would receive (web recruiter lot 4, planche « Aperçu
 * du message »), rendered exactly as it leaves, before anything is sent. Same rights and the same
 * recipients as the sending itself (`replyRecipients`: manage permission, the organisation's job
 * only); nothing is stored, nothing is sent. The talent's address is never shown.
 */
export async function groupReplyEmailPreview(
  db: PrismaClient,
  ctx: HireContext,
  input: {
    jobId: string;
    group: ReplyGroup;
    ids: string[];
    applicationId: string;
    body: string;
    company: string;
    strengthText: (strength: Strength) => string;
  },
) {
  const { job, people } = await replyRecipients(db, ctx, input.jobId, input.group, input.ids);
  const person = people.find((item) => item.id === input.applicationId);
  if (!person) throw new HireError("notFound");
  const message = personalize(input.body, {
    firstName: person.firstName,
    strength: input.strengthText(person.strength),
    jobTitle: job.title,
    company: input.company,
  });
  const email =
    input.group === "non-retenus"
      ? notRetainedEmail(person.firstName, { jobTitle: job.title, company: input.company, message })
      : shortlistedEmail(person.firstName, {
          jobTitle: job.title,
          company: input.company,
          place: [input.company, job.city].filter(Boolean).join(" · "),
          message,
          href: "/app/messages",
        });
  const html = await render(<TransactionalEmail {...email.props} />);
  return { subject: email.subject, html };
}
