"use client";

import { useEffect } from "react";
import { paginateWhenReady } from "./paginate";

/**
 * Print page: paginates the CV once its fonts are loaded, then raises `body[data-pret="1"]`,
 * the signal the PDF export waits for (§ 6.3).
 */
export function PrintReady() {
  useEffect(() => {
    const article = document.querySelector<HTMLElement>("article.cv");
    if (!article) return;
    void paginateWhenReady(article).then(() => {
      document.body.dataset.pret = "1";
    });
  }, []);
  return null;
}
