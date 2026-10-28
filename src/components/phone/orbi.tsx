"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { askOrbiAction } from "@/server/actions/orbi";
import { orbiFactAction, type OrbiFactAnswer } from "@/server/actions/feed";
import { FilAvatar } from "./fil/avatar";
import { rhOrbiFactAction } from "@/server/actions/phone-rh-orbi";
import { ORBI_ASK_EVENT, ORBI_EVENT, type OrbiFact, type RhOrbiFact } from "./orbi-bus";
import { orbiActions, type OrbiReply } from "@/lib/orbi";
import { keepsBar, rootTab, tabOf, type PhoneTab, type TabSetName } from "@/lib/phone-tabs";
import { OrbiDisc, PhoneIcon } from "./icon";
import { PhoneSheet } from "./sheet";

export type OrbiTabTexts = {
  /** The question the bubble beside the disc offers (none on some tabs). */
  bubble?: string;
  /** « Orbi · depuis le Fil ». */
  from: string;
  /** The four questions of the sheet. */
  questions: string[];
};

export type OrbiTexts = {
  open: string;
  hello: string;
  title: string;
  close: string;
  back: string;
  placeholder: string;
  input: string;
  send: string;
  thinking: string;
  decide: string;
  failed: string;
  invalid: string;
  limits: Record<NonNullable<OrbiReply["limit"]>, string>;
  limitLinks: { consent: string; plans: string };
  actions: Record<string, string>;
  tabs: Partial<Record<PhoneTab, OrbiTabTexts>>;
  /** « Ouvrir la conversation complète » (the recruiter's page Orbi, planche 184). */
  full?: string;
};

type Answer = {
  question: string;
  reply: OrbiReply | null;
  error: string | null;
  /** An answer built from the platform's facts (the Fil, lot B3). */
  fact?: OrbiFactAnswer | null;
};

/** The four questions of the Fil answered from facts, in the order of the sheet. */
const FIL_FACTS: OrbiFact[] = ["digest", "entreprises", "suivre", "ecrire"];
/** The four questions of Messages, answered from the person's conversations (lot B8). */
const MESSAGE_FACTS: OrbiFact[] = ["nonlus", "prioritaire", "recruteur", "relire"];
/** The recruiter's questions answered from the organization's facts (lot M7), by tab and rank. */
const RH_FACTS: Partial<Record<PhoneTab, (RhOrbiFact | null)[]>> = {
  candidatures: ["first"],
  talents: ["propose"],
  messages: ["waiting", "unread"],
};

/**
 * Orbi everywhere (brief § 3, planche Identité): the mint disc at the bottom right of each tab,
 * with a bubble that offers a question suited to the tab. A touch opens the sheet: four suggested
 * questions and « Écrire à Orbi ». The answer comes from Orbi (consent, right and credits checked
 * on the server); Orbi proposes pages, the person decides.
 */
export function PhoneOrbi({
  texts,
  set = "talent",
  hrefs = orbiActions,
  limitHrefs = { consent: "/app/parametres/confidentialite", plans: "/app/abonnement" },
}: {
  texts: OrbiTexts;
  set?: TabSetName;
  /** The pages Orbi may propose, by key (the talent's, or the recruiter's). */
  hrefs?: Record<string, string>;
  limitHrefs?: { consent: string; plans: string };
}) {
  const pathname = usePathname();
  const root = rootTab(pathname, set);
  // The pages of a company or a person keep Orbi, without the bubble (planches Entreprise, Personne).
  const above = root === null && keepsBar(pathname, set);
  const tab = root ?? (above ? tabOf(pathname, set) : null);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const conversation = useRef<string | undefined>(undefined);
  const [shownTab, setShownTab] = useState<PhoneTab>(tab ?? "fil");
  const router = useRouter();
  const asked = useSearchParams().get("orbi") === "1";

  // `?orbi=1` (the former page Orbi, a link of an e-mail): the sheet opens, the address is cleaned.
  useEffect(() => {
    if (!asked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("orbi");
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [asked, router]);

  // The sheet speaks for the tab it was opened from.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    if (tab) setShownTab(tab);
  }, [tab]);
  const current = texts.tabs[shownTab] ?? { from: texts.title, questions: [] };

  const ask = (question: string) => {
    const clean = question.trim();
    if (clean.length < 2) {
      setAnswer({ question: clean, reply: null, error: texts.invalid });
      return;
    }
    setAnswer({ question: clean, reply: null, error: null });
    setText("");
    start(async () => {
      const result = await askOrbiAction({ text: clean, conversationId: conversation.current });
      if (!result.ok) {
        setAnswer({ question: clean, reply: null, error: texts.failed });
        return;
      }
      conversation.current = result.conversationId;
      setAnswer({ question: clean, reply: result.answer, error: null });
    });
  };

  const askFact = (fact: OrbiFact | { rh: RhOrbiFact }, question: string) => {
    setOpen(true);
    setAnswer({ question, reply: null, error: null, fact: null });
    start(async () => {
      const result = await (
        typeof fact === "string" ? orbiFactAction(fact) : rhOrbiFactAction(fact.rh)
      ).catch(() => null);
      setAnswer(
        result
          ? { question: result.question, reply: null, error: null, fact: result }
          : { question, reply: null, error: texts.failed },
      );
    });
  };

  /** A question of the sheet: from the facts on the Fil, from Orbi's conversation elsewhere. */
  const choose = (question: string) => {
    const index = current.questions.indexOf(question);
    // The recruiter's questions: from the organization's facts when there are some, otherwise to
    // Orbi's conversation (organization's credits).
    if (set === "recruteur") {
      const fact = index >= 0 ? RH_FACTS[shownTab]?.[index] : null;
      if (fact) askFact({ rh: fact }, question);
      else ask(question);
    } else if (shownTab === "fil" && index >= 0) askFact(FIL_FACTS[index], question);
    // « Pourquoi ce cours pour mon Cap ? » of Formation: from the facts too (lot B7).
    else if (shownTab === "formation" && index === 0) askFact("cours", question);
    else if (shownTab === "messages" && index >= 0) askFact(MESSAGE_FACTS[index], question);
    else ask(question);
  };

  const openWith = (question?: string) => {
    setOpen(true);
    if (question) choose(question);
  };

  // « 3 offres publiées ce matin vous correspondent » and other cards of the pages.
  useEffect(() => {
    const listen = (event: Event) => {
      const fact = (event as CustomEvent<OrbiFact>).detail;
      askFact(fact, "");
    };
    const listenQuestion = (event: Event) => {
      setOpen(true);
      ask((event as CustomEvent<string>).detail);
    };
    window.addEventListener(ORBI_EVENT, listen);
    window.addEventListener(ORBI_ASK_EVENT, listenQuestion);
    return () => {
      window.removeEventListener(ORBI_EVENT, listen);
      window.removeEventListener(ORBI_ASK_EVENT, listenQuestion);
    };
  });

  return (
    <>
      <div className="nb-orbi-fab" hidden={tab === null} data-dessus={above ? "" : undefined}>
        {current.bubble && !above ? (
          <button type="button" className="nb-orbi-bulle" onClick={() => openWith(current.bubble)}>
            {current.bubble}
          </button>
        ) : null}
        <button
          type="button"
          className="nb-orbi-disque"
          data-orbi=""
          aria-label={texts.open}
          aria-haspopup="dialog"
          onClick={() => openWith()}
        >
          <OrbiDisc />
        </button>
      </div>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={texts.title}
        closeLabel={texts.close}
      >
        <div className="nb-orbi-tete">
          {answer ? (
            <button
              type="button"
              className="nb-retour"
              aria-label={texts.back}
              data-retour=""
              onClick={() => setAnswer(null)}
            >
              <PhoneIcon name="retour" size={20} stroke={2} />
            </button>
          ) : null}
          <OrbiDisc size={42} />
          <span className="nb-orbi-titre">
            <b>{answer ? texts.title : texts.hello}</b>
            <span className="nb-meta">{current.from}</span>
          </span>
          <button
            type="button"
            className="nb-rond nb-fermer"
            aria-label={texts.close}
            onClick={() => setOpen(false)}
          >
            <PhoneIcon name="fermer" size={20} />
          </button>
        </div>
        {answer ? (
          <div className="nb-orbi-rep" aria-live="polite">
            <p className="nb-meta">{answer.question}</p>
            {answer.error ? (
              <p className="nb-orbi-texte">{answer.error}</p>
            ) : answer.fact ? (
              <>
                <p className="nb-orbi-texte">{answer.fact.text}</p>
                {answer.fact.cards.length > 0 ? (
                  <div className="nb-orbi-liste">
                    {answer.fact.cards.map((card) => (
                      <Link
                        key={card.href + card.title}
                        href={card.href}
                        className="nb-orbi-lien nb-orbi-fiche"
                        onClick={() => setOpen(false)}
                      >
                        <FilAvatar
                          initials={card.initials}
                          image={card.image}
                          tone={card.tone}
                          org={card.org}
                          size={40}
                        />
                        <span>
                          <b>{card.title}</b>
                          <small>{card.sub}</small>
                        </span>
                        <PhoneIcon name="chevron" size={18} />
                      </Link>
                    ))}
                  </div>
                ) : null}
                {answer.fact.action ? (
                  <Link
                    href={answer.fact.action.href}
                    className="nb-q nb-orbi-action"
                    data-plein=""
                    onClick={() => setOpen(false)}
                  >
                    {answer.fact.action.label}
                  </Link>
                ) : null}
                <p className="nb-meta nb-orbi-decide">{texts.decide}</p>
              </>
            ) : answer.reply ? (
              <>
                <div className="nb-orbi-texte">
                  {answer.reply.text.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {answer.reply.limit ? (
                  <p className="nb-meta nb-orbi-limite">
                    {texts.limits[answer.reply.limit]}{" "}
                    <Link
                      href={
                        answer.reply.limit === "consent" ? limitHrefs.consent : limitHrefs.plans
                      }
                      onClick={() => setOpen(false)}
                    >
                      {answer.reply.limit === "consent"
                        ? texts.limitLinks.consent
                        : texts.limitLinks.plans}
                    </Link>
                  </p>
                ) : null}
                {answer.reply.actions.length > 0 ? (
                  <div className="nb-orbi-liste">
                    {answer.reply.actions
                      .filter((key) => key in hrefs)
                      .map((key) => (
                        <Link
                          key={key}
                          href={hrefs[key]}
                          className="nb-orbi-lien"
                          onClick={() => setOpen(false)}
                        >
                          <span>{texts.actions[key] ?? key}</span>
                          <PhoneIcon name="chevron" size={18} />
                        </Link>
                      ))}
                  </div>
                ) : null}
                <p className="nb-meta nb-orbi-decide">{texts.decide}</p>
              </>
            ) : (
              <p className="nb-pense" role="status" aria-label={texts.thinking}>
                <i />
                <i />
                <i />
              </p>
            )}
          </div>
        ) : (
          <div className="nb-orbi-liste nb-orbi-q">
            {current.questions.map((question) => (
              <button
                key={question}
                type="button"
                className="nb-q"
                onClick={() => choose(question)}
              >
                {question}
              </button>
            ))}
          </div>
        )}
        {texts.full ? (
          <Link href="/app/orbi" className="nb-orbi-complet" onClick={() => setOpen(false)}>
            {texts.full}
          </Link>
        ) : null}
        <form
          className="nb-champ nb-orbi-champ"
          onSubmit={(event) => {
            event.preventDefault();
            ask(text);
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label={texts.input}
            placeholder={texts.placeholder}
            maxLength={1000}
          />
          <button type="submit" className="nb-env" disabled={pending}>
            {texts.send}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}
