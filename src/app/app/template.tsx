/**
 * Re-mounted on each page of the signed-in space: its blocks enter one after the other
 * (docs/experience-animee § 3, `.jm-page` in src/styles/motion.css). Without motion, the page is
 * simply there.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="jm-page flex w-full min-w-0 flex-col gap-5">{children}</div>;
}
