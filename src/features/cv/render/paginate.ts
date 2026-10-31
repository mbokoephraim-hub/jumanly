/**
 * Pagination of a CV (port of docs/modeles-cv/modeles/js/pagination.js, § 6.2). The same code runs
 * in the preview and in the export (Chromium on the server): pages and breaks are identical.
 *
 * The whole CV is rendered once in `.cv-source` (hidden). Fixed A4 pages are made from the page
 * pattern `.cv-page-modele`, then the blocks are poured in one by one; a block that overflows goes
 * to the next page. Unbreakable units: a section title with its first element, then each element.
 * Manual breaks: `data-saut="avant"`. Two independent flows: `.cv-principal` and `.cv-lateral`.
 *
 * Only change from the reference: the page pattern is a hidden element rather than a <template>
 * (React renders it like any other node).
 */

export type PaginationAlert = "trop-de-pages" | "element-trop-long";
export type PaginationResult = { pages: number; alert: PaginationAlert | null };

function overflows(zone: Element) {
  return zone.scrollHeight > zone.clientHeight + 1;
}

/**
 * Keeps in the page as many points of an element (`ul.cv-puces > li`) as fit, at least two, with
 * its heading; returns the element with the other points, to pour on the next page, or null when
 * the element cannot be cut.
 */
function splitPoints(element: HTMLElement, zone: () => Element): HTMLElement | null {
  const list = element.querySelector(":scope > ul.cv-puces, :scope ul.cv-puces");
  const points = list ? Array.from(list.children) : [];
  if (!list || points.length < 3) return null;
  const moved: Element[] = [];
  while (overflows(zone()) && list.children.length > 2) {
    const last = list.lastElementChild!;
    moved.unshift(last);
    last.remove();
  }
  if (overflows(zone()) || moved.length === 0) {
    moved.forEach((point) => list.appendChild(point));
    return null;
  }
  const rest = element.cloneNode(true) as HTMLElement;
  rest.classList.add("cv-el-suite");
  const restList = rest.querySelector("ul.cv-puces")!;
  // The continuation keeps only its points: the title, company and dates stay above.
  Array.from(rest.children).forEach((child) => {
    if (!child.contains(restList)) child.remove();
  });
  restList.replaceChildren(...moved.map((point) => point.cloneNode(true)));
  return rest;
}

export function paginate(article: HTMLElement): PaginationResult {
  const source = article.querySelector(".cv-source");
  const pattern = article.querySelector(".cv-page-modele")?.firstElementChild;
  const container = article.querySelector(".cv-pages");
  if (!source || !pattern || !container) return { pages: 0, alert: null };
  const maxPages = parseInt(article.dataset.maxPages || "3", 10);
  delete article.dataset.alerte;
  container.innerHTML = "";
  const pages: Element[] = [];

  function newPage() {
    const page = pattern!.cloneNode(true) as Element;
    if (pages.length > 0) {
      page.classList.add("suite");
      // Header and blocks kept for page 1.
      page.querySelectorAll("[data-page1]").forEach((node) => node.remove());
    }
    container!.appendChild(page);
    pages.push(page);
    return page;
  }
  newPage();
  // Page 1 header (identity, contact, photo): filled from the source.
  source.querySelectorAll<HTMLElement>("[data-bloc-tete]").forEach((block) => {
    const target = pages[0]!.querySelector(block.dataset.blocTete!);
    if (target) target.appendChild(block.cloneNode(true));
  });

  function pour(flow: "principal" | "lateral") {
    const sections = Array.from(
      source!.querySelectorAll<HTMLElement>(`.cv-sec[data-zone="${flow}"]`),
    );
    let index = 0; // current page of this flow
    const zone = () => {
      while (pages.length <= index) newPage();
      return pages[index]!.querySelector(`.cv-${flow}`)!;
    };
    for (const section of sections) {
      const elements = Array.from(section.querySelectorAll<HTMLElement>(":scope > .cv-el"));
      const shell = () => {
        const copy = section.cloneNode(false) as HTMLElement;
        const title = section.querySelector(":scope > .cv-st");
        if (title) copy.appendChild(title.cloneNode(true));
        return copy;
      };
      if (section.dataset.saut === "avant" && zone().children.length) index++;
      let current = shell();
      zone().appendChild(current);
      for (const [position, element] of elements.entries()) {
        if (element.dataset.saut === "avant" && position > 0) {
          index++;
          current = shell();
          current.classList.add("cv-suite");
          zone().appendChild(current);
        }
        let copy = element.cloneNode(true) as HTMLElement;
        current.appendChild(copy);
        if (overflows(zone())) {
          // A long experience is cut between its points (Ephraïm, 31/10): page 1 stays full
          // instead of leaving a hole, the rest goes on with the next page.
          const rest = splitPoints(copy, zone);
          if (rest) {
            index++;
            current = shell();
            current.classList.add("cv-suite");
            zone().appendChild(current);
            current.appendChild(rest);
            copy = rest;
            if (!overflows(zone())) continue;
          }
          copy.parentNode?.removeChild(copy);
          const empty = !current.querySelector(".cv-el");
          if (empty) current.remove(); // a title never stays alone at the bottom of a page
          if (zone().children.length === 0) {
            // Element taller than a page: kept, and reported.
            current.appendChild(copy);
            zone().appendChild(current);
            article.dataset.alerte = "element-trop-long";
            continue;
          }
          index++;
          current = shell();
          if (!empty) current.classList.add("cv-suite");
          zone().appendChild(current);
          current.appendChild(copy);
        }
      }
    }
  }
  pour("principal");
  pour("lateral");

  const total = pages.length;
  pages.forEach((page, number) => {
    const footer = page.querySelector(".cv-pied");
    if (footer && total > 1) footer.textContent = `${number + 1} / ${total}`;
  });
  article.dataset.pages = String(total);
  if (total > maxPages) article.dataset.alerte = "trop-de-pages";
  return { pages: total, alert: (article.dataset.alerte as PaginationAlert | undefined) ?? null };
}

/**
 * Fonts must be loaded BEFORE measuring: the source is hidden, the browser would not load them by
 * itself, and lines measured with a fallback font would be cut in the PDF.
 */
export async function loadFonts(article: HTMLElement) {
  const family = getComputedStyle(article).getPropertyValue("--cv-police").trim() || "Sora";
  await Promise.all(
    [300, 400, 500, 600, 700].map((weight) =>
      document.fonts.load(`${weight} 12px ${family}`).catch(() => null),
    ),
  );
}

export async function paginateWhenReady(article: HTMLElement) {
  await loadFonts(article);
  return paginate(article);
}
