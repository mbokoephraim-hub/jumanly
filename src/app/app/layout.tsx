import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";

/** Signed-in space layout. Authentication comes with step E2. */
export default function SignedInLayout({ children }: LayoutProps<"/app">) {
  const t = useTranslations("app");
  return <AppShell userName={t("sampleUser")}>{children}</AppShell>;
}
