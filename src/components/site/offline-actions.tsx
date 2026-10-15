"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/brand/icon";
import { Button } from "@/components/ui/button";
import { dataSaverOn, setDataSaver, subscribeDataSaver } from "@/lib/connection";

/**
 * Buttons of the offline page (mockup 08-05): try the page again, and turn the data saver on or
 * off for this device (videos then load in reduced quality).
 */
export function OfflineActions({
  labels,
}: {
  labels: { retry: string; dataSaver: string; dataSaverOn: string; dataSaverHint: string };
}) {
  const saver = useSyncExternalStore(subscribeDataSaver, dataSaverOn, () => false);
  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="flex w-full flex-col justify-center gap-2.5 sm:flex-row">
        <Button type="button" onClick={() => window.location.reload()}>
          {labels.retry}
        </Button>
        <Button
          type="button"
          variant="tertiary"
          icon={<Icon name={saver ? "check" : "telecharger"} aria-hidden />}
          onClick={() => setDataSaver(!saver)}
        >
          {saver ? labels.dataSaverOn : labels.dataSaver}
        </Button>
      </div>
      {saver && <p className="text-xs text-ardoise">{labels.dataSaverHint}</p>}
    </div>
  );
}
