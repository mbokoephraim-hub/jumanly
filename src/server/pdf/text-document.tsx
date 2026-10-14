/**
 * A letter or a text of the talent as a PDF (@react-pdf/renderer): title, then paragraphs.
 * Every label arrives translated.
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 56, fontFamily: "Helvetica", fontSize: 11, color: "#0E3B33", lineHeight: 1.5 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 18 },
  paragraph: { marginBottom: 10 },
  footer: { position: "absolute", left: 56, right: 56, bottom: 30, fontSize: 8, color: "#4A5A57" },
});

export function TextDocument({
  title,
  text,
  footer,
}: {
  title: string;
  text: string;
  footer: string;
}) {
  const paragraphs = text.split(/\n{2,}/).filter((part) => part.trim());
  return (
    <Document title={title} author="Jumanly" creator="Jumanly" producer="Jumanly">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{title}</Text>
        <View>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={s.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
        <Text style={s.footer} fixed>
          {footer}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderTextPdf(input: { title: string; text: string; footer: string }) {
  return renderToBuffer(<TextDocument {...input} />);
}

/** A file name without accents or spaces. */
export function pdfFileName(title: string, fallback: string) {
  return (
    title
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || fallback
  );
}
