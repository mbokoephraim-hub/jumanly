"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";

/**
 * Gives its children a fresh state on each visit of the page. Next keeps a page we left hidden
 * (Activity) with its state: without this, « Publier » would open again on the text of the post
 * just published. When the page is hidden, the effect's cleanup runs and the next visit remounts.
 */
export function FreshOnEachVisit({ children }: { children: ReactNode }) {
  const [visit, setVisit] = useState(0);
  useEffect(() => () => setVisit((count) => count + 1), []);
  return <Fragment key={visit}>{children}</Fragment>;
}
