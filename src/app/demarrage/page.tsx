import { LaunchHandover } from "./handover";

/**
 * Opening page of the installed app (manifest `start_url`): static, kept by the service worker, so
 * the animated logo (src/lib/launch-splash.ts) shows the instant the app opens, even offline. The
 * space opens right away behind the logo: `/app`, which sends a signed-out person to sign-in.
 */
export default function LaunchPage() {
  return <LaunchHandover />;
}

export const metadata = { robots: { index: false } };
