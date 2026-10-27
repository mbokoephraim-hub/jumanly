/** Saves the PDF answered by the server; a refusal (redirect to a page) is an error. */
export async function savePdf(cvId: string) {
  const response = await fetch(`/app/career/cv/${cvId}/pdf`, { credentials: "same-origin" });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf"))
    throw new Error("export");
  const blob = await response.blob();
  const name =
    /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "CV.pdf";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
