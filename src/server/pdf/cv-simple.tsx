/**
 * A CV drawn by react-pdf, with no browser (Ephraïm, 31/10/2026: « un utilisateur doit pouvoir
 * télécharger son CV en un clic »). The usual export prints the chosen template with Chromium;
 * when Chromium cannot start or the print page does not answer in time, this drawing is sent
 * instead, so the download never fails. Same data as the template (`CvDocumentData`, every text
 * already written), one column, the CV's own accent colour, Sora, the photo when there is one.
 * No Jumanly mark: the file belongs to the person.
 */
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CvDocumentBlock, CvDocumentData, CvDocumentItem } from "@/features/cv/render/model";

const FONTS = path.join(process.cwd(), "public", "fonts", "cv");
Font.register({
  family: "Sora",
  fonts: [
    { src: path.join(FONTS, "Sora-400.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "Sora-600.ttf"), fontWeight: 600 },
    { src: path.join(FONTS, "Sora-700.ttf"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const ink = "#1F2A28";
const grey = "#5B6B68";
const line = "#DCE5E1";

function sheet(accent: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Sora",
      fontSize: 9.5,
      color: ink,
      paddingTop: 40,
      paddingBottom: 44,
      paddingHorizontal: 44,
      lineHeight: 1.45,
    },
    head: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
    photo: { width: 70, height: 70, borderRadius: 35, marginRight: 18, objectFit: "cover" },
    name: { fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.15 },
    headline: { fontSize: 11.5, fontWeight: 600, marginTop: 4 },
    contact: { fontSize: 8.5, color: grey, marginTop: 6 },
    block: { marginTop: 14 },
    blockTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: accent,
      textTransform: "uppercase",
      paddingBottom: 4,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    item: { marginBottom: 8 },
    itemHead: { flexDirection: "row", justifyContent: "space-between" },
    itemTitle: { fontWeight: 600, fontSize: 10, flex: 1, paddingRight: 10 },
    period: { fontSize: 8.5, color: grey },
    subtitle: { fontSize: 9, color: accent, marginTop: 1 },
    bulletRow: { flexDirection: "row", marginTop: 2 },
    bullet: { width: 10, color: accent },
    bulletText: { flex: 1 },
    muted: { color: grey },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    chip: { marginRight: 14, marginBottom: 4 },
    chipLevel: { fontSize: 8, color: grey },
  });
}
type Styles = ReturnType<typeof sheet>;

function Bullets({ bullets, s }: { bullets: string[]; s: Styles }) {
  return (
    <>
      {bullets.map((bullet, index) => (
        <View key={index} style={s.bulletRow} wrap={false}>
          <Text style={s.bullet}>•</Text>
          <Text style={s.bulletText}>{bullet}</Text>
        </View>
      ))}
    </>
  );
}

function Item({ item, s }: { item: CvDocumentItem; s: Styles }) {
  return (
    <View style={s.item}>
      <View style={s.itemHead} wrap={false}>
        <Text style={s.itemTitle}>{item.title}</Text>
        {item.period ? <Text style={s.period}>{item.period}</Text> : null}
      </View>
      {item.subtitle ? <Text style={s.subtitle}>{item.subtitle}</Text> : null}
      {item.text ? <Text style={{ marginTop: 2 }}>{item.text}</Text> : null}
      {item.bullets?.length ? <Bullets bullets={item.bullets} s={s} /> : null}
      {item.tools ? <Text style={[s.muted, { marginTop: 2 }]}>{item.tools}</Text> : null}
    </View>
  );
}

function Block({ block, s }: { block: CvDocumentBlock; s: Styles }) {
  let body;
  switch (block.type) {
    case "summary":
      body = <Text>{block.text}</Text>;
      break;
    case "highlights":
      body = <Bullets bullets={block.bullets} s={s} />;
      break;
    case "skills":
      body = (
        <View style={s.chips}>
          {block.skills.map((skill, index) => (
            <Text key={index} style={s.chip}>
              {skill.name} <Text style={s.chipLevel}>· {skill.levelLabel}</Text>
            </Text>
          ))}
        </View>
      );
      break;
    case "languages":
      body = (
        <View style={s.chips}>
          {block.languages.map((language, index) => (
            <Text key={index} style={s.chip}>
              {language.name} <Text style={s.chipLevel}>· {language.levelLabel}</Text>
            </Text>
          ))}
        </View>
      );
      break;
    case "interests":
      body = <Text>{block.names.join(" · ")}</Text>;
      break;
    case "publications":
    case "talks":
      body = block.references.map((item) => <Item key={item.id} item={item} s={s} />);
      break;
    default:
      body = block.items.map((item) => <Item key={item.id} item={item} s={s} />);
  }
  return (
    <View style={s.block}>
      <Text style={s.blockTitle} minPresenceAhead={40}>
        {block.title}
      </Text>
      {body}
    </View>
  );
}

export async function renderSimpleCv({
  data,
  accent,
  photo,
  title,
}: {
  data: CvDocumentData;
  /** The CV's accent colour (hex). */
  accent: string;
  /** JPEG or PNG bytes of the photo, when the CV shows one. */
  photo: Buffer | null;
  title: string;
}) {
  const s = sheet(accent);
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const contact = data.contact
    .map((entry) => (entry.label ? `${entry.label} ${entry.value}` : entry.value))
    .join("  ·  ");
  return renderToBuffer(
    <Document title={title} author={name} creator="" producer="" language={data.language}>
      <Page size="A4" style={s.page}>
        <View style={s.head} wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          {photo ? <Image src={photo} style={s.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{name}</Text>
            {data.headline ? <Text style={s.headline}>{data.headline}</Text> : null}
            {contact ? <Text style={s.contact}>{contact}</Text> : null}
          </View>
        </View>
        {data.blocks.map((block) => (
          <Block key={block.id} block={block} s={s} />
        ))}
      </Page>
    </Document>,
  );
}
