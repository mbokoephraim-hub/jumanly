import { permanentRedirect } from "next/navigation";

/**
 * Former opening of the installed app (old talent design, removed by docs/refonte-mobile § 0):
 * phones that kept this address go straight to the talent space, or to sign-in.
 */
export default function OpeningPage() {
  permanentRedirect("/app");
}
