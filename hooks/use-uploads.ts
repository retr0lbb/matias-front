"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getRagDocument,
  isRagFile,
  RAG_MAX_BATCH_BYTES,
  RAG_MAX_BATCH_FILES,
  RAG_MAX_SINGLE_BYTES,
  type RagBatchItem,
  uploadRagDocument,
  uploadRagDocuments,
} from "@/lib/api/rag";
import { formatBytes } from "@/lib/usage-format";
import { useUsageStore } from "@/stores/usage-store";

export type UploadState = "uploading" | "processing" | "ready" | "failed";

export type Upload = {
  key: string;
  name: string;
  size: number;
  state: UploadState;
  /** 0–1 while the bytes are being sent. */
  progress: number;
  /** When processing started, to tell the teacher big files take longer. */
  processingSince: number | null;
  documentId: string | null;
  error: string | null;
};

/** Most files are ready in ~4s; big ones take minutes. */
const FIRST_POLL_MS = 1000;
const MAX_POLL_MS = 5000;
const POLL_GROWTH = 1.5;
/** Files picked together go in one batch request (backend: 10 × 20 MB). */
const MAX_FILES_PER_MESSAGE = 10;

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `upload_${Date.now()}_${keyCounter}`;
}

function uploadError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "EMAIL_NOT_VERIFIED") {
      return "Confirme seu e-mail para enviar arquivos.";
    }
    switch (error.status) {
      case 400:
      case 415:
        return "Formato não aceito. Envie um PDF ou DOCX.";
      case 413:
        return "Arquivo grande demais ou armazenamento cheio no seu plano.";
      case 429:
        return "Você atingiu o limite de envios deste ciclo.";
      case 403:
        return "Seu plano não permite este envio.";
    }
  }
  return "Não foi possível enviar o arquivo.";
}

/** The backend's FAILED reasons are technical (and in English). */
function processingError(error: string | null) {
  if (error && /restart/i.test(error)) {
    return "O processamento foi interrompido. Envie de novo.";
  }
  return "Não foi possível ler o arquivo. PDFs escaneados (só imagem) não são aceitos.";
}

/**
 * Files attached in a composer: uploads them right away into
 * `conversationId` and polls until each one is ready to be searched.
 *
 * A new chat has no id yet, so one is made up here; the backend creates the
 * conversation with that id on the first message.
 */
export function useUploads(conversationId: string | null) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  /** Made on the first attach of a new chat, and dropped when emptied. */
  const draftId = useRef<string | null>(null);
  const loadUsage = useUsageStore((s) => s.load);

  const alive = useRef(true);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const aborts = useRef(new Map<string, AbortController>());
  /** Removed while their (shared) batch request was still going. */
  const removed = useRef(new Set<string>());

  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    const requests = aborts.current;
    return () => {
      alive.current = false;
      for (const timer of pending.values()) clearTimeout(timer);
      for (const controller of requests.values()) controller.abort();
      pending.clear();
      requests.clear();
    };
  }, []);

  const patch = useCallback((key: string, changes: Partial<Upload>) => {
    if (!alive.current) return;
    setUploads((list) =>
      list.map((u) => (u.key === key ? { ...u, ...changes } : u)),
    );
  }, []);

  const poll = useCallback(
    (key: string, documentId: string, delay = FIRST_POLL_MS) => {
      const timer = setTimeout(async () => {
        timers.current.delete(key);
        if (!alive.current || removed.current.has(key)) return;
        const controller = new AbortController();
        aborts.current.set(key, controller);
        const next = Math.min(MAX_POLL_MS, delay * POLL_GROWTH);
        try {
          const doc = await getRagDocument(documentId, controller.signal);
          if (doc.status === "READY") {
            patch(key, { state: "ready", error: null });
          } else if (doc.status === "FAILED") {
            patch(key, { state: "failed", error: processingError(doc.error) });
          } else {
            poll(key, documentId, next);
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          if (error instanceof ApiError && error.status === 404) {
            patch(key, {
              state: "failed",
              error: "O arquivo não foi encontrado.",
            });
          } else {
            // A blip in the connection: keep checking, slower.
            poll(key, documentId, MAX_POLL_MS);
          }
        } finally {
          aborts.current.delete(key);
        }
      }, delay);
      timers.current.set(key, timer);
    },
    [patch],
  );

  /** The upload answered: start polling, or mark it failed. */
  const accepted = useCallback(
    (key: string, item: RagBatchItem) => {
      if (removed.current.has(key)) return;
      if (item.status === "REJECTED" || !item.documentId) {
        patch(key, {
          state: "failed",
          error: "Formato não aceito. Envie um PDF ou DOCX.",
        });
        return;
      }
      if (item.status === "READY") {
        patch(key, { state: "ready", documentId: item.documentId });
        return;
      }
      if (item.status === "FAILED") {
        patch(key, { state: "failed", error: processingError(null) });
        return;
      }
      patch(key, {
        state: "processing",
        progress: 1,
        processingSince: Date.now(),
        documentId: item.documentId,
      });
      poll(key, item.documentId);
    },
    [patch, poll],
  );

  const send = useCallback(
    async (batch: { key: string; file: File }[], target: string) => {
      const controller = new AbortController();
      for (const { key } of batch) aborts.current.set(key, controller);
      const total = batch.reduce((sum, { file }) => sum + file.size, 0);
      const onProgress = (loaded: number) => {
        const progress = total ? Math.min(1, loaded / total) : 1;
        for (const { key } of batch) patch(key, { progress });
      };
      try {
        if (batch.length === 1) {
          const result = await uploadRagDocument(batch[0].file, target, {
            onProgress,
            signal: controller.signal,
          });
          accepted(batch[0].key, result);
        } else {
          const results = await uploadRagDocuments(
            batch.map((b) => b.file),
            target,
            { onProgress, signal: controller.signal },
          );
          batch.forEach(({ key }, i) => {
            const item = results[i];
            if (item) accepted(key, item);
            else patch(key, { state: "failed", error: uploadError(null) });
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        for (const { key } of batch) {
          patch(key, { state: "failed", error: uploadError(error) });
        }
      } finally {
        for (const { key } of batch) {
          if (aborts.current.get(key) === controller) {
            aborts.current.delete(key);
          }
        }
        // The upload counter and storage changed.
        if (alive.current) loadUsage();
      }
    },
    [accepted, patch, loadUsage],
  );

  const add = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const usage = useUsageStore.getState().usage;
      const maxFile = Math.min(
        RAG_MAX_SINGLE_BYTES,
        usage?.maxFileBytes ?? RAG_MAX_SINGLE_BYTES,
      );
      const remaining =
        usage?.uploads.limit != null
          ? Math.max(0, usage.uploads.limit - usage.uploads.used)
          : Number.POSITIVE_INFINITY;
      const room = Math.max(
        0,
        MAX_FILES_PER_MESSAGE -
          uploads.filter((u) => u.state !== "failed").length,
      );

      const created: Upload[] = [];
      const toSend: { key: string; file: File }[] = [];
      for (const file of files) {
        const base: Upload = {
          key: newKey(),
          name: file.name,
          size: file.size,
          state: "uploading",
          progress: 0,
          processingSince: null,
          documentId: null,
          error: null,
        };
        let error: string | null = null;
        if (!isRagFile(file))
          error = "Formato não aceito. Envie um PDF ou DOCX.";
        else if (file.size > maxFile)
          error = `Maior que o limite de ${formatBytes(maxFile)} por arquivo.`;
        else if (toSend.length >= room)
          error = `Envie no máximo ${MAX_FILES_PER_MESSAGE} arquivos por mensagem.`;
        else if (toSend.length >= remaining)
          error = "Você atingiu o limite de envios deste ciclo.";

        if (error) {
          created.push({ ...base, state: "failed", error });
        } else {
          created.push(base);
          toSend.push({ key: base.key, file });
        }
      }
      setUploads((list) => [...list, ...created]);
      if (toSend.length === 0) return;

      draftId.current ??= crypto.randomUUID();
      const target = conversationId ?? draftId.current;

      // Small files picked together share one request; big ones go alone.
      const small = toSend.filter((t) => t.file.size <= RAG_MAX_BATCH_BYTES);
      const big = toSend.filter((t) => t.file.size > RAG_MAX_BATCH_BYTES);
      for (let i = 0; i < small.length; i += RAG_MAX_BATCH_FILES) {
        void send(small.slice(i, i + RAG_MAX_BATCH_FILES), target);
      }
      for (const item of big) void send([item], target);
    },
    [uploads, send, conversationId],
  );

  const remove = useCallback(
    (key: string) => {
      const timer = timers.current.get(key);
      if (timer) clearTimeout(timer);
      timers.current.delete(key);
      const controller = aborts.current.get(key);
      aborts.current.delete(key);
      // A batch shares one request: cancel it only if no other file needs it.
      if (controller) {
        const shared = [...aborts.current.values()].includes(controller);
        if (shared) removed.current.add(key);
        else controller.abort();
      }
      // There's no delete route: a file already sent stays in its
      // conversation. In a chat not started yet, the next attach gets a
      // fresh id, which leaves the removed files behind.
      if (uploads.every((u) => u.key === key)) draftId.current = null;
      setUploads((list) => list.filter((u) => u.key !== key));
    },
    [uploads],
  );

  /** After sending: the files now belong to the conversation. */
  const clear = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    for (const key of aborts.current.keys()) removed.current.add(key);
    setUploads([]);
    draftId.current = null;
  }, []);

  const pending = uploads.some(
    (u) => u.state === "uploading" || u.state === "processing",
  );
  const ready = uploads.filter((u) => u.state === "ready");

  return {
    uploads,
    add,
    remove,
    clear,
    /**
     * For a new chat with files, the id to create it with (the files were
     * uploaded there). Read it when sending.
     */
    draftConversationId: () => draftId.current,
    pending,
    ready,
  };
}
