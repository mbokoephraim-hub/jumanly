/** Seen once on this phone: afterwards, the short opening (planche « Ouverture courte »). */
export const DISCOVER_SEEN_KEY = "jm-decouvert";

/** Marks the opening before the first paint, so the right one is drawn at once. */
export const DISCOVER_FLAG_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(DISCOVER_SEEN_KEY)}))document.documentElement.dataset.nbDecouvert="1"}catch(e){}`;
