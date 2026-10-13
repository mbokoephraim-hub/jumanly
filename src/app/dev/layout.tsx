import { notFound } from "next/navigation";
import { isInternalEnv } from "@/lib/env";

/** Internal pages: visible only in local and preview (spec § 11.5). Elsewhere: 404. */
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (!isInternalEnv()) notFound();
  return children;
}
