/**
 * The e-mail of a company's letter (« Candidature reçue », « Candidature retenue »), in the
 * waitlist e-mail's identity, sent as « {company} via Jumanly ». A failure never undoes the
 * message already written in the conversation.
 */
import "server-only";
import { render, toPlainText } from "@react-email/components";
import CompanyNoticeEmail from "../../emails/entreprise-candidature";
import { siteUrl, t } from "../../emails/_components/translator";
import { emailSender } from "./adapters/email";
import type { CompanyNoticeVariant, PostedNotice } from "./services/company-notice";

const day = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export async function mailCompanyNotice(variant: CompanyNoticeVariant, notice: PostedNotice) {
  const { talent, company, jobTitle } = notice;
  const href = new URL(
    variant === "received" ? "/app/jobs/candidatures" : `/app/messages/${notice.conversationId}`,
    siteUrl,
  ).toString();
  try {
    const html = await render(
      <CompanyNoticeEmail
        variant={variant}
        firstName={talent.firstName?.trim() ?? ""}
        email={talent.email}
        company={company}
        jobTitle={jobTitle}
        date={day.format(notice.appliedAt)}
        href={href}
      />,
    );
    await emailSender().send({
      to: talent.email,
      subject: t(`mail.companyNotice.${variant}.subject`, { company, jobTitle }),
      html,
      text: toPlainText(html),
      fromName: t("mail.companyNotice.from", { company }),
    });
  } catch (error) {
    console.error("[e-mail entreprise]", error);
  }
}
