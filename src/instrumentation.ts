import type { Instrumentation } from "next";

/** Every unhandled server error (pages, server actions, routes) is logged and reported. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { reportError } = await import("@/server/observability");
  const digest = (error as { digest?: string }).digest;
  await reportError(error, {
    route: context.routePath,
    method: request.method,
    message: `${context.routeType} ${context.routePath}`,
    ref: digest && /^[0-9a-f]{32}$/.test(digest) ? digest : undefined,
  });
};
