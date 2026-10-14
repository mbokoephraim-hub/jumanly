/**
 * Recruiting report as a PDF (@react-pdf/renderer): the rows of the « Rapports » page, grouped by
 * section. Every text arrives translated.
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReportRow } from "@/server/hire-report-export";

export type ReportLabels = {
  brand: string;
  title: string;
  period: string;
  footer: string;
};

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#0E3B33" },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  band: { height: 6, width: 90, backgroundColor: "#C8F169", marginTop: 6, marginBottom: 16 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  muted: { color: "#4A5A57", marginTop: 3 },
  section: { marginTop: 18, fontFamily: "Helvetica-Bold", fontSize: 11 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E3E7E5",
  },
  name: { maxWidth: "65%" },
  footer: { position: "absolute", left: 48, right: 48, bottom: 30, fontSize: 8, color: "#4A5A57" },
});

export function ReportDocument({ labels, rows }: { labels: ReportLabels; rows: ReportRow[] }) {
  const sections = [...new Set(rows.map((row) => row.section))];
  return (
    <Document title={labels.title} author="Jumanly" creator="Jumanly" producer="Jumanly">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>{labels.brand}</Text>
        <View style={s.band} />
        <Text style={s.title}>{labels.title}</Text>
        <Text style={s.muted}>{labels.period}</Text>
        {sections.map((section) => (
          <View key={section} wrap={false}>
            <Text style={s.section}>{section}</Text>
            {rows
              .filter((row) => row.section === section)
              .map((row, index) => (
                <View key={index} style={s.row}>
                  <Text style={s.name}>{row.name}</Text>
                  <Text>{row.value}</Text>
                </View>
              ))}
          </View>
        ))}
        <Text style={s.footer} fixed>
          {labels.footer}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(labels: ReportLabels, rows: ReportRow[]) {
  return renderToBuffer(<ReportDocument labels={labels} rows={rows} />);
}
