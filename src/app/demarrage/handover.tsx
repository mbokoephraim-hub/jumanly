"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Opens the space behind the logo, without a new entry in the history. */
export function LaunchHandover() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app");
  }, [router]);
  return null;
}
