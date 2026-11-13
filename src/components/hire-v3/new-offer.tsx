import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { duplicateJobAction } from "@/server/actions/hire";
import { saveOfferV3Action } from "@/server/actions/hire-v3-offers";
import type { NewOfferData } from "@/server/services/hire-v3-offer";
import { contractTypes, remoteModes } from "@/server/services/hire";
import { experienceBands, OPENINGS_MAX, SCREENING_MAX } from "@/server/services/hire-offers";
import { screeningQuestionsOf } from "@/server/services/screening";
import { siteUrl } from "@/lib/seo";
import { studyFields } from "@/lib/studies";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon, type HireIconName } from "./icon";
import {
  NwChips,
  NwNum,
  NwOpts,
  NwOrbiDraft,
  NwQuestions,
  NwSeg,
  NwSkills,
  NwSwitch,
} from "./new-offer-fields";
import { HirePage, HirePageHead } from "./page-head";
import { HireShareButton } from "./share-button";

/**
 * « Nouvelle offre » of the web app v3 (`V.nouvelle`, `nwStart` and `nwSide` of the prototype v3):
 * the window to start, then seven steps saved as a draft one by one, the candidate's preview on
 * the side. Nothing is published before « Publier l'offre ».
 */
export async function HireV3NewOffer({
  data,
  step,
  start,
  query,
}: {
  data: NewOfferData;
  step: number;
  start: boolean;
  query: Record<string, string | undefined>;
}) {
  const t = await getTranslations("hireV3New");
  const to = await getTranslations("hireV3Offers");
  const tc = await getTranslations("hireV3Offer");
  const tf = await getTranslations("hireOffers.form");
  const tg = await getTranslations();
  const format = await getFormatter();
  const { job } = data;
  const title = job?.title ?? query.titre?.slice(0, 120) ?? "";
  const stepName = (k: number) => t(`steps.${k}` as "steps.1");
  const error = query.erreur
    ? tf(`error.${query.erreur}` as "error.invalid", { skills: query.inconnues ?? "" })
    : null;
  const questions = job ? screeningQuestionsOf(job.screeningQuestions) : [];
  const place = job ? `${job.city} · ${to(`remote.${job.remote}`)}` : "";
  const day = (date: Date) => format.dateTime(date, { day: "numeric", month: "long" });

  const stepper = (
    <div className="nwst">
      {[1, 2, 3, 4, 5, 6, 7].map((k) => {
        const cls = k < step ? "nwsp done" : k === step ? "nwsp on" : "nwsp";
        const inner = (
          <>
            <span>{k < step ? <HireIcon name="check" size="s" /> : k}</span>
            <b>{stepName(k)}</b>
          </>
        );
        return (
          <span key={k} style={{ display: "contents" }}>
            {k > 1 ? <i className="nwsl" /> : null}
            {job ? (
              <button
                type="submit"
                form="nw-form"
                name="next"
                value={`go:${k}`}
                formNoValidate
                className={cls}
                aria-current={k === step ? "step" : undefined}
              >
                {inner}
              </button>
            ) : (
              <span className={cls} aria-current={k === step ? "step" : undefined}>
                {inner}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );

  let body: React.ReactNode = null;
  if (step === 1)
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("p.title")}</h3>
          <span className="meta">{t("p.sub")}</span>
        </div>
        <div className="nwgrid">
          <label className="nwf full">
            <span>{t("p.jobTitle")}</span>
            <input name="title" defaultValue={title} required minLength={3} maxLength={120} />
          </label>
          <label className="nwf">
            <span>{t("p.domain")}</span>
            <span className="nwin">
              <HireIcon name="layers" size="s" />
              <select
                name="domain"
                defaultValue={job?.domain ?? ""}
                style={{
                  flex: 1,
                  border: 0,
                  background: "none",
                  font: "inherit",
                  color: "var(--ink)",
                  outline: 0,
                }}
              >
                <option value="">{t("p.domainNone")}</option>
                {studyFields.map((field) => (
                  <option key={field} value={field}>
                    {tg(`access.onboarding.studies.field.${field}`)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="nwf">
            <span>{t("p.experience")}</span>
            <NwChips
              name="experienceMin"
              options={experienceBands.map((years) => [
                String(years),
                tf("experienceBand", { years }),
              ])}
              value={[String(job?.experienceMin ?? 0)]}
            />
          </div>
          <label className="nwf">
            <span>{t("p.city")}</span>
            <span className="nwin">
              <HireIcon name="pin" size="s" />
              <input name="city" defaultValue={job?.city ?? ""} required maxLength={120} />
            </span>
          </label>
          <label className="nwf">
            <span>{t("p.country")}</span>
            <span className="nwin">
              <HireIcon name="globe" size="s" />
              <input name="country" defaultValue={job?.country ?? ""} required maxLength={80} />
            </span>
          </label>
          <div className="nwf">
            <span>{t("p.remote")}</span>
            <NwSeg
              name="remote"
              options={remoteModes.map((mode) => [mode, to(`remote.${mode}`)])}
              value={job?.remote ?? "hybrid"}
            />
          </div>
          <div className="nwf">
            <span>{t("p.contract")}</span>
            <NwChips
              name="contractType"
              options={contractTypes.map((type) => [type, to(`contract.${type}`)])}
              value={[job?.contractType ?? "cdi"]}
            />
          </div>
          <div className="nwf">
            <span>{t("p.openings")}</span>
            <NwNum
              name="openings"
              value={job?.openings ?? 1}
              max={OPENINGS_MAX}
              less={t("p.less")}
              more={t("p.more")}
              minus={tf("openingsMinusSign")}
              plus={tf("openingsPlusSign")}
            />
          </div>
          <label className="nwf">
            <span>
              {t("p.deadline")}
              <em>{t("p.deadlineHint")}</em>
            </span>
            <span className="nwin">
              <HireIcon name="cal" size="s" />
              <input
                type="date"
                name="closesAt"
                defaultValue={job?.closesAt ? job.closesAt.toISOString().slice(0, 10) : ""}
              />
            </span>
          </label>
          <div className="nwf full">
            <span>
              {t("p.salary")}
              <em>{t("p.salaryHint")}</em>
            </span>
            <div className="row" style={{ gap: 10 }}>
              <span className="nwin" style={{ flex: 1 }}>
                <HireIcon name="card" size="s" />
                <input
                  name="salaryMin"
                  inputMode="numeric"
                  aria-label={t("p.salaryMin")}
                  placeholder={t("p.salaryMin")}
                  defaultValue={job?.salaryMin ? Math.round(job.salaryMin / 100) : ""}
                />
              </span>
              <span className="nwin" style={{ flex: 1 }}>
                <input
                  name="salaryMax"
                  inputMode="numeric"
                  aria-label={t("p.salaryMax")}
                  placeholder={t("p.salaryMax")}
                  defaultValue={job?.salaryMax ? Math.round(job.salaryMax / 100) : ""}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    );

  if (step === 2 && job) {
    const blocks: { name: string; label: string; hint?: string; value: string; rows: number }[] = [
      { name: "description", label: t("a.description"), value: job.description, rows: 3 },
      {
        name: "responsibilities",
        label: t("a.missions"),
        hint: t("a.missionsHint"),
        value: job.responsibilities.join("\n"),
        rows: 5,
      },
      {
        name: "requirements",
        label: t("a.profile"),
        hint: t("a.profileHint"),
        value: job.requirements.join("\n"),
        rows: 3,
      },
      {
        name: "benefits",
        label: t("a.offer"),
        hint: t("a.offerHint"),
        value: job.benefits.join("\n"),
        rows: 3,
      },
    ];
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("a.title")}</h3>
          <span className="nwok">
            <HireIcon name="orbi" size="s" />
            {t("a.orbiReady")}
          </span>
        </div>
        <div className="nwtools">
          <NwOrbiDraft
            facts={{
              title: job.title,
              contract: to(`contract.${job.contractType}`),
              workMode: to(`remote.${job.remote}`),
              city: job.city,
              country: job.country,
            }}
            labels={{ write: t("a.write"), working: t("a.working"), failed: t("a.failed") }}
          />
        </div>
        {blocks.map((b) => (
          <div key={b.name} className="nwblk">
            <div className="nwblk-h">
              <label htmlFor={`nw-${b.name}`}>
                <b>{b.label}</b>
                {b.hint ? <span className="meta"> · {b.hint}</span> : null}
              </label>
            </div>
            <textarea
              id={`nw-${b.name}`}
              className="nwed"
              name={b.name}
              defaultValue={b.value}
              rows={b.rows}
              placeholder={b.name === "description" ? t("a.descriptionPlaceholder") : undefined}
            />
          </div>
        ))}
        {data.org.description ? (
          <div className="nwblk nwfrom">
            <div className="nwblk-h">
              <b>{t("a.about", { org: data.org.name })}</b>
              <span className="tsst dr">{t("a.fromPage")}</span>
            </div>
            <div className="nwed">{data.org.description}</div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 3 && job) {
    const total = data.weights.reduce((sum, w) => sum + w.share, 0);
    const COLOURS = [
      "#2FA25A",
      "#4C8DF6",
      "#8B6CF0",
      "#F2994A",
      "#D9A514",
      "#3DBE6E",
      "#0F3F37",
      "#A6F26B",
    ];
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("c.skills")}</h3>
          <span className="meta">{t("c.skillsSub")}</span>
        </div>
        <NwSkills
          required={job.skills.filter((s) => s.importance === "required").map((s) => s.skill.name)}
          preferred={job.skills
            .filter((s) => s.importance === "preferred")
            .map((s) => s.skill.name)}
          labels={{
            required: t("c.required"),
            preferred: t("c.preferred"),
            remove: t("c.remove"),
            add: t("c.add"),
            placeholder: t("c.addPlaceholder"),
          }}
        />
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("c.weights")}</h3>
          <span className="meta">{t("c.weightsTotal", { value: total })}</span>
        </div>
        <div className="nwws">
          {data.weights.map((w, i) => (
            <div
              key={w.key}
              className="nwwr"
              style={{ "--c": COLOURS[i % COLOURS.length] } as React.CSSProperties}
            >
              <span>
                <i />
                {tc(`criterion.${w.key}` as "criterion.experience")}
              </span>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={w.share}
                readOnly
                disabled
                aria-label={tc(`criterion.${w.key}` as "criterion.experience")}
                style={{ "--p": `${(w.share / 60) * 100}%` } as React.CSSProperties}
              />
              <b className="num">{tc("ad.weight", { value: w.share })}</b>
            </div>
          ))}
        </div>
        <p className="meta" style={{ margin: "8px 0 0" }}>
          {data.weightsEditable ? (
            <Link className="lnk" href={`/app/hire/offres/${job.id}/poids`}>
              {t("c.weightsEdit")}
            </Link>
          ) : (
            t("c.weightsLocked")
          )}
        </p>
        <div className="nwnever">
          <HireIcon name="shield" size="s" />
          <div>
            <b>{t("c.never")}</b>
            <span>{t("c.neverText")}</span>
          </div>
        </div>
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("c.questions")}</h3>
        </div>
        <NwQuestions
          questions={questions}
          max={SCREENING_MAX}
          labels={{
            add: t("c.add"),
            placeholder: t("c.questionPlaceholder"),
            remove: t("c.remove"),
            yesno: t("c.yesno"),
            text: t("c.text"),
          }}
        />
        <p className="meta" style={{ margin: "8px 0 0" }}>
          {t("c.questionsNote")}
        </p>
      </div>
    );
  }

  if (step === 4 && job) {
    const docs = new Set(job.requestedDocuments);
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("f.title")}</h3>
          <span className="meta">{t("f.sub")}</span>
        </div>
        {(["cv", "letter", "diploma", "portfolio"] as const).map((doc) => (
          <div key={doc} className="nwrow">
            <div>
              <b>{t(`f.${doc}`)}</b>
              <span className="meta">{t(`f.${doc}Sub`)}</span>
            </div>
            <NwSwitch name="documents" value={doc} on={docs.has(doc)} label={t(`f.${doc}`)} />
          </div>
        ))}
        <div className="nwrow">
          <div>
            <b>{t("f.questions")}</b>
            <span className="meta">{t("f.questionsSub", { count: questions.length })}</span>
          </div>
          <span className="tsst live" style={{ marginLeft: "auto" }}>
            <i />
            {t("f.always")}
          </span>
        </div>
        <label className="nwf full" style={{ marginTop: 14 }}>
          <span>
            {t("f.instructions")}
            <em>{t("f.instructionsHint")}</em>
          </span>
          <textarea
            className="nwed"
            name="instructions"
            rows={3}
            maxLength={1000}
            defaultValue={job.applicationInstructions ?? ""}
            style={{ border: "1px solid #1E3D35", borderRadius: 14, padding: "10px 14px" }}
          />
        </label>
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("f.tests")}</h3>
        </div>
        <p className="meta" style={{ margin: 0 }}>
          {t("f.testsSoon")}
        </p>
      </div>
    );
  }

  if (step === 5 && job) {
    const P = ["#4C8DF6", "#8B6CF0", "#D9A514", "#F2994A", "#2FA25A", "#0F3F37", "#8C9AB8"];
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("t.stages")}</h3>
          <span className="meta">{t("t.stagesSub")}</span>
        </div>
        <div className="nwpipe">
          {data.stages.map((stage, i) => (
            <div
              key={`${stage.name}-${i}`}
              className="nwpp"
              style={{ "--c": P[i % P.length] } as React.CSSProperties}
            >
              <span className="nwpp-n">{i + 1}</span>
              <b>{stage.name}</b>
            </div>
          ))}
        </div>
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("t.team")}</h3>
          <Link className="lnk" href="/app/hire/compte/equipe">
            {t("t.teamLink")}
          </Link>
        </div>
        {data.team.map((m) => (
          <div key={m.id} className="nwrow">
            <span className={`av ${avatarColor(m.name)} xs`} aria-hidden="true">
              {initialsOf(m.name)}
            </span>
            <div>
              <b>{m.name}</b>
              <span className="meta">{m.you ? t("t.you") : ""}</span>
            </div>
            <span className={m.lead ? "nwrole r" : "nwrole"}>
              {m.lead ? t("t.lead") : t("t.member")}
            </span>
          </div>
        ))}
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("t.auto")}</h3>
          <Link className="lnk" href="/app/hire/compte">
            {t("t.autoLink")}
          </Link>
        </div>
        <div className="nwrow">
          <div>
            <b>{t("t.ack")}</b>
            <span className="meta">{t("t.ackSub")}</span>
          </div>
          <span className="tsst live" style={{ marginLeft: "auto" }}>
            <i />
            {t("t.on")}
          </span>
        </div>
        <div className="nwrow">
          <div>
            <b>{t("t.reject")}</b>
            <span className="meta">{t("t.rejectSub")}</span>
          </div>
          <span className="tsst dr" style={{ marginLeft: "auto" }}>
            <HireIcon name="shield" size="s" /> {t("t.manual")}
          </span>
        </div>
      </div>
    );
  }

  if (step === 6 && job)
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("d.title")}</h3>
          <span className="meta">{t("d.sub")}</span>
        </div>
        {(
          [
            ["globe", "page"],
            ["share2", "linkedin"],
            ["chat", "whatsapp"],
            ["link", "link"],
          ] as [HireIconName, string][]
        ).map(([icon, key]) => (
          <div key={key} className="nwrow">
            <span className="nwch-i">
              <HireIcon name={icon} size="s" />
            </span>
            <div>
              <b>{t(`d.${key}` as "d.page")}</b>
              <span className="meta">{t(`d.${key}Sub` as "d.pageSub")}</span>
            </div>
            <span className="tsst dr" style={{ marginLeft: "auto" }}>
              {t("d.after")}
            </span>
          </div>
        ))}
        <div className="tsh" style={{ marginTop: 18 }}>
          <h3>{t("d.when")}</h3>
        </div>
        <NwOpts
          name="when"
          two
          value="now"
          options={[{ key: "now", icon: "send", title: t("d.now"), sub: t("d.nowSub") }]}
        />
      </div>
    );

  if (step === 7 && job) {
    const skills = job.skills.length;
    const docs = job.requestedDocuments.map((d) => tf(`document.${d}` as "document.cv")).join(", ");
    const rows: [string, string, number][] = [
      [
        stepName(1),
        t("v.poste", {
          title: job.title,
          place,
          contract: to(`contract.${job.contractType}`),
          count: job.openings,
        }),
        1,
      ],
      [
        stepName(2),
        job.description.trim()
          ? t("v.annonce", { count: job.responsibilities.length })
          : t("v.annonceEmpty"),
        2,
      ],
      [stepName(3), t("v.criteres", { skills, questions: questions.length }), 3],
      [stepName(4), docs || t("f.cv"), 4],
      [stepName(5), t("v.equipe", { count: data.stages.length }), 5],
      [stepName(6), t("v.diffusion"), 6],
    ];
    const done = 1 + rows.filter((r) => r[2] !== 2 || job.description.trim()).length;
    body = (
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("v.title")}</h3>
          <span className="nwok">
            <HireIcon name="check" size="s" />
            {t("v.ok", { done: Math.min(7, done), total: 7 })}
          </span>
        </div>
        {query.limite ? (
          <p className="meta" role="alert" style={{ color: "#C2410C" }}>
            {t("v.limit")}
          </p>
        ) : null}
        {rows.map(([label, text, k]) => (
          <div key={k} className="nwrec">
            <span className="nwck">
              <HireIcon name="check" size="s" />
            </span>
            <div>
              <b>{label}</b>
              <span className="meta">{text}</span>
            </div>
            <button
              type="submit"
              form="nw-form"
              name="next"
              value={`go:${k}`}
              className="lnk"
              formNoValidate
            >
              {t("v.edit")}
            </button>
          </div>
        ))}
        <div className="nworbi">
          <HireIcon name="orbi" size="s" />
          <div>
            <b>{t("v.orbi")}</b>
            <span>{t("v.orbiText")}</span>
          </div>
        </div>
      </div>
    );
  }

  const tip = Math.min(7, Math.max(1, step));
  const tags = job?.skills.slice(0, 3).map((s) => s.skill.name) ?? [];
  const side = (
    <div className="tsside">
      <div className="tsorbi nwtip">
        <HireIcon name="orbi" size="s" />
        <b>{t(`side.tip${tip}` as "side.tip1")}</b>
        <span>{t(`side.tip${tip}Text` as "side.tip1Text")}</span>
      </div>
      <div className="tsbox nwprev">
        <div className="tsh">
          <h3>{t("side.preview")}</h3>
          <span className="meta">{t("side.live")}</span>
        </div>
        <div className="nwpc">
          <div className="nwpc-cov">
            {job?.domain ? (
              <span className="odep">{tg(`access.onboarding.studies.field.${job.domain}`)}</span>
            ) : null}
            <span className="nwpc-l">{initialsOf(data.org.name)}</span>
          </div>
          <b>{title || t("untitled")}</b>
          {job ? (
            <span className="meta">
              <HireIcon name="pin" size="s" />
              {place} · {to(`contract.${job.contractType}`)}
            </span>
          ) : null}
          {tags.length ? (
            <div className="nwpc-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          <div className="nwpc-f">
            <span className="meta">
              {data.org.name}
              {job?.closesAt ? ` · ${t("side.closes", { date: day(job.closesAt) })}` : ""}
            </span>
            <span className="nwpc-b">{t("side.apply")}</span>
          </div>
        </div>
        <p className="meta nwfree">
          <HireIcon name="shield" size="s" />
          {t("side.free")}
        </p>
      </div>
    </div>
  );

  const foot = (
    <div className="nwfoot">
      <span className="meta">
        {job ? (
          <>
            <HireIcon name="check" size="s" /> {t("foot.saved")}
          </>
        ) : (
          t("foot.notSaved")
        )}
      </span>
      <span className="nwfs">{t("foot.step", { k: step })}</span>
      {step > 1 ? (
        <button
          type="submit"
          form="nw-form"
          name="next"
          value="back"
          className="btn sm ghost"
          formNoValidate
        >
          <HireIcon name="chev" size="s" style={{ transform: "rotate(180deg)" }} />
          {t("foot.back")}
        </button>
      ) : (
        <Link className="btn sm ghost" href="/app/hire/offres">
          {t("foot.cancel")}
        </Link>
      )}
      {step < 7 ? (
        <button type="submit" form="nw-form" name="next" value="continue" className="btn sm pri">
          {t("foot.next", { step: stepName(step + 1) })} <HireIcon name="right" size="s" />
        </button>
      ) : (
        <>
          <button type="submit" form="nw-form" name="next" value="later" className="btn sm ghost">
            {t("foot.later")}
          </button>
          <button type="submit" form="nw-form" name="next" value="publish" className="btn sm pri">
            <HireIcon name="send" size="s" />
            {t("foot.publish")}
          </button>
        </>
      )}
    </div>
  );

  return (
    <HirePage view="nouvelle">
      <HirePageHead
        title={t("title")}
        sub={t("sub", { title: title || t("untitled"), step: stepName(step) })}
        back={{ href: "/app/hire/offres", label: to("title") }}
      />
      {error ? (
        <p className="meta" role="alert" style={{ color: "#C2410C", margin: "0 0 12px" }}>
          {error}
        </p>
      ) : null}
      {stepper}
      <form id="nw-form" action={saveOfferV3Action}>
        <input type="hidden" name="step" value={step} />
        {job ? <input type="hidden" name="id" value={job.id} /> : null}
        <div className="tsgrid nwg">
          {body}
          {side}
        </div>
      </form>
      {foot}
      {start ? <StartWindow data={data} title={title} /> : null}
    </HirePage>
  );
}

/** « Comment voulez-vous commencer ? » (`nwStart`): the title, then four ways to start. */
async function StartWindow({ data, title }: { data: NewOfferData; title: string }) {
  const t = await getTranslations("hireV3New.start");
  return (
    <div className="overlay sov" id="ov">
      <div className="smod nwmod" role="dialog" aria-modal="true" aria-labelledby="nw-start-title">
        <div className="row">
          <span className="nwm-k">
            <HireIcon name="plus" size="s" />
          </span>
          <div style={{ marginLeft: 12 }}>
            <h3 id="nw-start-title">{t("title")}</h3>
            <span className="meta">{t("sub")}</span>
          </div>
          <Link
            className="round"
            style={{ marginLeft: "auto" }}
            href="/app/hire/offres"
            aria-label={t("close")}
          >
            <HireIcon name="x" size="s" />
          </Link>
        </div>
        <form action="/app/hire/offres/nouvelle" method="get">
          <input type="hidden" name="etape" value="1" />
          <label className="nwf" style={{ marginTop: 18 }}>
            <span>{t("jobTitle")}</span>
            <input
              name="titre"
              defaultValue={title}
              placeholder={t("jobTitlePlaceholder")}
              maxLength={120}
            />
          </label>
          <div className="nwmg">
            <button type="submit" name="depart" value="orbi" className="nwmo on">
              <span className="nwmo-i">
                <HireIcon name="orbi" size="s" />
              </span>
              <b>{t("orbi")}</b>
              <span className="meta">{t("orbiSub")}</span>
              <em>{t("advised")}</em>
            </button>
            <Link className="nwmo" href="#nw-dup">
              <span className="nwmo-i">
                <HireIcon name="layers" size="s" />
              </span>
              <b>{t("dup")}</b>
              <span className="meta">{t("dupSub")}</span>
            </Link>
            <Link className="nwmo" href="/app/hire/modeles">
              <span className="nwmo-i">
                <HireIcon name="book" size="s" />
              </span>
              <b>{t("tpl")}</b>
              <span className="meta">{t("tplSub")}</span>
            </Link>
            <button type="submit" name="depart" value="import" className="nwmo">
              <span className="nwmo-i">
                <HireIcon name="file" size="s" />
              </span>
              <b>{t("imp")}</b>
              <span className="meta">{t("impSub")}</span>
            </button>
          </div>
        </form>
        <div className="nwdup" id="nw-dup" style={{ display: "grid" }}>
          {data.recent.length === 0 ? <p className="meta">{t("dupEmpty")}</p> : null}
          {data.recent.map((o) => (
            <form key={o.id} action={duplicateJobAction} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={o.id} />
              <button type="submit" className="nwdo">
                <HireIcon name="offres" size="s" />
                <b>{o.title}</b>
                <span className="meta">{o.department ?? ""}</span>
              </button>
            </form>
          ))}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 18 }}>
          <span className="meta">
            <HireIcon name="shield" size="s" /> {t("safe")}
          </span>
          <Link className="btn sm ghost" style={{ marginLeft: "auto" }} href="/app/hire/offres">
            {t("cancel")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** « Offre publiée » (step 8 of `V.nouvelle`). */
export async function HireV3OfferPublished({
  job,
  review,
  orgName,
}: {
  job: { id: string; title: string; slug: string };
  review: boolean;
  orgName: string;
}) {
  const t = await getTranslations("hireV3New.done");
  const path = `/offres/${job.slug}`;
  const tc = await getTranslations("hireV3Offer.sh");
  const url = `${siteUrl()}${path}`;
  const steps: [HireIconName, string, "auto" | "vous"][] = [
    ["mail", "s1", "auto"],
    ["orbi", "s2", "auto"],
    ["users", "s3", "vous"],
    ["cal", "s4", "vous"],
    ["check", "s5", "vous"],
  ];
  return (
    <HirePage view="nouvelle">
      <HirePageHead title={review ? t("review") : t("title")} sub={`${job.title} · ${orgName}`} />
      <div className="nwdone">
        <span className="nwd-dot" />
        <span className="vh-k">
          <HireIcon name="check" size="s" />
          {review ? t("pending") : t("live")}
        </span>
        <h2>
          {review ? t("headingReview", { title: job.title }) : t("heading", { title: job.title })}
        </h2>
        <p>{t("text")}</p>
        {review ? null : (
          <>
            <div className="nwd-link">
              <span>
                <HireIcon name="link" size="s" />
                {t("url", { path })}
              </span>
              <HireShareButton path={path} label={t("copy")} done={t("copied")} wide />
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <a
                className="nwd-sh"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HireIcon name="share2" size="s" />
                {tc("linkedin")}
              </a>
              <a
                className="nwd-sh"
                href={`https://wa.me/?text=${encodeURIComponent(`${job.title} ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HireIcon name="chat" size="s" />
                {tc("whatsapp")}
              </a>
              <a
                className="nwd-sh"
                href={`mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(url)}`}
              >
                <HireIcon name="mail" size="s" />
                {t("email")}
              </a>
            </div>
          </>
        )}
      </div>
      <div className="nwnext">
        {(
          [
            ["users", "next1", "/app/hire/viviers"],
            ["cal", "next2", "/app/hire/entretiens"],
            ["eye", "next3", `/app/hire/offres/${job.id}`],
          ] as [HireIconName, string, string][]
        ).map(([icon, key, href]) => (
          <div key={key} className="tsbox nwnx">
            <span className="nwnx-i">
              <HireIcon name={icon} size="s" />
            </span>
            <b>{t(key as "next1")}</b>
            <span className="meta">{t(`${key}Sub` as "next1Sub")}</span>
            <Link className="btn sm ghost" href={href}>
              {t(`${key}Go` as "next1Go")}
            </Link>
          </div>
        ))}
      </div>
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("then")}</h3>
        </div>
        <div className="nwtl">
          {steps.map(([icon, key, who]) => (
            <div key={key} className="nwtle">
              <span className={`nwtl-i ${who}`}>
                <HireIcon name={icon} size="s" />
              </span>
              <b>{t(key as "s1")}</b>
              <span className="meta">{t(`${key}Sub` as "s1Sub")}</span>
              <em className={who}>{who === "auto" ? t("auto") : t("you")}</em>
            </div>
          ))}
        </div>
      </div>
    </HirePage>
  );
}
