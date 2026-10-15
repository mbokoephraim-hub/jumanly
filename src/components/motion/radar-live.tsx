"use client";

import { useEffect, useRef, useState } from "react";
import { motionReduced } from "@/lib/motion";
import { Radar, type RadarAxis } from "./radar";

/** Overshoots a little before settling (the « Rebond » curve of the brand). */
const back = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

/**
 * The radar that builds itself while the talent answers (docs/experience-animee § 5.2): when a
 * value changes, its axis grows to the new value with a slight bounce (half a second). Without
 * motion, the new shape is drawn at once.
 */
export function LiveRadar(
  props: Omit<React.ComponentProps<typeof Radar>, "axes"> & { axes: RadarAxis[] },
) {
  const target = props.axes.map((axis) => axis.value);
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const key = target.join(",");

  useEffect(() => {
    const goal = key.split(",").map(Number);
    const start = from.current;
    const reduced = motionReduced();
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - began) / 520);
      const values = goal.map(
        (value, index) => (start[index] ?? 0) + (value - (start[index] ?? 0)) * back(t),
      );
      from.current = values;
      setShown(values);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key]);

  return (
    <Radar
      {...props}
      axes={props.axes.map((axis, index) => ({ ...axis, value: shown[index] ?? axis.value }))}
    />
  );
}
