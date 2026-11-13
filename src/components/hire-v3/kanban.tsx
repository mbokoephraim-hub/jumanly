"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { moveCandidateV3Action } from "@/server/actions/hire-v3-candidates";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon } from "./icon";

export type KanbanCard = {
  id: string;
  name: string;
  role: string | null;
  score: number;
  scored: boolean;
  skill: string | null;
  stageId: string;
};
export type KanbanColumn = { id: string; name: string; kind: string; colour: [string, string] };

const CLS_COLOUR = { fort: "#2FA25A", cons: "#D9901A", lim: "#8C9AB8" } as const;
export const clsOf = (score: number) => (score >= 75 ? "fort" : score >= 50 ? "cons" : "lim");

/** The ten bars of a score (`gauge()` of the prototype). */
export function Gauge({ score }: { score: number }) {
  const colour = CLS_COLOUR[clsOf(score)];
  const n = Math.round(score / 10);
  return (
    <span className="gz">
      {Array.from({ length: 10 }, (_, i) => (
        <i key={i} style={i < n ? { background: colour, opacity: 0.45 + i * 0.055 } : undefined} />
      ))}
    </span>
  );
}

/**
 * The pipeline of an offer (`kanban()` of the prototype v3): one column per stage, the cards by
 * score, a card dragged onto a column or « Étape suivante » moves the candidate (the team's
 * gesture). A drop on « Recruté » opens the decision screen instead.
 */
export function HireKanban({
  columns,
  cards,
  canMove,
}: {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  canMove: boolean;
}) {
  const t = useTranslations("hireV3Candidates");
  const router = useRouter();
  const [list, setList] = useState(cards);
  const [over, setOver] = useState<string | null>(null);
  const [, start] = useTransition();
  const move = (card: KanbanCard, stageId: string) => {
    if (card.stageId === stageId) return;
    const column = columns.find((c) => c.id === stageId);
    if (column?.kind === "hired") {
      router.push(`/app/hire/candidats/${card.id}/decision`);
      return;
    }
    const before = list;
    setList(list.map((c) => (c.id === card.id ? { ...c, stageId } : c)));
    start(async () => {
      const result = await moveCandidateV3Action({ applicationId: card.id, stageId }).catch(
        () => null,
      );
      if (!result || !result.ok) {
        setList(before);
        if (result && !result.ok && result.error === "decision")
          router.push(`/app/hire/candidats/${card.id}/decision`);
        else showToast({ message: t("moveFailed"), tone: "error" });
        return;
      }
      showToast({
        message: t("moved", { name: card.name, stage: column?.name ?? "" }),
        tone: "success",
      });
      router.refresh();
    });
  };
  return (
    <div className="kanban kb2">
      {columns.map((column, index) => {
        const inColumn = list.filter((c) => c.stageId === column.id);
        const position = (card: KanbanCard) => columns.findIndex((c) => c.id === card.stageId);
        const base = list.filter((c) => position(c) >= index).length;
        const next = list.filter((c) => position(c) > index).length;
        const following = columns[index + 1];
        return (
          <div
            key={column.id}
            className={over === column.id ? "col over" : "col"}
            data-col={column.kind}
            style={{ "--c": column.colour[0], "--b": column.colour[1] } as React.CSSProperties}
            onDragOver={(event) => {
              if (!canMove) return;
              event.preventDefault();
              setOver(column.id);
            }}
            onDragLeave={() => setOver((value) => (value === column.id ? null : value))}
            onDrop={(event) => {
              event.preventDefault();
              setOver(null);
              const card = list.find((c) => c.id === event.dataTransfer.getData("text/plain"));
              if (card) move(card, column.id);
            }}
          >
            <div className="colh">
              <i className="cd" />
              <b>{column.name}</b>
              <span className="n">{inColumn.length}</span>
            </div>
            {following ? (
              <span className="conv" title={t("conversion")}>
                {t("rate", { value: Math.round((next / (base || 1)) * 100) })}
              </span>
            ) : null}
            <div className="sc">
              <div className="sc-in">
                <div className="stack" style={{ gap: 8, paddingBottom: 10, minHeight: "100%" }}>
                  {inColumn.map((card) => {
                    const k = clsOf(card.score);
                    return (
                      <div
                        key={card.id}
                        className={`kc k2 ${k}`}
                        draggable={canMove}
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)}
                      >
                        <Link
                          href={`/app/hire/candidats/${card.id}`}
                          className="row"
                          style={{ gap: 10 }}
                        >
                          <span className={`av ${avatarColor(card.name)}`} aria-hidden="true">
                            {initialsOf(card.name)}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <b className="tr" style={{ display: "block", fontSize: 13.5 }}>
                              {card.name}
                            </b>
                            {card.role ? <div className="meta tr">{card.role}</div> : null}
                          </div>
                        </Link>
                        <div className="kmatch">
                          <b className="num">
                            {card.scored ? card.score : "–"}
                            <small>{t("percent")}</small>
                          </b>
                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <Gauge score={card.score} />
                            <span className={`cm ${k}`}>
                              {k === "fort" ? <HireIcon name="spark2" size="s" /> : null}
                              {t(`cls.${k}`)}
                            </span>
                          </div>
                        </div>
                        <div className="row" style={{ gap: 6, flexWrap: "nowrap", minWidth: 0 }}>
                          {card.skill ? <span className="tag">{card.skill}</span> : null}
                          <span className="ktest no">
                            <HireIcon name="tests" size="s" />
                            {t("toTest")}
                          </span>
                          {canMove && following ? (
                            <button
                              type="button"
                              className="nx"
                              aria-label={t("next", { name: card.name })}
                              onClick={() => move(card, following.id)}
                            >
                              <HireIcon name="right" size="s" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {canMove ? (
                    <div className="drop-z">
                      <HireIcon name="grip" size="s" />
                      <span>{t("drop")}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
