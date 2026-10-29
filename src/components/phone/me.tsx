"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { FilAvatar } from "./fil/avatar";

/** The person signed in, as the round at the top of each tab draws them. */
export type PhoneMe = {
  initials: string;
  image: string | null;
  /** Their own profile: « Mon profil » (talent) or the recruiter's profile. */
  href: string;
  label: string;
};

const MeContext = createContext<PhoneMe | null>(null);

export function PhoneMeProvider({ me, children }: { me: PhoneMe; children: ReactNode }) {
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function usePhoneMe() {
  return useContext(MeContext);
}

/**
 * The person's round photo at the top of every tab (demande d'Ephraïm du 29/10/2026): as large as
 * the round buttons beside it, it opens their profile (banner, bio, publications, statistics).
 */
export function MeAvatar({ className }: { className?: string }) {
  const me = usePhoneMe();
  if (!me) return null;
  return (
    <Link
      href={me.href}
      className={className ? `nb-tete-moi ${className}` : "nb-tete-moi"}
      aria-label={me.label}
    >
      <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={44} />
    </Link>
  );
}
