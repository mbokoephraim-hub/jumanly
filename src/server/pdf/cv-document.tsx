/**
 * CV as PDF (@react-pdf/renderer, partie 02). Standard Helvetica: readable by recruitment software
 * (ATS) and no font file to download. All texts arrive translated in `labels`.
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { CvContent, CvSectionId, CvTemplateId } from "@/server/services/cv";
import { cvTemplates } from "@/server/services/cv";

export type CvLabels = {
  sections: Record<CvSectionId, string>;
  skillLevel: (level: number) => string;
  language: (code: string, level: string, cefr?: string) => string;
  period: (start: string, end: string | null) => string;
  years: (start: number | null, end: number | null) => string;
  location: (city: string, country: string) => string;
  title: string;
};

function styles(templateId: CvTemplateId) {
  const accent = cvTemplates.find((template) => template.id === templateId)?.accent ?? "#0E3B33";
  const compact = templateId === "compact";
  const modern = templateId === "modern";
  return StyleSheet.create({
    page: {
      paddingVertical: compact ? 28 : 40,
      paddingHorizontal: compact ? 32 : 44,
      fontFamily: "Helvetica",
      fontSize: compact ? 9.5 : 10.5,
      color: "#1C2B28",
      lineHeight: 1.4,
    },
    header: {
      marginBottom: compact ? 10 : 16,
      paddingBottom: compact ? 8 : 12,
      borderBottomWidth: modern ? 0 : 1.5,
      borderBottomColor: accent,
      backgroundColor: modern ? accent : undefined,
      color: modern ? "#FFFFFF" : undefined,
      padding: modern ? 14 : 0,
      borderRadius: modern ? 6 : 0,
    },
    name: { fontSize: compact ? 18 : 22, fontFamily: "Helvetica-Bold" },
    headline: { fontSize: compact ? 11 : 12.5, marginTop: 2 },
    contact: { marginTop: 4, fontSize: compact ? 9 : 9.5 },
    section: { marginBottom: compact ? 8 : 12 },
    sectionTitle: {
      fontSize: compact ? 10.5 : 12,
      fontFamily: "Helvetica-Bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    item: { marginBottom: compact ? 4 : 7 },
    itemTitle: { fontFamily: "Helvetica-Bold" },
    meta: { color: "#4A5A57", fontSize: compact ? 8.5 : 9.5 },
    bullet: { flexDirection: "row", marginTop: 1 },
    bulletMark: { width: 10 },
    bulletText: { flex: 1 },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    chip: { marginRight: 10, marginBottom: 2 },
  });
}

export function CvDocument({
  content,
  templateId,
  labels,
}: {
  content: CvContent;
  templateId: CvTemplateId;
  labels: CvLabels;
}) {
  const s = styles(templateId);
  const contact = [
    content.info.showEmail ? content.info.email : "",
    content.info.city || content.info.country
      ? labels.location(content.info.city, content.info.country)
      : "",
  ].filter(Boolean);

  const blocks: Record<CvSectionId, React.ReactNode> = {
    summary: content.summary ? <Text>{content.summary}</Text> : null,
    experience:
      content.experiences.length > 0
        ? content.experiences.map((experience, index) => (
            <View key={index} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{[experience.title, experience.company].join(" · ")}</Text>
              <Text style={s.meta}>
                {[labels.period(experience.start, experience.end), experience.location]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {experience.bullets.map((bullet, line) => (
                <View key={line} style={s.bullet}>
                  <Text style={s.bulletMark}>•</Text>
                  <Text style={s.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))
        : null,
    education:
      content.education.length > 0
        ? content.education.map((education, index) => (
            <View key={index} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{education.degree}</Text>
              <Text style={s.meta}>
                {[
                  education.school,
                  education.field,
                  labels.years(education.startYear, education.endYear),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          ))
        : null,
    skills:
      content.skills.length > 0 ? (
        <View style={s.chips}>
          {content.skills.map((skill, index) => (
            <Text key={index} style={s.chip}>
              {[skill.name, labels.skillLevel(skill.level)].join(" · ")}
            </Text>
          ))}
        </View>
      ) : null,
    languages:
      content.languages.length > 0 ? (
        <View style={s.chips}>
          {content.languages.map((language, index) => (
            <Text key={index} style={s.chip}>
              {labels.language(language.code, language.level, language.cefr)}
            </Text>
          ))}
        </View>
      ) : null,
  };

  return (
    <Document title={labels.title} author={content.info.name} creator="Jumanly" producer="Jumanly">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{content.info.name}</Text>
          {content.info.headline ? <Text style={s.headline}>{content.info.headline}</Text> : null}
          {contact.length > 0 ? <Text style={s.contact}>{contact.join(" · ")}</Text> : null}
        </View>
        {content.sections
          .filter((section) => section.visible && blocks[section.id])
          .map((section) => (
            <View key={section.id} style={s.section}>
              <Text style={s.sectionTitle}>{labels.sections[section.id]}</Text>
              {blocks[section.id]}
            </View>
          ))}
      </Page>
    </Document>
  );
}

export async function renderCvPdf(props: Parameters<typeof CvDocument>[0]) {
  return renderToBuffer(<CvDocument {...props} />);
}
