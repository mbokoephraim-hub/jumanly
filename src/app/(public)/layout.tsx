import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

/** Public site layout, available without an account. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
