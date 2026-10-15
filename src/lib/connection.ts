/**
 * Connection helpers shared by the offline notices, the offline page and the video player
 * (mockup 08-05). Browser only, except the constant.
 */

/** Where the connection notices go: the top of the main panel in the signed-in space. */
export const OFFLINE_SLOT_ID = "jm-offline-slot";

const DATA_SAVER_KEY = "jm-data-saver";
const DATA_SAVER_EVENT = "jm-data-saver";

/** « Mode économie de données », chosen on this device: videos load in reduced quality. */
export function dataSaverOn() {
  try {
    return localStorage.getItem(DATA_SAVER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDataSaver(on: boolean) {
  try {
    if (on) localStorage.setItem(DATA_SAVER_KEY, "1");
    else localStorage.removeItem(DATA_SAVER_KEY);
  } catch {
    // Private browsing without storage: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(DATA_SAVER_EVENT));
}

export function subscribeDataSaver(callback: () => void) {
  window.addEventListener(DATA_SAVER_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DATA_SAVER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Slow connection reported by the browser (Network Information API, when available). */
export function slowNetwork() {
  const connection = (
    navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }
  ).connection;
  return Boolean(
    connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? ""),
  );
}

/** Load light media: slow network, or data saver chosen on this device. */
export function slowConnection() {
  return dataSaverOn() || slowNetwork();
}
