"use client";

import { ServerError } from "@/components/site/server-error";

/** Page 500 (mockup 08-03, textes « system.500 »). */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ServerError digest={error.digest} onRetry={reset} />;
}
