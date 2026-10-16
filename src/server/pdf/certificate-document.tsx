/**
 * Attestation as a PDF (@react-pdf/renderer): landscape A4, brand colors, the verification link.
 * Every text arrives translated.
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export type CertificateLabels = {
  brand: string;
  title: string;
  body: string;
  date: string;
  verify: string;
  code: string;
  footer: string;
};

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", color: "#0E3B33", backgroundColor: "#FBF8F1" },
  frame: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#0E3B33",
    borderRadius: 12,
    padding: 48,
    justifyContent: "space-between",
  },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  band: { height: 8, width: 120, backgroundColor: "#C8F169", marginTop: 8 },
  title: { fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 24 },
  holder: { fontSize: 26, fontFamily: "Helvetica-Bold", marginTop: 24 },
  body: { fontSize: 14, lineHeight: 1.5, marginTop: 12, maxWidth: 560 },
  meta: { fontSize: 11, color: "#4A5A57", marginTop: 4 },
  footer: { fontSize: 9, color: "#4A5A57" },
  watermark: {
    position: "absolute",
    top: 210,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 120,
    fontFamily: "Helvetica-Bold",
    color: "#0E3B33",
    opacity: 0.08,
    transform: "rotate(-18deg)",
  },
});

export function CertificateDocument({
  holder,
  labels,
  watermark,
}: {
  holder: string;
  labels: CertificateLabels;
  /** « Aperçu » across the page, for the preview the course team checks before publishing. */
  watermark?: string;
}) {
  return (
    <Document title={labels.title} author="Jumanly" creator="Jumanly" producer="Jumanly">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          <View>
            <Text style={s.brand}>{labels.brand}</Text>
            <View style={s.band} />
            <Text style={s.title}>{labels.title}</Text>
            <Text style={s.holder}>{holder}</Text>
            <Text style={s.body}>{labels.body}</Text>
          </View>
          <View>
            <Text style={s.meta}>{labels.date}</Text>
            <Text style={s.meta}>{labels.code}</Text>
            <Text style={s.meta}>{labels.verify}</Text>
            <Text style={[s.footer, { marginTop: 16 }]}>{labels.footer}</Text>
          </View>
        </View>
        {watermark ? (
          <Text style={s.watermark} fixed>
            {watermark}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(props: {
  holder: string;
  labels: CertificateLabels;
  watermark?: string;
}) {
  return renderToBuffer(<CertificateDocument {...props} />);
}
