import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Character, Orbi, type CharacterName, type Pose } from "@/components/brand/character";
import { Icon, type IconName } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import { entryRoles, splitHook, type EntryRole } from "@/lib/auth-entry";

/**
 * Stage of /connexion and /inscription (docs/refonte-connexion/BRIEF-CONNEXION-V2.md § 4): three
 * rotating rings with the characters, the hook bubble, the main character and three floating
 * cards. Rendered on the server for the three profiles; <AuthEntry> shows the chosen one through
 * `data-role`, so changing profile costs no request and no JavaScript beyond an attribute.
 * Decorative: the bubble's title is the only part read aloud.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

type Avatar = { name: CharacterName; pose: Pose; angle: number; size: number; bg: string };

const ring2: Avatar[] = [
  { name: "kofi", pose: "joie", angle: 300, size: 62, bg: "#E4FAD0" },
  { name: "fatou", pose: "salut", angle: 110, size: 56, bg: "#DDF6EE" },
];
const ring3: Avatar[] = [
  { name: "nadia", pose: "salut", angle: 60, size: 58, bg: "#F7E9C6" },
  { name: "diallo", pose: "joie", angle: 235, size: 66, bg: "#E9EEF0" },
  { name: "amani", pose: "salut", angle: 330, size: 50, bg: "#FDE3DC" },
];

const heroes: Record<EntryRole, { name: CharacterName; pose: Pose; bg: string }> = {
  talent: { name: "amani", pose: "joie", bg: "#E4FAD0" },
  rh: { name: "nadia", pose: "montre", bg: "#F7E9C6" },
  company: { name: "diallo", pose: "montre", bg: "#E9EEF0" },
};

type Card = { icon?: IconName; bg?: string; gauge?: boolean; pill?: boolean };
const cards: Record<EntryRole, [Card, Card, Card]> = {
  talent: [{ gauge: true }, { icon: "jobs", pill: true }, { icon: "certificat", bg: "#F1F7C9" }],
  rh: [
    { icon: "intelligence", bg: "#DDF6EE", pill: true },
    { icon: "calendrier" },
    { icon: "hire", bg: "#F1F7C9" },
  ],
  company: [
    { icon: "jobs" },
    { icon: "equipe", bg: "#DDF6EE" },
    { icon: "competence", bg: "#F1F7C9" },
  ],
};

/** The words of a text, one span each (`--i` drives the word-by-word entrance). */
export function Words({ raw, className }: { raw: string; className?: string }) {
  return splitHook(raw).map((word, index) => (
    <span key={index}>
      {index > 0 && " "}
      <span
        className={word.hl ? `${className ?? ""} jm-ae-hl` : className}
        style={{ "--i": index } as Vars}
      >
        {word.text}
      </span>
    </span>
  ));
}

function Disc({ bg, children, delay }: { bg: string; children: ReactNode; delay: number }) {
  return (
    <span className="jm-ae-disc" style={{ "--bg": bg, "--t": `${delay}s` } as Vars}>
      {children}
    </span>
  );
}

function Node({ angle, size, children }: { angle: number; size: number; children: ReactNode }) {
  return (
    <span className="jm-ae-node" style={{ "--a": `${angle}deg` } as Vars}>
      <span className="jm-ae-av" style={{ "--s": `${size}px` } as Vars}>
        {children}
      </span>
    </span>
  );
}

export async function AuthStage() {
  const t = await getTranslations("auth.stage");
  const text = dynamic(t);
  return (
    <div className="jm-ae-orbit">
      <span aria-hidden className="jm-ae-seed" />
      <span aria-hidden className="jm-ae-ring jm-ae-r1" />
      <span aria-hidden className="jm-ae-ring jm-ae-r2" />
      <span aria-hidden className="jm-ae-ring jm-ae-r3" />
      <div aria-hidden className="jm-ae-spin jm-ae-r1">
        <Node angle={200} size={14}>
          <span className="jm-ae-disc jm-ae-dot" style={{ "--t": "1s" } as Vars} />
        </Node>
        <Node angle={40} size={46}>
          <span className="jm-ae-disc jm-ae-orbi" style={{ "--t": "1.05s" } as Vars}>
            <Orbi size={46} />
          </span>
        </Node>
      </div>
      <div aria-hidden className="jm-ae-spin jm-ae-r2">
        {ring2.map((avatar, index) => (
          <Node key={avatar.name} angle={avatar.angle} size={avatar.size}>
            <Disc bg={avatar.bg} delay={0.95 + index * 0.15}>
              <Character name={avatar.name} pose={avatar.pose} height={avatar.size} />
            </Disc>
          </Node>
        ))}
        <Node angle={200} size={10}>
          <span className="jm-ae-disc jm-ae-dot" style={{ "--t": "1.2s" } as Vars} />
        </Node>
      </div>
      <div aria-hidden className="jm-ae-spin jm-ae-r3">
        {ring3.map((avatar, index) => (
          <Node key={avatar.name} angle={avatar.angle} size={avatar.size}>
            <Disc bg={avatar.bg} delay={1.15 + index * 0.05}>
              <Character name={avatar.name} pose={avatar.pose} height={avatar.size} />
            </Disc>
          </Node>
        ))}
      </div>

      <div className="jm-ae-bubble-wrap">
        <div className="jm-ae-bubble">
          {entryRoles.map((role) => (
            <div key={role} data-v={role}>
              <p className="jm-ae-eyebrow">{t(`${role}.eyebrow`)}</p>
              <h2 className="jm-ae-hook">
                <Words raw={t.raw(`${role}.hook`) as string} className="jm-ae-w" />
              </h2>
              <p className="jm-ae-sub">{t(`${role}.sub`)}</p>
              <p aria-hidden className="jm-ae-line">
                <span className="jm-ae-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>{t(`${role}.line`)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {entryRoles.map((role) => (
        <div key={role} data-v={role} aria-hidden className="contents">
          <span className="jm-ae-hero jm-ae-av" style={{ "--s": "104px" } as Vars}>
            <span className="jm-ae-disc" style={{ "--bg": heroes[role].bg } as Vars}>
              <Character name={heroes[role].name} pose={heroes[role].pose} height={104} />
            </span>
            <span className="jm-ae-badge">
              <Icon name="check" className="size-[15px]" />
            </span>
          </span>
          {cards[role].map((card, index) => {
            const key = `${role}.cards.${index + 1}` as const;
            return (
              <span
                key={index}
                className={`jm-ae-chip jm-ae-c${index + 1}`}
                style={{ "--k": index } as Vars}
              >
                {card.gauge ? (
                  <span className="jm-ae-gauge" style={{ "--v": text(`${key}.value`) } as Vars}>
                    <span>{text(`${key}.value`)}</span>
                  </span>
                ) : (
                  <span className="jm-ae-ic" style={card.bg ? ({ "--bg": card.bg } as Vars) : {}}>
                    <Icon name={card.icon ?? "jobs"} className="size-5" />
                  </span>
                )}
                <span className="min-w-0">
                  <b>{text(`${key}.title`)}</b>
                  <small>{text(`${key}.text`)}</small>
                  {card.pill && <span className="jm-ae-pill">{text(`${key}.pill`)}</span>}
                </span>
              </span>
            );
          })}
        </div>
      ))}
      <span aria-hidden className="jm-ae-spark jm-ae-s1" />
      <span aria-hidden className="jm-ae-spark jm-ae-s2" />
    </div>
  );
}
