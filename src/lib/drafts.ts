/**
 * Drafts kept on the phone (talent space, OfflineDrafts): one entry per form, in localStorage,
 * erased after a week. Browser only.
 */
const PREFIX = "jm-brouillon:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type DraftField = {
  name: string;
  value?: string;
  values?: string[];
  checked?: boolean;
};

export type Draft = { at: number; fields: DraftField[]; queued: boolean };

export function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (Date.now() - draft.at > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, draft: Omit<Draft, "at">) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    // Storage full or private browsing: the form simply keeps what is on screen.
  }
}

export function removeDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing kept, nothing to erase.
  }
}
