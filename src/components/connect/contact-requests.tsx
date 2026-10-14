import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState } from "@/components/ui";
import { respondContactAction } from "@/server/actions/connect";
import type { talentContactRequests } from "@/server/services/talent-search";

type Request = Awaited<ReturnType<typeof talentContactRequests>>[number];

/**
 * « Demandes de mise en relation » for a talent: nothing is exchanged before their answer.
 * Accept opens a conversation; decline or block are told to the organization without detail.
 */
export async function ContactRequests({
  requests,
  answered,
  answeredId,
}: {
  requests: Request[];
  answered: string;
  answeredId: string;
}) {
  const t = await getTranslations("connect.contactRequest");
  const company = requests.find((item) => item.id === answeredId)?.organization.name ?? "";
  const notice =
    answered === "declined"
      ? t("declined", { company })
      : answered === "blocked"
        ? t("blocked", { company })
        : answered === "expired" || answered === "notFound"
          ? t("unavailable")
          : null;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <Alert
          tone={answered === "declined" || answered === "blocked" ? "success" : "warning"}
          title={notice}
        />
      )}
      {requests.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            const name = request.organization.name;
            return (
              <li key={request.id} className="flex flex-col gap-3 rounded-card bg-blanc p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{t("title", { company: name })}</p>
                    <p className="text-sm text-ardoise">
                      {[
                        t("receivedOn", { date: request.createdAt }),
                        request.job ? t("job", { jobTitle: request.job.title }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {request.status !== "pending" && (
                    <Badge tone={request.status === "accepted" ? "success" : "neutral"}>
                      {request.status === "accepted"
                        ? t("status.accepted")
                        : request.status === "declined"
                          ? t("status.declined")
                          : t("expired")}
                    </Badge>
                  )}
                </div>
                {request.status === "pending" && (
                  <>
                    <p className="text-sm">
                      {t("body", { recruiterName: request.requester?.name ?? name })}
                    </p>
                    <div className="flex flex-col gap-1 rounded-md bg-creme p-3">
                      <p className="text-sm font-medium">{t("message")}</p>
                      <p className="whitespace-pre-line">{request.message}</p>
                    </div>
                    {request.profile.visibility === "anonymous" && (
                      <p className="text-sm text-ardoise">
                        {t("anonymousNote", { company: name })}
                      </p>
                    )}
                    <p className="text-sm text-ardoise">
                      {t("expiresOn", { date: request.expiresAt })}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {(["accept", "decline"] as const).map((answer) => (
                        <form key={answer} action={respondContactAction}>
                          <input type="hidden" name="request" value={request.id} />
                          <input type="hidden" name="answer" value={answer} />
                          <Button
                            type="submit"
                            size="sm"
                            variant={answer === "accept" ? "primary" : "secondary"}
                          >
                            {answer === "accept" ? t("accept") : t("decline")}
                          </Button>
                        </form>
                      ))}
                    </div>
                    <form action={respondContactAction}>
                      <input type="hidden" name="request" value={request.id} />
                      <input type="hidden" name="answer" value="block" />
                      <Button type="submit" size="sm" variant="tertiary">
                        {t("block", { company: name })}
                      </Button>
                    </form>
                  </>
                )}
                {request.status === "accepted" && request.conversationId && (
                  <Link
                    href={`/app/messages/${request.conversationId}`}
                    className="self-start text-sm font-medium underline"
                  >
                    {t("open")}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
