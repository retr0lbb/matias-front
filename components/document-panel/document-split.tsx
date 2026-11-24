"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDocumentPanelStore } from "@/stores/document-panel-store";
import { DEFAULT_DOCUMENT_PANEL_WIDTH, useUiStore } from "@/stores/ui-store";
import { DocumentPanel } from "./document-panel";

/** The panel never gets narrower than this, nor leaves the chat narrower. */
const PANEL_MIN = 380;
const CHAT_MIN = 400;
const KEY_STEP = 32;

/**
 * The chat with the document panel beside it. On large screens it's a split
 * view with a draggable divider; on smaller ones the panel covers the chat.
 */
export function DocumentSplit({ children }: { children: ReactNode }) {
  const document = useDocumentPanelStore((s) => s.document);
  const close = useDocumentPanelStore((s) => s.close);
  const width = useUiStore((s) => s.documentPanelWidth);
  const setWidth = useUiStore((s) => s.setDocumentPanelWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  // The panel belongs to this conversation: close it on the way out.
  useEffect(() => close, [close]);

  function clamp(next: number) {
    const total = containerRef.current?.clientWidth ?? 0;
    const max = Math.max(PANEL_MIN, total - CHAT_MIN);
    return Math.round(Math.min(max, Math.max(PANEL_MIN, next)));
  }

  function resizeTo(clientX: number) {
    const right = containerRef.current?.getBoundingClientRect().right ?? 0;
    setWidth(clamp(right - clientX));
  }

  return (
    <div
      ref={containerRef}
      data-resizing={resizing || undefined}
      className="flex h-full min-w-0 flex-1 data-resizing:cursor-col-resize data-resizing:select-none data-resizing:[&_iframe]:pointer-events-none"
    >
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>

      {document && (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: a focusable splitter, not a rule */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel do documento"
            aria-valuenow={width}
            aria-valuemin={PANEL_MIN}
            tabIndex={0}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setResizing(true);
            }}
            onPointerMove={(e) => {
              if (resizing) resizeTo(e.clientX);
            }}
            onPointerUp={() => setResizing(false)}
            onPointerCancel={() => setResizing(false)}
            onDoubleClick={() => setWidth(clamp(DEFAULT_DOCUMENT_PANEL_WIDTH))}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setWidth(clamp(width + KEY_STEP));
              else if (e.key === "ArrowRight")
                setWidth(clamp(width - KEY_STEP));
              else return;
              e.preventDefault();
            }}
            className="group relative hidden w-px shrink-0 cursor-col-resize bg-border outline-none lg:block"
          >
            {/* Wider invisible hit area, with a visible line on hover/drag. */}
            <span className="absolute inset-y-0 -left-1.5 w-3" />
            <span
              className={`absolute inset-y-0 -left-px w-0.75 rounded-full transition-colors group-hover:bg-ring/30 group-focus-visible:bg-ring/50 ${resizing ? "bg-ring/50" : ""}`}
            />
          </div>

          <aside
            style={{ "--panel-w": `${width}px` } as CSSProperties}
            className="fixed inset-0 z-40 animate-in fade-in-0 slide-in-from-right-4 duration-200 motion-reduce:animate-none lg:static lg:z-auto lg:w-[clamp(380px,var(--panel-w),calc(100%-400px))] lg:shrink-0"
          >
            <DocumentPanel key={document.id} document={document} />
          </aside>
        </>
      )}
    </div>
  );
}
