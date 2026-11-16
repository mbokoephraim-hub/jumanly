"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { duplicateJobAction } from "@/server/actions/hire";
import { HireIcon, type HireIconName } from "./icon";

type Mode = "orbi" | "dup" | "tpl" | "imp";

export type StartTexts = Record<
  | "title"
  | "sub"
  | "close"
  | "jobTitle"
  | "jobTitlePlaceholder"
  | "orbi"
  | "orbiSub"
  | "advised"
  | "dup"
  | "dupSub"
  | "dupEmpty"
  | "tpl"
  | "tplSub"
  | "imp"
  | "impSub"
  | "safe"
  | "cancel"
  | "go",
  string
>;

const MODES: { key: Mode; icon: HireIconName }[] = [
  { key: "orbi", icon: "orbi" },
  { key: "dup", icon: "layers" },
  { key: "tpl", icon: "book" },
  { key: "imp", icon: "file" },
];

/**
 * « Comment voulez-vous commencer ? » (`nwStart()` of the prototype): the title, four ways to
 * start (one chosen, Orbi advised), the offers to duplicate shown only for « Dupliquer », then
 * « Annuler » and « Commencer ». Nothing is published before the member validates.
 */
export function NewOfferStart({
  texts: t,
  title,
  recent,
}: {
  texts: StartTexts;
  title: string;
  recent: { id: string; title: string; department: string | null }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("orbi");
  const [name, setName] = useState(title);
  const [dup, setDup] = useState(recent[0]?.id ?? "");
  const start = () => {
    if (mode === "tpl") return router.push("/app/hire/modeles");
    const params = new URLSearchParams({ etape: "1" });
    if (name.trim()) params.set("titre", name.trim());
    params.set("depart", mode === "imp" ? "import" : "orbi");
    router.push(`/app/hire/offres/nouvelle?${params.toString()}`);
  };
  const sub = (key: Mode) =>
    key === "orbi" ? t.orbiSub : key === "dup" ? t.dupSub : key === "tpl" ? t.tplSub : t.impSub;
  return (
    <div className="overlay sov" id="ov">
      <div className="smod nwmod" role="dialog" aria-modal="true" aria-labelledby="nw-start-title">
        <div className="row">
          <span className="nwm-k">
            <HireIcon name="plus" size="s" />
          </span>
          <div style={{ marginLeft: 12 }}>
            <h3 id="nw-start-title">{t.title}</h3>
            <span className="meta">{t.sub}</span>
          </div>
          <Link
            className="round"
            style={{ marginLeft: "auto" }}
            href="/app/hire/offres"
            aria-label={t.close}
          >
            <HireIcon name="x" size="s" />
          </Link>
        </div>
        <label className="nwf" style={{ marginTop: 18 }}>
          <span>{t.jobTitle}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.jobTitlePlaceholder}
            maxLength={120}
          />
        </label>
        <div className="nwmg" role="radiogroup" aria-label={t.sub}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={mode === m.key}
              className={mode === m.key ? "nwmo on" : "nwmo"}
              onClick={() => setMode(m.key)}
            >
              <span className="nwmo-i">
                <HireIcon name={m.icon} size="s" />
              </span>
              <b>{t[m.key]}</b>
              <span className="meta">{sub(m.key)}</span>
              {m.key === "orbi" ? <em>{t.advised}</em> : null}
            </button>
          ))}
        </div>
        {mode === "dup" ? (
          <div className="nwdup" style={{ display: "grid" }}>
            {recent.length === 0 ? <p className="meta">{t.dupEmpty}</p> : null}
            {recent.map((o) => (
              <button
                key={o.id}
                type="button"
                className={dup === o.id ? "nwdo on" : "nwdo"}
                onClick={() => setDup(o.id)}
              >
                <HireIcon name="offres" size="s" />
                <b>{o.title}</b>
                <span className="meta">{o.department ?? ""}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="row" style={{ gap: 8, marginTop: 18 }}>
          <span className="meta">
            <HireIcon name="shield" size="s" /> {t.safe}
          </span>
          <Link className="btn sm ghost" style={{ marginLeft: "auto" }} href="/app/hire/offres">
            {t.cancel}
          </Link>
          {mode === "dup" ? (
            <form action={duplicateJobAction} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={dup} />
              <button type="submit" className="btn sm pri" disabled={!dup}>
                {t.go} <HireIcon name="right" size="s" />
              </button>
            </form>
          ) : (
            <button type="button" className="btn sm pri" onClick={start}>
              {t.go} <HireIcon name="right" size="s" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
