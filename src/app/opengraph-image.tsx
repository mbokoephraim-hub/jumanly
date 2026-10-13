import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import messages from "../../messages/fr.json";

/** Site-wide Open Graph image: the Jumanly logo and slogan on Sapin. */
export const alt = messages.home.seo.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/marque/jumanly-logo-negatif.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 40,
        padding: 96,
        background: "#0F3F37",
        color: "#A6F26B",
        fontSize: 64,
        fontWeight: 600,
      }}
    >
      {}
      <img src={logoSrc} height={120} alt="" />
      <div style={{ display: "flex" }}>{messages.common.slogan}</div>
    </div>,
    size,
  );
}
