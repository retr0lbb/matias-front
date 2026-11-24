import { API_BASE, toApiError } from "./client";
import type { DocumentType } from "./conversations";

/** What the panel shows: the document itself or its answer key. */
export type DocumentView = "document" | "answer-key";
export type DocumentFormat = "pdf" | "docx";

/** Only these types come with an answer key (gabarito). */
export function hasAnswerKey(documentType: DocumentType) {
  return documentType === "assessment" || documentType === "homework";
}

function documentPath(id: string, view: DocumentView, last: string) {
  const base = `/documents/${encodeURIComponent(id)}`;
  return view === "answer-key"
    ? `${base}/answer-key/${last}`
    : `${base}/${last}`;
}

/** The HTML preview page (`/preview` or `/answer-key/preview`). */
export async function getDocumentPreview(
  id: string,
  view: DocumentView,
  signal?: AbortSignal,
) {
  const path = documentPath(id, view, "preview");
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    credentials: "same-origin",
    // Always the latest version: a revision keeps the same id.
    cache: "no-store",
  });
  if (!res.ok) throw await toApiError(res, path);
  return res.text();
}

/** Reads the file name from `Content-Disposition`, if the backend sent one. */
function fileNameFrom(header: string | null) {
  if (!header) return;
  const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ""));
    } catch {
      // Malformed encoding: fall through to the plain parameter.
    }
  }
  return /filename\s*=\s*"?([^";]+)"?/i.exec(header)?.[1]?.trim();
}

/** A file name that's safe on every OS, from the document title. */
function safeFileName(title: string) {
  return (
    title
      .replace(/[\\/:*?"<>|\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "documento"
  );
}

/**
 * Downloads the PDF or DOCX. It's fetched first (instead of a plain link)
 * so an error answer shows a message instead of saving an error page.
 */
export async function downloadDocument({
  id,
  title,
  view,
  format,
}: {
  id: string;
  title: string;
  view: DocumentView;
  format: DocumentFormat;
}) {
  const path = documentPath(id, view, format);
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw await toApiError(res, path);

  const blob = await res.blob();
  const suffix = view === "answer-key" ? " - Gabarito" : "";
  const name =
    fileNameFrom(res.headers.get("Content-Disposition")) ??
    `${safeFileName(title)}${suffix}.${format}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before freeing it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
