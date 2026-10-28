import type { ReactNode } from "react";
import { Character, type CharacterName, type Pose } from "@/components/brand";
import { cx } from "@/lib/cx";

/**
 * Big error code in the Signature gradient (mockups 08-01 to 08-03): 96 px on mobile, 160 px on
 * desktop. Decorative: the heading below says the same thing in words.
 */
export function SystemCode({ code }: { code: string }) {
  return (
    <span
      aria-hidden
      className="bg-gradient-signature bg-clip-text text-[96px] leading-none font-bold tracking-[-0.06em] text-transparent lg:text-[160px]"
    >
      {code}
    </span>
  );
}

/**
 * Body of the system pages (404, 403, 500): code, title, text, then the actions; the character
 * sits on the right on desktop and below the buttons on mobile, everything centred.
 */
export function SystemHero({
  code,
  title,
  body,
  character,
  compact = false,
  children,
}: {
  code: ReactNode;
  title: string;
  body: ReactNode;
  /** Not on the public site (Modèle B, no illustrated character). */
  character?: { name: CharacterName; pose: Pose };
  /** Smaller title, inside the application card (mockup 08-02). */
  compact?: boolean;
  /** Search field, actions. */
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:gap-16 lg:text-left">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-5 lg:items-start">
        {code}
        <h1
          className={
            compact
              ? "text-[22px] leading-[28px] font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]"
              : "text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[36px] lg:leading-[42px]"
          }
        >
          {title}
        </h1>
        <div className="text-base leading-[26px] text-ardoise lg:text-lg lg:leading-7">{body}</div>
        {children}
      </div>
      {character && (
        <div className="shrink-0 [&_img]:h-[220px]! lg:[&_img]:h-[380px]!">
          <Character name={character.name} pose={character.pose} height={380} />
        </div>
      )}
    </div>
  );
}

/** The two or three buttons of a system page: side by side on desktop, stacked full width on mobile. */
export function SystemActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-wrap [&>*]:w-full lg:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * System page inside the signed-in space (mockups 08-02 and 08-05): the small page title, then the
 * white card that holds the message, in the application template.
 */
export function AppSystemCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col">
        <p className="text-sm text-ardoise">{eyebrow}</p>
        <p className="text-app-h1">{title}</p>
      </div>
      <div className="rounded-[32px] bg-blanc px-5 py-7 lg:px-16 lg:py-14">{children}</div>
    </>
  );
}
