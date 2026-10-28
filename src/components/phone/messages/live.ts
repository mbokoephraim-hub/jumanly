"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Pulse = { typing: string[]; online: string[]; version: string };

/**
 * The Chat kept live (docs/chat-v2, « temps réel »): every few seconds while the screen is shown,
 * the pulse says who types and who is online; when its version changes (a message, a reaction, a
 * reading, a call), the page reads itself again. Nothing is asked while the phone sleeps.
 */
export function useChatPulse({
  conversationId,
  every,
  active,
}: {
  conversationId: string | null;
  every: number;
  active: boolean;
}) {
  const router = useRouter();
  const [typing, setTyping] = useState<Set<string> | null>(null);
  const [online, setOnline] = useState<Set<string> | null>(null);
  const version = useRef<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch(
            `/app/messages/pouls${conversationId ? `?c=${encodeURIComponent(conversationId)}` : ""}`,
            { cache: "no-store" },
          );
          if (response.ok && !stopped) {
            const pulse = (await response.json()) as Pulse;
            setTyping(new Set(pulse.typing));
            setOnline(new Set(pulse.online));
            if (version.current !== null && version.current !== pulse.version) router.refresh();
            version.current = pulse.version;
          }
        } catch {
          // A slow or cut network: the next pulse tries again.
        }
      }
      if (!stopped) timer = setTimeout(ask, every);
    };
    void ask();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, conversationId, every, router]);

  return { typing, online };
}

/** Tells the other side « écrit… » while the person types, at most every 2.5 s. */
export function useTypingPing(conversationId: string) {
  const last = useRef(0);
  return useCallback(() => {
    const now = Date.now();
    if (now - last.current < 2_500) return;
    last.current = now;
    void fetch("/app/messages/pouls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ c: conversationId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [conversationId]);
}
