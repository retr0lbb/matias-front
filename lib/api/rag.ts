import { API_BASE, apiFetch, toApiError } from "./client";

export type RagStatus = "PROCESSING" | "READY" | "FAILED";

/** `POST /rag/documents` (201). Processing continues in the background. */
export type RagUpload = {
  documentId: string;
  filename: string;
  status: RagStatus;
  conversationId: string | null;
};

/** One file of `POST /rag/documents/batch`; invalid files are `REJECTED`. */
export type RagBatchItem =
  | RagUpload
  | {
      documentId: null;
      filename: string;
      status: "REJECTED";
      error?: string;
    };

/** `GET /rag/documents/:id`. */
export type RagDocument = {
  id: string;
  filename: string;
  status: RagStatus;
  error: string | null;
  chunkCount: number;
  conversationId: string | null;
  createdAt: string;
};

export const RAG_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
/** Backend caps: one file up to 200 MB; a batch up to 10 files × 20 MB. */
export const RAG_MAX_SINGLE_BYTES = 200 * 1024 * 1024;
export const RAG_MAX_BATCH_BYTES = 20 * 1024 * 1024;
export const RAG_MAX_BATCH_FILES = 10;

export function isRagFile(file: File) {
  return /\.(pdf|docx)$/i.test(file.name);
}

type Progress = (loaded: number, total: number) => void;

/**
 * Multipart POST with upload progress (fetch can't report it).
 * Non-2xx answers become ApiError, like `apiFetch`.
 */
function postForm<T>(
  path: string,
  form: FormData,
  { onProgress, signal }: { onProgress?: Progress; signal?: AbortSignal },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded, event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error("Resposta inválida do servidor."));
        }
        return;
      }
      const res = new Response(xhr.responseText || null, {
        status: xhr.status,
      });
      toApiError(res, path).then(reject, reject);
    };
    xhr.onerror = () => reject(new Error("Falha de conexão ao enviar."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

function withConversation(path: string, conversationId: string) {
  return `${path}?conversationId=${encodeURIComponent(conversationId)}`;
}

/** Uploads one PDF/DOCX into the conversation (it may not exist yet). */
export function uploadRagDocument(
  file: File,
  conversationId: string,
  options: { onProgress?: Progress; signal?: AbortSignal } = {},
) {
  const form = new FormData();
  form.append("file", file);
  return postForm<RagUpload>(
    withConversation("/rag/documents", conversationId),
    form,
    options,
  );
}

/** Uploads 1–10 files (≤ 20 MB each); results come in the same order. */
export async function uploadRagDocuments(
  files: File[],
  conversationId: string,
  options: { onProgress?: Progress; signal?: AbortSignal } = {},
) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const result = await postForm<{ documents: RagBatchItem[] }>(
    withConversation("/rag/documents/batch", conversationId),
    form,
    options,
  );
  return result.documents;
}

export function getRagDocument(id: string, signal?: AbortSignal) {
  return apiFetch<RagDocument>(`/rag/documents/${encodeURIComponent(id)}`, {
    signal,
  });
}
