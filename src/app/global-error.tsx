"use client";

import texts from "../../messages/fr.systeme.json";
import { ServerError } from "@/components/site/server-error";
import "./globals.css";

/**
 * Page 500 when the root layout itself fails (mockup 08-03): it brings its own <html> and the
 * system font stack, since the Sora font comes from the layout.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="fr">
      <head>
        <title>{texts.system["500"].meta.title}</title>
      </head>
      <body className="min-h-dvh antialiased">
        <ServerError digest={error.digest} onRetry={() => window.location.reload()} />
      </body>
    </html>
  );
}
