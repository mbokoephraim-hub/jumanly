import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDsn, reportError, sentryEnvelope } from "@/server/observability";

describe("error reports (E11)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads a Sentry DSN, and ignores a malformed one", () => {
    expect(parseDsn("https://abc123@o1.ingest.sentry.io/42")).toMatchObject({
      endpoint: "https://o1.ingest.sentry.io/api/42/envelope/",
      key: "abc123",
    });
    expect(parseDsn("pas une adresse")).toBeNull();
    expect(parseDsn("https://o1.ingest.sentry.io/42")).toBeNull();
    expect(parseDsn(undefined)).toBeNull();
  });

  it("builds an envelope with the error and no personal data", () => {
    const dsn = parseDsn("https://abc123@o1.ingest.sentry.io/42")!;
    const error = new Error("boom");
    const lines = sentryEnvelope(dsn, error, { ref: "a".repeat(32), route: "/app/x" }).split("\n");
    expect(lines).toHaveLength(3);
    const event = JSON.parse(lines[2]!);
    expect(event.event_id).toBe("a".repeat(32));
    expect(event.transaction).toBe("/app/x");
    expect(event.exception.values[0]).toMatchObject({ type: "Error", value: "boom" });
    expect(Object.keys(event)).not.toContain("user");
  });

  it("logs without Sentry, sends with it, and never throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockRejectedValue(new Error("réseau"));
    vi.stubGlobal("fetch", fetchMock);

    const ref = await reportError(new Error("sans Sentry"));
    expect(ref).toMatch(/^[0-9a-f]{32}$/);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("SENTRY_DSN", "https://abc123@o1.ingest.sentry.io/42");
    await expect(reportError("texte")).resolves.toMatch(/^[0-9a-f]{32}$/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
