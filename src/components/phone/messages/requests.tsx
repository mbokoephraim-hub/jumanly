"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  acceptRequestAction,
  ignoreRequestAction,
  respondOrgRequestAction,
} from "@/server/actions/messages-phone";
import { PhoneBack } from "../back";
import { WhoAvatar, WhoName } from "./parts";
import type { OrgRequestView, RequestView } from "./types";

type Answer = { kind: "ok"; conversationId: string } | { kind: "no" };

/**
 * « Demandes de connexion » (Modèle B, lot B8, planche Messages-demandes): each request with its
 * word, « Accepter » or « Ignorer ». The person who asked is never told of an ignored request.
 * The organizations asking to talk (E8) come under them.
 */
export function PhoneRequests({
  requests,
  orgRequests,
}: {
  requests: RequestView[];
  orgRequests: OrgRequestView[];
}) {
  const t = useTranslations("phoneMsg");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pending, start] = useTransition();

  const answer = (id: string, task: () => Promise<Answer | null>, toast?: string) =>
    start(async () => {
      const result = await task().catch(() => null);
      if (!result) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      setAnswers((current) => ({ ...current, [id]: result }));
      if (toast && result.kind === "ok") showToast({ message: toast });
    });

  const accept = (request: RequestView) =>
    answer(
      request.id,
      async () => {
        const result = await acceptRequestAction(request.id);
        return result.ok ? { kind: "ok", conversationId: result.value } : null;
      },
      t("requests.accepted", { name: request.who.first }),
    );
  const ignore = (request: RequestView) =>
    answer(request.id, async () => {
      const result = await ignoreRequestAction(request.id);
      return result.ok ? { kind: "no" } : null;
    });
  const respondOrg = (request: OrgRequestView, yes: boolean) =>
    answer(
      request.id,
      async () => {
        const result = await respondOrgRequestAction(request.id, yes);
        if (!result.ok) return null;
        return result.value ? { kind: "ok", conversationId: result.value } : { kind: "no" };
      },
      t("requests.orgAccepted", { name: request.who.name }),
    );

  return (
    <div className="nb-page nb-ms nb-ms-dem">
      <header className="nb-barre">
        <PhoneBack fallback="/app/messages" label={t("back")} />
        <h1>{t("requests.title")}</h1>
      </header>
      {requests.map((request) => {
        const done = answers[request.id];
        return (
          <div key={request.id} className="nb-ms-demande">
            <WhoAvatar who={request.who} />
            <div className="nb-ms-ligne-c">
              <WhoName who={request.who} />
              <span className="nb-meta">{request.who.line}</span>
              {request.note ? (
                <p className="nb-ms-mot">{t("requests.quoted", { text: request.note })}</p>
              ) : null}
              {!done ? (
                <span className="nb-ms-choix">
                  <button
                    type="button"
                    className="nb-ms-oui"
                    disabled={pending}
                    onClick={() => accept(request)}
                  >
                    {t("requests.accept")}
                  </button>
                  <button
                    type="button"
                    className="nb-ms-non"
                    disabled={pending}
                    onClick={() => ignore(request)}
                  >
                    {t("requests.ignore")}
                  </button>
                </span>
              ) : done.kind === "ok" ? (
                <Link href={`/app/messages/${done.conversationId}`} className="nb-ms-ecrire">
                  {t("requests.write", { name: request.who.first })}
                </Link>
              ) : (
                <span className="nb-meta nb-ms-ignore">
                  {t("requests.ignored", { name: request.who.first })}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {requests.length === 0 ? <p className="nb-meta nb-ms-vide">{t("requests.none")}</p> : null}
      {orgRequests.length ? (
        <>
          <p className="nb-sec">{t("requests.orgs")}</p>
          {orgRequests.map((request) => {
            const done = answers[request.id];
            return (
              <div key={request.id} className="nb-ms-demande">
                <WhoAvatar who={request.who} />
                <div className="nb-ms-ligne-c">
                  <WhoName who={request.who} />
                  <span className="nb-meta">
                    {request.job ? t("requests.about", { job: request.job }) : request.who.line}
                  </span>
                  <p className="nb-ms-mot">{t("requests.quoted", { text: request.note })}</p>
                  {!done ? (
                    <span className="nb-ms-choix">
                      <button
                        type="button"
                        className="nb-ms-oui"
                        disabled={pending}
                        onClick={() => respondOrg(request, true)}
                      >
                        {t("requests.accept")}
                      </button>
                      <button
                        type="button"
                        className="nb-ms-non"
                        disabled={pending}
                        onClick={() => respondOrg(request, false)}
                      >
                        {t("requests.decline")}
                      </button>
                    </span>
                  ) : done.kind === "ok" ? (
                    <Link href={`/app/messages/${done.conversationId}`} className="nb-ms-ecrire">
                      {t("requests.write", { name: request.who.name })}
                    </Link>
                  ) : (
                    <span className="nb-meta nb-ms-ignore">
                      {t("requests.declined", { name: request.who.name })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </>
      ) : null}
      <p className="nb-meta nb-ms-pied">{t("requests.note")}</p>
    </div>
  );
}
