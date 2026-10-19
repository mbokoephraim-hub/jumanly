"use client";

import { useLayoutEffect } from "react";

/**
 * The exercise and the result of a quiz share the address of the classroom, which opens in « mode
 * concentré » (rail, no top bar; `classroom` in web/side-nav.tsx). They show the whole frame of
 * the space instead (planche web talent-3 § 5): the sidebar and the top bar come back while the
 * page is shown.
 */
export function FullFrame() {
  useLayoutEffect(() => {
    const frame = document.querySelector(".t-cadre");
    frame?.setAttribute("data-cadre-plein", "");
    return () => frame?.removeAttribute("data-cadre-plein");
  }, []);
  return null;
}
