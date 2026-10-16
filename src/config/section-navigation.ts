/**
 * Secondary horizontal menu (Admin v4, étape 2): the sub-sections of the section open in the
 * column of icons. `label` keys are resolved on the server (`appNav.…`, `career.…`, `admin.nav.…`).
 */
export type SectionLink = { href: string; label: string };
export type Section = {
  /** Paths of the section: the path and everything below it (`"/app"` and `"/admin"`: exact). */
  match: readonly string[];
  /** Names the menu for screen readers. */
  label: string;
  links: readonly SectionLink[];
};

/** Index of the section a path belongs to (the longest matching prefix), or -1. */
export function sectionIndex(sections: readonly Section[], pathname: string) {
  let best = -1;
  let length = -1;
  sections.forEach((section, index) => {
    for (const prefix of section.match) {
      if (
        inside(pathname, prefix, prefix === "/app" || prefix === "/admin") &&
        prefix.length > length
      ) {
        best = index;
        length = prefix.length;
      }
    }
  });
  return best;
}

/** The link of a section that is current for a path (the longest matching href), or -1. */
export function activeLink(links: readonly SectionLink[], pathname: string) {
  let best = -1;
  let length = -1;
  links.forEach((link, index) => {
    const exact = link.href === "/app" || link.href === "/app/hire" || link.href === "/admin";
    if (inside(pathname, link.href, exact) && link.href.length > length) {
      best = index;
      length = link.href.length;
    }
  });
  return best;
}

function inside(pathname: string, href: string, exact: boolean) {
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}
