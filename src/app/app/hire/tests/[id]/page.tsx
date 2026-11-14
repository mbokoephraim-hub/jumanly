import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireEmpty } from "@/components/hire-v3/empty";
import { HireIcon } from "@/components/hire-v3/icon";
import { HirePage, HirePageHead } from "@/components/hire-v3/page-head";
import { isHireScope } from "@/lib/product-scope";
import {
  addQuestionAction,
  archiveTestAction,
  removeQuestionAction,
  sendTestAction,
  updateTestAction,
} from "@/server/actions/hire-v3-tests";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError, hirePermissions } from "@/server/services/hire";
import { QUESTIONS_MAX, TEST_LEVELS, testEditor } from "@/server/services/hire-v3-tests";

const PAGE = "/app/hire/tests";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Tests");
  return { title: t("title"), robots: { index: false } };
}

/** The editor of one test: its frame, its questions, then « Envoyer ». */
export default async function Page({ params, searchParams }: PageProps<"/app/hire/tests/[id]">) {
  if (!isHireScope()) notFound();
  const { id } = await params;
  const { ctx } = await requireHire(`${PAGE}/${id}`);
  const query = await searchParams;
  const data = await testEditor(db, ctx, id).catch((error: unknown) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const t = await getTranslations("hireV3Tests");
  const te = await getTranslations("hireV3Tests.editor");
  const { test, jobs, pending, enabled } = data;
  const canEdit = hirePermissions(ctx.role).manage && enabled;
  const flash =
    typeof query.envoye === "string"
      ? t("flash.sent", { count: Number(query.envoye) })
      : query.enregistre
        ? te("saved")
        : query.ajoute
          ? te("added")
          : query.retire
            ? te("removed")
            : query.erreur === "forbidden"
              ? t("flash.forbidden")
              : query.erreur
                ? t("flash.invalid")
                : null;
  const total = test.questions.reduce((a, q) => a + q.points, 0);
  return (
    <HirePage view="tests">
      <HirePageHead
        back={{ href: PAGE, label: t("title") }}
        title={test.title}
        sub={te("sub", { questions: test.questions.length, points: total, minutes: test.minutes })}
        actions={
          canEdit && test.jobId && test.questions.length > 0 ? (
            <form action={sendTestAction}>
              <input type="hidden" name="id" value={test.id} />
              <button type="submit" className="btn pri" disabled={pending === 0}>
                <HireIcon name="send" />
                {pending ? te("send", { count: pending }) : te("sendNone")}
              </button>
            </form>
          ) : null
        }
      />
      {flash ? (
        <p className="meta" role="status" style={{ margin: "0 0 12px", fontWeight: 600 }}>
          {flash}
        </p>
      ) : null}
      <div className="tsgrid">
        <div className="tsbox" id="questions">
          <div className="tsh">
            <h3>{te("questions")}</h3>
            <span className="meta">{te("questionsSub", { max: QUESTIONS_MAX })}</span>
          </div>
          {test.questions.length === 0 ? (
            <HireEmpty compact icon="tests" title={te("noQuestion")} text={te("noQuestionText")} />
          ) : (
            <ol className="stack" style={{ gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              {test.questions.map((q, i) => (
                <li
                  key={q.id}
                  className="tsoq"
                  style={{ background: "var(--surface-2, transparent)" }}
                >
                  <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                    <span className="tsrk">{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontWeight: 600 }}>{q.prompt}</b>
                      {q.kind === "choice" ? (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                          {q.choices.map((choice, j) => (
                            <li
                              key={j}
                              className="meta"
                              style={j === q.answer ? { fontWeight: 700 } : undefined}
                            >
                              {choice}
                              {j === q.answer ? ` · ${te("right")}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="meta" style={{ marginTop: 6 }}>
                          {te("short")}
                        </div>
                      )}
                    </div>
                    <span className="meta">{te("points", { count: q.points })}</span>
                    {canEdit ? (
                      <form action={removeQuestionAction}>
                        <input type="hidden" name="id" value={test.id} />
                        <input type="hidden" name="question" value={q.id} />
                        <button type="submit" className="round" aria-label={te("remove")}>
                          <HireIcon name="x" size="s" />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {canEdit && test.questions.length < QUESTIONS_MAX ? (
            <form action={addQuestionAction} className="stack" style={{ gap: 10, marginTop: 16 }}>
              <input type="hidden" name="id" value={test.id} />
              <div className="tsgrp">{te("add")}</div>
              <label className="nwf">
                <span>{te("prompt")}</span>
                <textarea name="prompt" rows={2} maxLength={600} required minLength={3} />
              </label>
              <label className="nwf">
                <span>{te("kind")}</span>
                <select name="kind" defaultValue="choice">
                  <option value="choice">{te("kinds.choice")}</option>
                  <option value="short">{te("kinds.short")}</option>
                </select>
              </label>
              <fieldset className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
                <legend className="meta" style={{ marginBottom: 6 }}>
                  {te("choices")}
                </legend>
                {[0, 1, 2, 3].map((j) => (
                  <label key={j} className="row" style={{ gap: 8 }}>
                    <input
                      type="radio"
                      name="answer"
                      value={j}
                      defaultChecked={j === 0}
                      aria-label={te("rightOf", { n: j + 1 })}
                    />
                    <input
                      name="choice"
                      maxLength={200}
                      placeholder={te("choice", { n: j + 1 })}
                      style={{ flex: 1 }}
                      className="nwin"
                    />
                  </label>
                ))}
              </fieldset>
              <div className="row" style={{ gap: 8 }}>
                <label className="nwf" style={{ width: 120 }}>
                  <span>{te("pointsLabel")}</span>
                  <input type="number" name="points" min={1} max={10} defaultValue={1} />
                </label>
                <button
                  type="submit"
                  className="btn sm dark"
                  style={{ marginLeft: "auto", alignSelf: "flex-end" }}
                >
                  <HireIcon name="plus" size="s" />
                  {te("addGo")}
                </button>
              </div>
            </form>
          ) : null}
        </div>
        <div className="tsbox">
          <div className="tsh">
            <h3>{te("frame")}</h3>
          </div>
          <form action={updateTestAction} className="stack" style={{ gap: 12 }}>
            <input type="hidden" name="id" value={test.id} />
            <label className="nwf">
              <span>{t("create.name")}</span>
              <input
                name="title"
                defaultValue={test.title}
                maxLength={120}
                required
                disabled={!canEdit}
              />
            </label>
            <label className="nwf">
              <span>{t("create.job")}</span>
              <select name="job" defaultValue={test.jobId ?? ""} disabled={!canEdit}>
                <option value="">{t("create.noJob")}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="row" style={{ gap: 10 }}>
              <label className="nwf" style={{ flex: 1 }}>
                <span>{te("minutes")}</span>
                <input
                  type="number"
                  name="minutes"
                  min={5}
                  max={180}
                  defaultValue={test.minutes}
                  disabled={!canEdit}
                />
              </label>
              <label className="nwf" style={{ flex: 1 }}>
                <span>{te("level")}</span>
                <select name="level" defaultValue={test.level} disabled={!canEdit}>
                  {TEST_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {t(`levels.${level}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="nwf">
              <span>{te("instructions")}</span>
              <textarea
                name="instructions"
                rows={4}
                maxLength={1000}
                defaultValue={test.instructions ?? ""}
                placeholder={te("instructionsPlaceholder")}
                disabled={!canEdit}
              />
            </label>
            <p className="meta">
              <HireIcon name="shield" size="s" /> {t("create.safe")}
            </p>
            {canEdit ? (
              <button type="submit" className="btn sm pri">
                {te("save")}
              </button>
            ) : null}
          </form>
          {canEdit ? (
            <form action={archiveTestAction} style={{ marginTop: 12 }}>
              <input type="hidden" name="id" value={test.id} />
              <button type="submit" className="btn sm ghost">
                {te("archive")}
              </button>
            </form>
          ) : null}
          {!test.jobId ? (
            <p className="meta" style={{ marginTop: 12 }}>
              {te("needJob")}
            </p>
          ) : null}
        </div>
      </div>
    </HirePage>
  );
}
