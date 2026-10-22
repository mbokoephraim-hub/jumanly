"use client";

import { PHONE, useUnread } from "@/components/talent/header";

/**
 * The toast of an important notification that arrives while the person is here (docs/experience-
 * animee § 4), once for the whole phone app; the bell of the Fil only keeps its count.
 */
export function PhoneArrivals() {
  useUnread(0, PHONE);
  return null;
}
