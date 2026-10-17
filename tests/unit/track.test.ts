import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanProps, setTrackSink, track } from "@/lib/track";

afterEach(() => setTrackSink(null));

describe("track() (mesure, prompt 6)", () => {
  it("n'envoie rien sans le consentement « analytics »", () => {
    const sink = vi.fn();
    setTrackSink(sink);
    expect(track("cv_downloaded", {}, "")).toBe(false);
    expect(track("cv_downloaded", {}, "jm_consent=v1.a0.p1")).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("envoie un événement connu avec le consentement", () => {
    const sink = vi.fn();
    setTrackSink(sink);
    expect(track("cv_downloaded", { view: "list" }, "jm_consent=v1.a1.p0")).toBe(true);
    expect(sink).toHaveBeenCalledWith("cv_downloaded", { view: "list" });
  });

  it("refuse un événement hors liste", () => {
    const sink = vi.fn();
    setTrackSink(sink);
    // @ts-expect-error an unknown event is a type error and is dropped at run time too.
    expect(track("cv_text", {}, "jm_consent=v1.a1.p1")).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("retire tout ce qui ressemble à un contenu privé", () => {
    expect(
      cleanProps({
        view: "list",
        count: 3,
        message: "Bonjour",
        cvTitle: "CV principal",
        q: "analyste",
        email: "a@b.c",
        contact: "x@y.z",
        long: "x".repeat(41),
      }),
    ).toEqual({ view: "list", count: 3 });
  });

  it("ne fait rien sans fournisseur branché", () => {
    expect(track("home_opened", {}, "jm_consent=v1.a1.p1")).toBe(true);
  });
});
