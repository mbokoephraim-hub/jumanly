"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cx } from "@/lib/cx";
import { advanceTaskAction } from "@/server/actions/org-team";
import { Toast } from "./team";

type Status = "assigned" | "accepted" | "in_progress" | "done";
const STEPS: Status[] = ["assigned", "accepted", "in_progress", "done"];
const NEXT = { assigned: "accept", accepted: "start", in_progress: "finish" } as const;

export type MyTask = {
  id: string;
  kind: "follow" | "diagnostic" | "interview";
  status: Status;
  due: string;
  late: boolean;
  applicationId: string;
  candidate: string;
};

/**
 * « Mes tâches » (étape 3, A2): what the administrator entrusted to the member. Each task moves
 * one step at a time: Accepter, Commencer, Marquer comme terminée; the administrator follows it.
 */
export function MyTasksScreen({ org, tasks }: { org: string; tasks: MyTask[] }) {
  const t = useTranslations("myTasks");
  const tt = useTranslations("orgTeam");
  const format = useFormatter();
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const date = (iso: string) => {
    const text = format.dateTime(new Date(iso), {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  return (
    <div className="ae-app ae-page" aria-busy={pending}>
      <h1 className="ae-h1">{t("title")}</h1>
      <p className="ae-meta ae-intro">{t("intro", { org })}</p>
      {tasks.length === 0 ? (
        <div className="ae-carte ae-vide">
          <p>{t("empty")}</p>
        </div>
      ) : (
        <ul className="ae-liste-taches">
          {tasks.map((task) => {
            const index = STEPS.indexOf(task.status);
            const next = task.status === "done" ? null : NEXT[task.status];
            return (
              <li key={task.id} className="ae-carte ae-tache">
                <div className="ae-ligne">
                  <span className="ae-grandit">
                    <b className="ae-nom">
                      {tt("task.line", {
                        kind: tt(`task.kind.${task.kind}`),
                        candidate: task.candidate,
                      })}
                    </b>
                    <span className="ae-meta">
                      {tt("task.due", { date: date(task.due) })}
                      {task.late ? ` · ${tt("task.late")}` : ""}
                    </span>
                  </span>
                  <b
                    className={cx(
                      "ae-statut",
                      task.status === "done"
                        ? "ae-st-fait"
                        : task.status === "assigned"
                          ? "ae-st-attente"
                          : "ae-st-cours",
                    )}
                  >
                    {tt(`task.status.${task.status}`)}
                  </b>
                  <span className="ae-actions-ligne">
                    <Link
                      href={`/app/hire/candidats/${task.applicationId}`}
                      className="ae-btn2 ae-btn-s"
                      aria-label={tt("task.fileAria", { candidate: task.candidate })}
                    >
                      {tt("task.file")}
                    </Link>
                    {next && (
                      <button
                        type="button"
                        className="ae-btn ae-btn-s"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const result = await advanceTaskAction(task.id);
                            setToast(result.text);
                          })
                        }
                      >
                        {t(next)}
                      </button>
                    )}
                  </span>
                </div>
                <ol
                  className="ae-etapes"
                  aria-label={tt("task.progress", { status: tt(`task.status.${task.status}`) })}
                >
                  {STEPS.map((step, i) => (
                    <li key={step} className={i <= index ? "ae-etape-on" : undefined}>
                      <span aria-hidden="true" />
                      <span className={i === index ? "ae-etape-ici" : undefined}>
                        {tt(`task.status.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
      {toast && <Toast text={toast} onClose={() => setToast(null)} label={tt("close")} />}
    </div>
  );
}
