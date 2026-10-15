import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { NotFoundSection } from "@/components/site/not-found-content";

/** Page 404 of the public site (mockup 08-01), with the site header and footer. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="content" className="flex flex-1 items-center bg-creme">
        <NotFoundSection />
      </main>
      <PublicFooter />
    </div>
  );
}
