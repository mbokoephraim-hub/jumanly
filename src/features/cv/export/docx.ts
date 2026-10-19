/**
 * « Word » export of a CV (planche studio-cv § 3, `career.cv.export.docxNote`): the same content
 * as the PDF, simplified on one column so it stays easy to edit. Plain WordprocessingML zipped
 * with fflate; the file carries the person's name only, no Jumanly title, author or mark.
 */
import { strToU8, zipSync } from "fflate";
import type { CvDocumentBlock, CvDocumentData, CvDocumentItem } from "../render/model";

const escape = (text: string) =>
  text
    // Characters XML 1.0 refuses (controls other than tab, new line and return).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type Run = { text: string; bold?: boolean; italic?: boolean; muted?: boolean };

function run({ text, bold, italic, muted }: Run) {
  const props = [
    bold ? "<w:b/>" : "",
    italic ? "<w:i/>" : "",
    muted ? '<w:color w:val="555555"/>' : "",
  ].join("");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${escape(text)}</w:t></w:r>`;
}

function paragraph(runs: Run[], style?: string, bullet = false) {
  const props = [
    style ? `<w:pStyle w:val="${style}"/>` : "",
    bullet ? '<w:ind w:left="360" w:hanging="220"/>' : "",
  ].join("");
  const body = (bullet ? [{ text: "• " }, ...runs] : runs).filter((item) => item.text);
  return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ""}${body.map(run).join("")}</w:p>`;
}

function item(entry: CvDocumentItem) {
  const out = [
    paragraph(
      [
        { text: entry.title, bold: true },
        ...(entry.period ? [{ text: ` ${entry.period}`, muted: true }] : []),
      ],
      "Item",
    ),
  ];
  if (entry.subtitle) out.push(paragraph([{ text: entry.subtitle, italic: true }]));
  if (entry.text) out.push(paragraph([{ text: entry.text }]));
  for (const line of entry.bullets ?? []) out.push(paragraph([{ text: line }], undefined, true));
  if (entry.tools) out.push(paragraph([{ text: entry.tools, muted: true }]));
  return out.join("");
}

function block(section: CvDocumentBlock) {
  const title = paragraph([{ text: section.title }], "Heading2");
  switch (section.type) {
    case "summary":
      return title + paragraph([{ text: section.text }]);
    case "highlights":
      return (
        title + section.bullets.map((line) => paragraph([{ text: line }], undefined, true)).join("")
      );
    case "skills":
      return (
        title +
        section.skills
          .map((skill) =>
            paragraph([
              { text: skill.name, bold: true },
              { text: ` · ${skill.levelLabel}`, muted: true },
            ]),
          )
          .join("")
      );
    case "languages":
      return (
        title +
        section.languages
          .map((language) =>
            paragraph([
              { text: language.name, bold: true },
              { text: ` · ${language.levelLabel}`, muted: true },
            ]),
          )
          .join("")
      );
    case "interests":
      return title + paragraph([{ text: section.names.join(" · ") }]);
    case "publications":
    case "talks":
      return title + section.references.map(item).join("");
    default:
      return title + section.items.map(item).join("");
  }
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="2" w:color="999999"/></w:pBdr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:caps/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Item"><w:name w:val="Item"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="20"/></w:pPr></w:style>
</w:styles>`;

/** The .docx file of a CV: name, title, contact, then every block in reading order. */
export function cvDocx(data: CvDocumentData): Uint8Array {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const contact = data.contact
    .map((line) => (line.label ? `${line.label} : ${line.value}` : line.value))
    .join(" · ");
  const body = [
    paragraph([{ text: name }], "Title"),
    data.headline ? paragraph([{ text: data.headline }], "Subtitle") : "",
    contact ? paragraph([{ text: contact, muted: true }]) : "",
    ...data.blocks.map(block),
  ].join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escape(name)}</dc:title><dc:creator>${escape(name)}</dc:creator><dc:language>${data.language}</dc:language></cp:coreProperties>`;
  return zipSync({
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`),
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "word/document.xml": strToU8(document),
    "word/styles.xml": strToU8(STYLES),
    "docProps/core.xml": strToU8(core),
  });
}
