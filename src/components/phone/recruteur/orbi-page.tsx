"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { OrbiReply } from "@/lib/orbi";
import { askOrbiAction } from "@/server/actions/orbi";
import type { OrbiFactAnswer } from "@/server/actions/feed";
import { rhOrbiFactAction } from "@/server/actions/phone-rh-orbi";
import { PhoneBack } from "../back";
import type { RhOrbiFact } from "../orbi-bus";
import { OrbiDisc } from "../icon";

export type RhOrbiPageTexts = {
  back: string;
  title: string;
  line: string;
  clear: string;
  clearLabel: string;
  hello: string;
  alsoAsk: string;
  input: string;
  placeholder: string;
  send: string;
  thinking: string;
  failed: string;
  invalid: string;
  decide: string;
  limits: Record<NonNullable<OrbiReply["limit"]>, string>;
  limitLink: string;
  actions: Record<string, string>;
  /** The four questions and the fact that answers each (planche 184). */
  questions: { text: string; fact: RhOrbiFact }[];
};

type Exchange = {
  id: number;
  question: string;
  fact?: OrbiFactAnswer;
  reply?: OrbiReply;
  error?: string;
};

/**
 * Orbi's page for the recruiter (planche 184): back, Orbi and the organization's credits,
 * « Effacer »; the exchange, Orbi's answers with their pages as lime buttons and « Orbi recommande,
 * vous décidez. »; « Vous pouvez aussi demander » and the field. The questions of the chips are
 * answered from the organization's facts, what is written goes to Orbi's conversation.
 */
export function RhOrbiPage({
  texts,
  hrefs,
  question,
}: {
  texts: RhOrbiPageTexts;
  hrefs: Record<string, string>;
  /** `?q=`: sent at once, as if typed. */
  question?: string;
}) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const conversation = useRef<string | undefined>(undefined);
  const next = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const settle = (id: number, patch: Partial<Exchange>) =>
    setExchanges((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const ask = (raw: string) => {
    const clean = raw.trim();
    const id = (next.current += 1);
    if (clean.length < 2) {
      setExchanges((list) => [...list, { id, question: clean, error: texts.invalid }]);
      return;
    }
    setText("");
    setExchanges((list) => [...list, { id, question: clean }]);
    start(async () => {
      const result = await askOrbiAction({ text: clean, conversationId: conversation.current });
      if (!result.ok) return settle(id, { error: texts.failed });
      conversation.current = result.conversationId;
      settle(id, { reply: result.answer });
    });
  };

  const askFact = (fact: RhOrbiFact, label: string) => {
    const id = (next.current += 1);
    setExchanges((list) => [...list, { id, question: label }]);
    start(async () => {
      const result = await rhOrbiFactAction(fact).catch(() => null);
      settle(id, result ? { fact: result } : { error: texts.failed });
    });
  };

  const asked = useRef(false);
  useEffect(() => {
    if (!question || asked.current) return;
    asked.current = true;
    ask(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, from the address
  }, [question]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [exchanges]);

  const askedQuestions = new Set(exchanges.map((item) => item.question));
  const others = texts.questions.filter((item) => !askedQuestions.has(item.text));

  return (
    <div className="nb-page nb-ro">
      <header className="nb-ro-barre">
        <PhoneBack fallback="/app/hire" label={texts.back} />
        <OrbiDisc size={44} />
        <span className="nb-ro-qui">
          <h1>{texts.title}</h1>
          <span>{texts.line}</span>
        </span>
        <button
          type="button"
          className="nb-ro-effacer"
          aria-label={texts.clearLabel}
          disabled={exchanges.length === 0}
          onClick={() => {
            setExchanges([]);
            conversation.current = undefined;
          }}
        >
          {texts.clear}
        </button>
      </header>
      <div className="nb-ro-corps" aria-live="polite">
        {exchanges.length === 0 ? <p className="nb-ro-orbi">{texts.hello}</p> : null}
        {exchanges.map((item) => (
          <div key={item.id} className="nb-ro-echange">
            {item.question ? <p className="nb-ro-moi">{item.question}</p> : null}
            {item.error ? (
              <div className="nb-ro-orbi">
                <p>{item.error}</p>
              </div>
            ) : item.fact ? (
              <div className="nb-ro-orbi">
                <p>{item.fact.text}</p>
                {item.fact.cards.length > 0 ? (
                  <ul className="nb-ro-fiches">
                    {item.fact.cards.map((card) => (
                      <li key={card.href}>
                        <Link href={card.href} className="nb-ro-fiche">
                          <b>{card.title}</b>
                          {card.sub ? <small>{card.sub}</small> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.fact.action ? (
                  <Link href={item.fact.action.href} className="nb-ro-action">
                    {item.fact.action.label}
                  </Link>
                ) : null}
                <small className="nb-ro-decide">{texts.decide}</small>
              </div>
            ) : item.reply ? (
              <div className="nb-ro-orbi">
                {item.reply.text.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {item.reply.limit ? (
                  <p className="nb-ro-limite">
                    {texts.limits[item.reply.limit]}{" "}
                    {item.reply.limit === "entitlement" || item.reply.limit === "quota" ? (
                      <Link href="/app/hire/compte">{texts.limitLink}</Link>
                    ) : null}
                  </p>
                ) : null}
                {item.reply.actions
                  .filter((key) => key in hrefs)
                  .map((key) => (
                    <Link key={key} href={hrefs[key]} className="nb-ro-action">
                      {texts.actions[key] ?? key}
                    </Link>
                  ))}
                <small className="nb-ro-decide">{texts.decide}</small>
              </div>
            ) : (
              <p className="nb-pense nb-ro-pense" role="status" aria-label={texts.thinking}>
                <i />
                <i />
                <i />
              </p>
            )}
          </div>
        ))}
        {others.length > 0 ? (
          <section className="nb-ro-aussi" aria-labelledby="ro-aussi">
            <h2 id="ro-aussi">{texts.alsoAsk}</h2>
            {others.map((item) => (
              <button
                key={item.fact}
                type="button"
                className="nb-ro-q"
                disabled={pending}
                onClick={() => askFact(item.fact, item.text)}
              >
                {item.text}
              </button>
            ))}
          </section>
        ) : null}
        <div ref={end} />
      </div>
      <form
        className="nb-ro-pied"
        onSubmit={(event) => {
          event.preventDefault();
          ask(text);
        }}
      >
        <span className="nb-ro-saisie">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label={texts.input}
            placeholder={texts.placeholder}
            maxLength={1000}
          />
          <button type="submit" disabled={pending}>
            {texts.send}
          </button>
        </span>
      </form>
    </div>
  );
}
