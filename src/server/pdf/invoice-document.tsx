/**
 * Invoice as a PDF (@react-pdf/renderer): A4 portrait, brand colors. Every text arrives translated.
 * No phone number, ever (CLAUDE.md, règle 8).
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export type InvoiceLabels = {
  brand: string;
  title: string;
  number: string;
  issued: string;
  seller: string;
  sellerContact: string;
  billedTo: string;
  billed: string[];
  description: string;
  lines: { label: string; amount: string }[];
  total: { label: string; amount: string };
  meta: string[];
  refunded: string | null;
  footer: string;
};

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 11, color: "#0E3B33" },
  head: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  band: { height: 6, width: 90, backgroundColor: "#C8F169", marginTop: 6 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right" },
  muted: { color: "#4A5A57", marginTop: 3 },
  block: { marginTop: 28 },
  label: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E3E7E5",
  },
  total: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  refunded: { marginTop: 16, color: "#B42318", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", left: 48, right: 48, bottom: 36, fontSize: 9, color: "#4A5A57" },
});

export function InvoiceDocument({ labels }: { labels: InvoiceLabels }) {
  return (
    <Document title={labels.number} author="Jumanly" creator="Jumanly" producer="Jumanly">
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View>
            <Text style={s.brand}>{labels.brand}</Text>
            <View style={s.band} />
            <Text style={s.muted}>{labels.seller}</Text>
            <Text style={s.muted}>{labels.sellerContact}</Text>
          </View>
          <View>
            <Text style={s.title}>{labels.title}</Text>
            <Text style={[s.muted, { textAlign: "right" }]}>{labels.number}</Text>
            <Text style={[s.muted, { textAlign: "right" }]}>{labels.issued}</Text>
          </View>
        </View>
        <View style={s.block}>
          <Text style={s.label}>{labels.billedTo}</Text>
          {labels.billed.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>
        <View style={s.block}>
          <Text style={s.label}>{labels.description}</Text>
          {labels.lines.map((line) => (
            <View key={line.label} style={s.row}>
              <Text>{line.label}</Text>
              <Text>{line.amount}</Text>
            </View>
          ))}
          <View style={s.row}>
            <Text style={s.total}>{labels.total.label}</Text>
            <Text style={s.total}>{labels.total.amount}</Text>
          </View>
        </View>
        <View style={s.block}>
          {labels.meta.map((line) => (
            <Text key={line} style={s.muted}>
              {line}
            </Text>
          ))}
          {labels.refunded && <Text style={s.refunded}>{labels.refunded}</Text>}
        </View>
        <Text style={s.footer}>{labels.footer}</Text>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(labels: InvoiceLabels) {
  return renderToBuffer(<InvoiceDocument labels={labels} />);
}
