"use client";

import { cn } from "cn";
import {
  ChevronDown,
  CircleAlert,
  Download,
  FileText,
  FileType,
  LoaderCircle,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  type DocumentFormat,
  type DocumentView,
  downloadDocument,
  getDocumentPreview,
  hasAnswerKey,
} from "@/lib/api/documents";
import { DOCUMENT_LABELS } from "@/lib/chat/labels";
import {
  type PanelDocument,
  useDocumentPanelStore,
} from "@/stores/document-panel-store";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const VIEW_LABELS: Record<DocumentView, string> = {
  document: "Documento",
  "answer-key": "Gabarito",
};

function errorMessage(error: unknown, action: "load" | "download") {
  if (error instanceof ApiError) {
    if (error.code === "EMAIL_NOT_VERIFIED") {
      return "Confirme seu e-mail para acessar o documento.";
    }
    if (error.status === 404) {
      return "Este documento não existe mais.";
    }
    if (error.status === 403 || error.status === 429) return error.message;
  }
  return action === "load"
    ? "Não foi possível carregar a pré-visualização."
    : "Não foi possível baixar o arquivo. Tente novamente.";
}

/**
 * Previews already fetched in this session, by id, version and view, so
 * switching tabs or reopening a document doesn't wait on the network again.
 */
const previewCache = new Map<string, string>();

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

function usePreview(document: PanelDocument, view: DocumentView) {
  const key = `${document.id}@${document.version}/${view}`;
  const [attempt, setAttempt] = useState(0);
  // Tagged with its key, so a result never shows under another document/tab.
  const [result, setResult] = useState<{ key: string; state: PreviewState }>();

  // `attempt` only re-runs the fetch when the user retries.
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    if (previewCache.has(key)) return;
    const controller = new AbortController();
    setResult({ key, state: { status: "loading" } });
    getDocumentPreview(document.id, view, controller.signal).then(
      (html) => {
        previewCache.set(key, html);
        setResult({ key, state: { status: "ready", html } });
      },
      (error) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          state: { status: "error", message: errorMessage(error, "load") },
        });
      },
    );
    return () => controller.abort();
  }, [key, attempt]);

  const cached = previewCache.get(key);
  const state: PreviewState = cached
    ? { status: "ready", html: cached }
    : result?.key === key
      ? result.state
      : { status: "loading" };

  return { state, retry: () => setAttempt((n) => n + 1) };
}

/** The side panel showing a generated document, its answer key and exports. */
export function DocumentPanel({ document }: { document: PanelDocument }) {
  const view = useDocumentPanelStore((s) => s.view);
  const setView = useDocumentPanelStore((s) => s.setView);
  const close = useDocumentPanelStore((s) => s.close);
  const withKey = hasAnswerKey(document.documentType);
  const activeView: DocumentView = withKey ? view : "document";

  const { state, retry } = usePreview(document, activeView);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [downloading, setDownloading] = useState<DocumentFormat | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // A download error is only relevant for a few seconds.
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  async function download(format: DocumentFormat) {
    setDownloading(format);
    setActionError(null);
    try {
      await downloadDocument({
        id: document.id,
        title: document.title,
        view: activeView,
        format,
      });
    } catch (error) {
      setActionError(errorMessage(error, "download"));
    } finally {
      setDownloading(null);
    }
  }

  function print() {
    iframeRef.current?.contentWindow?.print();
  }

  const ready = state.status === "ready";
  const subject = activeView === "answer-key" ? "o gabarito" : "o documento";

  return (
    <section
      aria-label={document.title}
      className="flex h-full min-h-0 flex-col bg-background"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-border px-4 pt-3 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
            <h2
              className="truncate text-[15px] font-medium"
              title={document.title}
            >
              {document.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {DOCUMENT_LABELS[document.documentType] ?? "Documento"} · versão{" "}
              {document.version}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={print}
              disabled={!ready}
              aria-label={`Imprimir ${subject}`}
              title="Imprimir"
              className="text-ink-2"
            >
              <Printer className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    disabled={downloading !== null}
                    aria-label={`Baixar ${subject}`}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 data-popup-open:bg-muted"
                  >
                    {downloading ? (
                      <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Baixar
                    <ChevronDown className="size-3.5 text-ink-3" />
                  </Button>
                }
              />
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-48 rounded-xl p-1.5 shadow-[0_12px_32px_#1c1a1726] ring-border"
              >
                <DropdownMenuItem
                  onClick={() => download("pdf")}
                  className="h-9 gap-2.5 rounded-lg px-2.5"
                >
                  <FileText className="text-ink-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => download("docx")}
                  className="h-9 gap-2.5 rounded-lg px-2.5"
                >
                  <FileType className="text-ink-2" />
                  Word (.docx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={close}
              aria-label="Fechar documento"
              title="Fechar"
              className="text-ink-2"
            >
              <X className="size-4.25" />
            </Button>
          </div>
        </div>

        {withKey && (
          <div
            role="tablist"
            aria-label="Conteúdo"
            className="flex w-fit gap-0.5 rounded-lg bg-muted p-0.5"
          >
            {(["document", "answer-key"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeView === tab}
                onClick={() => setView(tab)}
                className={cn(
                  "h-7 cursor-pointer rounded-md px-3 text-[13px] font-medium text-ink-2 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  activeView === tab &&
                    "bg-background text-foreground shadow-[0_1px_2px_#1c1a171f]",
                )}
              >
                {VIEW_LABELS[tab]}
              </button>
            ))}
          </div>
        )}

        {actionError && (
          <p
            role="alert"
            className="flex items-center gap-2 text-[13px] text-destructive"
          >
            <CircleAlert className="size-3.5 shrink-0" />
            {actionError}
          </p>
        )}
      </header>

      <div className="relative min-h-0 flex-1 bg-muted/50">
        {state.status === "ready" && (
          <PreviewFrame
            key={`${document.id}@${document.version}/${activeView}`}
            html={state.html}
            title={`${VIEW_LABELS[activeView]}: ${document.title}`}
            iframeRef={iframeRef}
          />
        )}
        {state.status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            Carregando {subject}…
          </div>
        )}
        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button
              variant="outline"
              onClick={retry}
              className="h-8 gap-2 rounded-lg px-3 text-[13px]"
            >
              <RotateCcw className="size-3.5" />
              Tentar de novo
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function PreviewFrame({
  html,
  title,
  iframeRef,
}: {
  html: string;
  title: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={html}
      // No scripts: the preview is static HTML made from model output.
      // Same-origin is needed so the print button can reach the frame.
      sandbox="allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox"
      onLoad={() => setLoaded(true)}
      className={cn(
        "size-full border-0 bg-white transition-opacity duration-200 motion-reduce:transition-none",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
