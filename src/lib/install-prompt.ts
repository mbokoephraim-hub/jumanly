/**
 * Installing Jumanly without the Play Store (Ephraïm, 20/10). Chrome and Edge offer the
 * installation through `beforeinstallprompt`, which can fire before React has mounted: this inline
 * script, at the top of every page, keeps the event on `window` and tells the button
 * (src/components/site/install-app.tsx) with `INSTALL_EVENT`. Safari on iPhone has no such event:
 * the button shows the three steps of the « Partager » menu there.
 */
export const INSTALL_EVENT = "jm-install";

export const installScript = `(function(){var w=window,f=function(){w.dispatchEvent(new Event(${JSON.stringify(INSTALL_EVENT)}))};w.addEventListener("beforeinstallprompt",function(e){e.preventDefault();w.__jmInstall=e;f()});w.addEventListener("appinstalled",function(){w.__jmInstall=null;w.__jmInstalled=true;f()})})();`;
