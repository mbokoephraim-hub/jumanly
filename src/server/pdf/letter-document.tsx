/**
 * A cover letter as a PDF in its template (@react-pdf/renderer): the same layout as the screen
 * (src/features/letter/LetterSheet.tsx), sizes converted from % of the page width to points. The
 * band sits on the first page only; a long letter goes on to a second page with the same margins.
 */
import type { ComponentProps } from "react";
import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  colorHex,
  letterLayouts,
  nameParts,
  paragraphsOf,
  PT_PER_U,
  tint,
  U,
  type LetterDesign,
  type LetterSheetData,
} from "@/features/letter/design";

const p = (value: number) => value * PT_PER_U;
type Style = Exclude<ComponentProps<typeof View>["style"], unknown[] | undefined>;
/** Top margin of the pages after the first one; the band of page 1 goes back up over it. */
const TOP = p(8);

export type LetterPdfInput = {
  data: Omit<LetterSheetData, "photoUrl">;
  design: Pick<LetterDesign, "template" | "color" | "photo">;
  /** The profile photo's bytes (JPEG or PNG), null for none. */
  photo: { data: Buffer; format: "jpg" | "png" } | null;
  /** « Lettre de motivation · Prénom Nom », for the file's title. */
  title: string;
};

export function LetterDocument({ data, design, photo, title }: LetterPdfInput) {
  const layout = letterLayouts[design.template];
  const color = colorHex(design.color);
  const light = tint(color, 0.88);
  const withPhoto = design.photo !== "aucune";
  const size = p(layout.photoSize);
  const strip = layout.coord === "strip-white" || layout.coord === "strip-tint";
  const align = layout.center ? "center" : "left";
  const accent = tint(color, 0.62);
  const name = nameParts(data.name);

  const photoView = withPhoto ? (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: design.photo === "rond" ? size / 2 : p(2),
        borderWidth: p(0.6),
        borderColor: accent,
        borderStyle: "solid",
        backgroundColor: tint(color, 0.75),
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {photo ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
        <Image src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Text style={{ fontSize: size * 0.36, fontFamily: "Helvetica-Bold", color }}>
          {data.initials}
        </Text>
      )}
    </View>
  ) : null;

  const contacts = (onColor: boolean, style: Style = {}) =>
    data.contacts.length > 0 ? (
      <View
        style={{
          flexDirection: layout.coord === "column" ? "column" : "row",
          flexWrap: "wrap",
          justifyContent: layout.center ? "center" : "flex-start",
          ...style,
        }}
      >
        {data.contacts.map((item, index) => (
          <Text
            key={item}
            style={{
              fontSize: p(U.coord),
              color: onColor ? "#ffffff" : color,
              marginRight: 0,
              marginTop: layout.coord === "column" && index > 0 ? p(0.6) : 0,
            }}
          >
            {index > 0 && layout.coord !== "column" ? "\u00a0· " : ""}
            {item}
          </Text>
        ))}
      </View>
    ) : null;

  const identity = (
    <View
      style={{
        flexDirection: "column",
        alignItems: layout.center ? "center" : "flex-start",
        flexShrink: 1,
      }}
    >
      <Text
        style={{
          fontSize: p(U.name),
          fontFamily: "Helvetica-Bold",
          color: "#ffffff",
          textAlign: align,
        }}
      >
        {name.first}
        {name.last ? <Text style={{ color: accent }}> {name.last}</Text> : null}
      </Text>
      {data.headline ? (
        <Text
          style={{ fontSize: p(U.headline), color: "#ffffff", marginTop: p(0.8), textAlign: align }}
        >
          {data.headline}
        </Text>
      ) : null}
      {!strip && contacts(true, { marginTop: p(1.6) })}
    </View>
  );

  const bandPadding = layout.inset
    ? { paddingVertical: p(U.bandY - 1), paddingHorizontal: p(U.padX - U.inset + 1) }
    : {
        paddingTop: p(U.bandY),
        paddingHorizontal: p(U.padX),
        paddingBottom: strip ? 0 : p(U.bandY),
      };

  return (
    <Document title={title} author={data.name} creator="" producer="">
      <Page
        size="A4"
        style={{
          fontFamily: "Helvetica",
          fontSize: p(U.body),
          color: "#1F2933",
          lineHeight: 1.55,
          paddingTop: TOP,
          paddingBottom: p(8),
        }}
      >
        <View
          style={{
            position: "relative",
            backgroundColor: color,
            marginTop: -TOP,
            ...bandPadding,
            ...(layout.inset
              ? {
                  marginTop: p(U.inset) - TOP,
                  marginHorizontal: p(U.inset),
                  borderRadius: p(U.radius),
                }
              : {}),
            lineHeight: 1.2,
          }}
        >
          <View
            style={{
              flexDirection: layout.photo === "top" ? "column" : "row",
              alignItems: "center",
              justifyContent: layout.photo === "right" ? "space-between" : "flex-start",
              gap: p(layout.photo === "top" ? 2.4 : 4.5),
            }}
          >
            {(layout.photo === "left" || layout.photo === "top") && photoView}
            {identity}
            {layout.photo === "right" && photoView}
          </View>
          {strip &&
            contacts(false, {
              marginTop: p(4),
              marginHorizontal: -p(U.padX),
              paddingVertical: p(2.2),
              paddingHorizontal: p(U.padX),
              backgroundColor: layout.coord === "strip-tint" ? light : "#ffffff",
              ...(layout.coord === "strip-white"
                ? {
                    borderBottomWidth: p(0.25),
                    borderBottomColor: light,
                    borderBottomStyle: "solid",
                  }
                : {}),
            })}
        </View>

        <View
          style={{
            marginTop: p(6),
            marginHorizontal: p(U.padX),
            ...(layout.rule
              ? {
                  borderLeftWidth: p(0.6),
                  borderLeftColor: color,
                  borderLeftStyle: "solid",
                  paddingLeft: p(4),
                }
              : {}),
          }}
        >
          {data.recipient ? (
            <View
              style={{
                alignSelf: "flex-start",
                minWidth: "46%",
                borderLeftWidth: p(0.6),
                borderLeftColor: color,
                borderLeftStyle: "solid",
                backgroundColor: tint(color, 0.93),
                paddingVertical: p(1.6),
                paddingHorizontal: p(2.6),
                marginBottom: p(1.5),
                lineHeight: 1.4,
              }}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", lineHeight: 1.4 }}>
                {data.recipient.to}
              </Text>
              <Text style={{ lineHeight: 1.4 }}>{data.recipient.detail}</Text>
            </View>
          ) : null}
          <Text
            style={{
              fontSize: p(U.date),
              color,
              textAlign: "right",
              marginBottom: p(data.recipient ? 3 : 4),
            }}
          >
            {data.date}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: layout.center ? "center" : "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: p(U.heading),
                fontFamily: "Helvetica-Bold",
                color,
                letterSpacing: p(U.heading) * 0.12,
                textTransform: "uppercase",
                marginBottom: p(data.subject ? 2 : 3.6),
                ...(layout.heading === "underline"
                  ? {
                      flexGrow: 1,
                      paddingBottom: p(1.2),
                      borderBottomWidth: p(0.3),
                      borderBottomColor: light,
                      borderBottomStyle: "solid",
                    }
                  : {}),
                ...(layout.heading === "pill"
                  ? {
                      backgroundColor: light,
                      paddingVertical: p(1),
                      paddingHorizontal: p(2.4),
                      borderRadius: p(4),
                    }
                  : {}),
              }}
            >
              {data.heading}
            </Text>
          </View>
          {data.subject ? (
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: p(3.6) }}>
              <Text style={{ color }}>{data.subjectLabel}</Text> {data.subject}
            </Text>
          ) : null}
          {paragraphsOf(data.text).map((paragraph, index) => (
            <Text key={index} style={{ marginBottom: p(U.gap), textAlign: "justify" }}>
              {paragraph}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function renderLetterPdf(input: LetterPdfInput) {
  return renderToBuffer(<LetterDocument {...input} />);
}
