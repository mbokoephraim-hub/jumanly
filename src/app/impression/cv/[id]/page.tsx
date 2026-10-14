import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import "@/features/cv/templates/print.css";
import { consumePrintToken, readPrintToken } from "@/features/cv/export/token";
import { cvTextLabels } from "@/features/cv/labels";
import { documentFromCv } from "@/features/cv/render/build";
import { CvDocument } from "@/features/cv/render/CvDocument";
import { PrintReady } from "@/features/cv/render/PrintReady";
import { loadCvSource } from "@/features/cv/source";
import { db } from "@/server/db";

async function ticketOf(props: PageProps<"/impression/cv/[id]">) {
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  // The token expires: always read at request time.
  await connection();
  const token = typeof query.jeton === "string" ? query.jeton : "";
  const ticket = readPrintToken(token);
  return ticket && ticket.id === id ? ticket : null;
}

/** The file's title is the person's (« CV Prénom Nom »), never the platform's. */
export async function generateMetadata(props: PageProps<"/impression/cv/[id]">): Promise<Metadata> {
  const ticket = await ticketOf(props);
  const source = ticket ? await loadCvSource(db, ticket.source, ticket.id) : null;
  const name = source?.content.info.name.trim() ?? "";
  return {
    title: { absolute: name ? `CV ${name}` : "CV" },
    robots: { index: false, follow: false },
  };
}

/**
 * Internal print page of a CV (docs/modeles-cv § 6.3), opened only by the headless browser of
 * the export with a single-use signed token (60 s): no session, no navigation, nothing but the CV.
 */
export default function CvPrintPage(props: PageProps<"/impression/cv/[id]">) {
  return (
    <Suspense>
      <CvPrint {...props} />
    </Suspense>
  );
}

async function CvPrint(props: PageProps<"/impression/cv/[id]">) {
  const ticket = await ticketOf(props);
  if (!ticket || !(await consumePrintToken(db, ticket))) notFound();
  const source = await loadCvSource(db, ticket.source, ticket.id);
  if (!source) notFound();
  const labels = await cvTextLabels(source.style.titlesLanguage);
  const data = documentFromCv(source.content, labels, source.photoUrl);
  return (
    <>
      <CvDocument data={data} template={source.template} style={source.style} />
      <PrintReady />
    </>
  );
}
