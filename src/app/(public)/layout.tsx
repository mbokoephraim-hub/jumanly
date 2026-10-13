import { EnTetePublic } from "@/components/mise-en-page/en-tete-public";
import { PiedDePagePublic } from "@/components/mise-en-page/pied-de-page-public";

/** Gabarit du site public, accessible sans compte. */
export default function GabaritPublic({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <EnTetePublic />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePagePublic />
    </div>
  );
}
