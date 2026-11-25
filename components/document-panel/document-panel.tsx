"use client";

import { cn } from "cn";
import {
  BookOpenText,
  ChevronDown,
  CircleAlert,
  Download,
  File,
  FileText,
  FileType,
  LoaderCircle,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { type DocumentPreviewMode, useUiStore } from "@/stores/ui-store";
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

const MODES = [
  {
    id: "page",
    label: "Página",
    icon: File,
    hint: "Página real, ajustada à largura",
  },
  {
    id: "reading",
    label: "Leitura",
    icon: BookOpenText,
    hint: "Texto reorganizado para ler na tela",
  },
] as const;

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
 * Screen-only overrides for the backend's preview page, which is laid out as
 * a printed sheet (A4 width, margins in mm). The media queries match the
 * iframe's width, so a narrow panel or a phone reflows the sheet instead of
 * squeezing it; printing still uses the backend's own page styles.
 */
const RESPONSIVE_PREVIEW_CSS = `
@media screen {
  img, svg, video { max-width: 100%; height: auto; }
  .sheet { overflow-wrap: break-word; }
  .block-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
@media screen and (max-width: 860px) {
  body { padding: 10px; }
  .sheet {
    padding: calc(var(--margin-top, 20mm) * 0.6) calc(var(--margin-right, 20mm) * 0.6)
      calc(var(--margin-bottom, 20mm) * 0.6) calc(var(--margin-left, 20mm) * 0.6);
  }
}
@media screen and (max-width: 560px) {
  html, body { background: #fff; }
  body { padding: 0; font-size: max(var(--base-size, 11pt), 14px); }
  .sheet { width: 100%; padding: 20px 16px 32px; box-shadow: none; }
  .header-brand { flex-wrap: wrap; }
  .header-logo { max-width: 40%; }
  .header-title { font-size: 1.25em; }
  .header-field { flex-basis: 100%; white-space: normal; }
  .header-field > :first-child { white-space: nowrap; }
  .block-table table { min-width: 100%; width: max-content; max-width: none; }
  .block-table th, .block-table td { min-width: 6em; max-width: 70vw; }
}
`;

/** "Página" keeps the sheet at its real width; the panel scales it to fit. */
const PAGE_PREVIEW_CSS = `
@media screen {
  .sheet { max-width: none; }
}
`;

/** Adds the mode's overrides after the backend's own styles. */
function withPreviewStyles(html: string, mode: DocumentPreviewMode) {
  const css = mode === "page" ? PAGE_PREVIEW_CSS : RESPONSIVE_PREVIEW_CSS;
  const style = `<style data-preview="${mode}">${css}</style>`;
  const headEnd = html.search(/<\/head>/i);
  return headEnd === -1
    ? style + html
    : html.slice(0, headEnd) + style + html.slice(headEnd);
}

/** A4 (210mm) plus the preview's 16px gutters, until the frame is measured. */
const FALLBACK_PAGE_WIDTH = 826;

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
  const mode = useUiStore((s) => s.documentPreviewMode);
  const setMode = useUiStore((s) => s.setDocumentPreviewMode);
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
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-border px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-4">
        <div className="flex items-start gap-2 sm:gap-3">
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
                    <span className="max-[380px]:sr-only">Baixar</span>
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

        <div className="flex flex-wrap items-center justify-between gap-2">
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
                  className={segmentClass(activeView === tab)}
                >
                  {VIEW_LABELS[tab]}
                </button>
              ))}
            </div>
          )}

          <fieldset
            aria-label="Modo de visualização"
            className="ml-auto flex w-fit gap-0.5 rounded-lg border-0 bg-muted p-0.5"
          >
            {MODES.map(({ id, label, icon: Icon, hint }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                title={hint}
                onClick={() => setMode(id)}
                className={cn(
                  segmentClass(mode === id),
                  "flex items-center gap-1.5 px-2.5",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </fieldset>
        </div>

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
            key={`${document.id}@${document.version}/${activeView}/${mode}`}
            html={state.html}
            mode={mode}
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

function segmentClass(active: boolean) {
  return cn(
    "h-7 cursor-pointer rounded-md px-3 text-[13px] font-medium text-ink-2 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
    active && "bg-background text-foreground shadow-[0_1px_2px_#1c1a171f]",
  );
}

/** Width the sheet needs to show unscaled: the sheet plus the body gutters. */
function measurePageWidth(frame: HTMLIFrameElement) {
  try {
    const doc = frame.contentDocument;
    const sheet = doc?.querySelector<HTMLElement>(".sheet");
    if (!doc || !sheet) return null;
    const body = doc.defaultView?.getComputedStyle(doc.body);
    const gutters =
      (Number.parseFloat(body?.paddingLeft ?? "0") || 0) +
      (Number.parseFloat(body?.paddingRight ?? "0") || 0);
    return sheet.offsetWidth + gutters;
  } catch {
    // Not reachable (e.g. a sandbox change): keep the fallback.
    return null;
  }
}

function PreviewFrame({
  html,
  mode,
  title,
  iframeRef,
}: {
  html: string;
  mode: DocumentPreviewMode;
  title: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const [loaded, setLoaded] = useState(false);
  const srcDoc = useMemo(() => withPreviewStyles(html, mode), [html, mode]);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [pageWidth, setPageWidth] = useState(FALLBACK_PAGE_WIDTH);

  // "Página" scales the frame to the panel, so it needs the panel's size.
  useLayoutEffect(() => {
    const node = boxRef.current;
    if (mode !== "page" || !node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  // Shrink only: a panel wider than the page shows it at its real size.
  const scale = mode === "page" && box ? Math.min(1, box.width / pageWidth) : 1;
  const scaled = box !== null && scale < 1;

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden">
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={srcDoc}
        // No scripts: the preview is static HTML made from model output.
        // Same-origin is needed so the print button can reach the frame.
        sandbox="allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox"
        onLoad={(e) => {
          const measured = measurePageWidth(e.currentTarget);
          if (measured) setPageWidth(measured);
          setLoaded(true);
        }}
        style={
          scaled
            ? {
                // Laid out at the page's width, then shrunk to the panel.
                width: pageWidth,
                height: box.height / scale,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }
            : undefined
        }
        className={cn(
          "border-0 bg-white transition-opacity duration-200 motion-reduce:transition-none",
          !scaled && "size-full",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
