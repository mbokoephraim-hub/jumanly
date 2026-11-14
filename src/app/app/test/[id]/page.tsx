import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PhoneBack } from "@/components/phone/back";
import { requireUser } from "@/server/auth/session";
import { startTestAction, submitTestAction } from "@/server/actions/hire-v3-tests";
import { db } from "@/server/db";
import { inviteForTalent } from "@/server/services/hire-v3-tests";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentTest");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const BACK = "/app/messages";

/**
 * The skills test a company sent (lot 3 of the Hire v3 alignment): what it is, then the questions,
 * then « Merci ». Only the person who applied opens it (golden rule n° 5). Not taking it never
 * sets anybody aside: the team decides (golden rule n° 3).
 */
export default async function Page({ params }: PageProps<"/app/test/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/test/${id}`);
  const invite = await inviteForTalent(db, user.id, id.slice(0, 60));
  if (!invite) notFound();
  const t = await getTranslations("talentTest");
  const { test } = invite;
  const head = (
    <header className="nb-ca-form-barre" data-retour-texte="">
      <PhoneBack fallback={BACK} label={t("back")} text={t("back")} />
      <h1>{t("title")}</h1>
      <span />
    </header>
  );
  const intro = (
    <div style={{ padding: "16px 16px 0" }}>
      <p className="nb-meta">
        {t("from", { company: test.organization.name, job: test.job?.title ?? "" })}
      </p>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 4px" }}>{test.title}</h2>
      <p className="nb-meta">
        {t("facts", { questions: test.questions.length, minutes: test.minutes })}
      </p>
    </div>
  );

  if (invite.submittedAt) {
    return (
      <div className="nb-page nb-ca-form">
        {head}
        {intro}
        <section style={{ padding: 16 }} role="status">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t("thanks")}</h2>
          <p className="nb-meta" style={{ marginTop: 6 }}>
            {t("thanksText", { company: test.organization.name })}
          </p>
        </section>
      </div>
    );
  }

  if (!invite.startedAt) {
    return (
      <div className="nb-page nb-ca-form">
        {head}
        {intro}
        <section style={{ padding: 16 }}>
          {test.instructions ? <p style={{ whiteSpace: "pre-line" }}>{test.instructions}</p> : null}
          <ul
            className="nb-meta"
            style={{ margin: "10px 0 0", paddingLeft: 18, listStyle: "disc" }}
          >
            <li>{t("rule.time", { minutes: test.minutes })}</li>
            <li>{t("rule.once")}</li>
            <li>{t("rule.fair")}</li>
          </ul>
          <form action={startTestAction} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={invite.id} />
            <button type="submit" className="nb-bouton" data-plein="" data-large="">
              {t("start")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="nb-page nb-ca-form">
      {head}
      {intro}
      <form action={submitTestAction} style={{ padding: 16 }}>
        <input type="hidden" name="id" value={invite.id} />
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 18 }}>
          {test.questions.map((q, i) => (
            <li key={q.id}>
              <input type="hidden" name={`kind:${q.id}`} value={q.kind} />
              {q.kind === "choice" ? (
                <fieldset className="nb-ca-ch" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 600, marginBottom: 8 }}>
                    {t("question", { n: i + 1 })} {q.prompt}
                  </legend>
                  {q.choices.map((choice, j) => (
                    <label
                      key={j}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}
                    >
                      <input type="radio" name={`q:${q.id}`} value={j} />
                      <span>{choice}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div className="nb-ca-ch">
                  <label htmlFor={`q-${q.id}`} style={{ fontWeight: 600 }}>
                    {t("question", { n: i + 1 })} {q.prompt}
                  </label>
                  <textarea
                    id={`q-${q.id}`}
                    name={`q:${q.id}`}
                    rows={4}
                    maxLength={4000}
                    className="nb-ca-in"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
        <p className="nb-meta" style={{ margin: "16px 0 10px" }}>
          {t("beforeSend")}
        </p>
        <button type="submit" className="nb-bouton" data-plein="" data-large="">
          {t("send")}
        </button>
      </form>
    </div>
  );
}
