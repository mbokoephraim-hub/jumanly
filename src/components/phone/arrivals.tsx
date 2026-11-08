"use client";

import { PHONE, useUnread } from "@/components/talent/header";

/**
 * The toast of an important notification that arrives while the person is here (docs/experience-
 * animee § 4), once for the whole phone app; the bell of the Fil only keeps its count.
 */
export function PhoneArrivals({ wide = false }: { wide?: boolean }) {
  // The talent's computer has the same app since 07/11/2026: no other head asks there.
  useUnread(0, wide ? undefined : PHONE);
  return null;
}
