import type { ReactNode } from "react";

/**
 * Head of a page laid out in columns on computer and tablet (web.py `wh`): a large title, a line
 * under it, an action on the right. On the phone the page keeps its FlowHead and this one is hidden.
 */
export function WebHead({ title, sub, end }: { title: string; sub?: ReactNode; end?: ReactNode }) {
  return (
    <div className="t-aw-h t-ap-web">
      <div className="t-t">
        <h1 className="t-aw-h1">{title}</h1>
        {sub && <p className="t-aw-ss">{sub}</p>}
      </div>
      {end}
    </div>
  );
}
