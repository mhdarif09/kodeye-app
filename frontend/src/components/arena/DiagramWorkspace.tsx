"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#1e1e1e] h-full">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  ),
});

interface DiagramWorkspaceProps {
  problem: string;
  template: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function DiagramWorkspace({ problem, template, value, onChange, readOnly }: DiagramWorkspaceProps) {
  const editorRef = useRef<any>(null);
  const isRemoteChange = useRef(false);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (val: string | undefined) => {
    if (isRemoteChange.current) return;
    onChange(val ?? "");
  };

  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current === value || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (model && model.getValue() !== value) {
      isRemoteChange.current = true;
      model.setValue(value);
      isRemoteChange.current = false;
    }
    prevValue.current = value;
  }, [value]);

  const handleRender = async () => {
    try {
      setMermaidError(null);
      const mermaid = await import("mermaid");
      mermaid.default.initialize({ theme: "dark", startOnLoad: false });
      const { svg } = await mermaid.default.render("mermaid-preview", value);
      setSvgContent(svg);
    } catch (err: any) {
      setMermaidError(err.message || "Failed to render diagram");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {problem && (
        <div className="px-4 py-2 bg-[#1e1e1e] border-b border-white/[0.06] shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-0.5">Problem</p>
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{problem}</p>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col w-1/2 min-w-0 border-r border-white/[0.06] bg-[#1e1e1e]">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-white/[0.06] shrink-0">
            <span className="text-xs text-white/35 font-mono tracking-wide">diagram.mmd</span>
            <button
              onClick={handleRender}
              className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white/80 transition-colors"
            >
              Render
            </button>
          </div>

          <MonacoEditor
            height="100%"
            language="mermaid"
            defaultValue={value}
            onChange={handleChange}
            onMount={handleMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'GeistMono', 'Fira Code', monospace",
              minimap: { enabled: false },
              lineNumbers: "off",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: "none",
              overviewRulerBorder: false,
              readOnly,
            }}
          />
        </div>

        <div className="flex flex-col w-1/2 bg-[#1e1e1e]">
          <div className="flex items-center px-4 py-1.5 bg-[#252526] border-b border-white/[0.06] shrink-0">
            <span className="text-xs text-white/35 font-mono tracking-wide">Preview</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {mermaidError ? (
              <div className="text-red-400 text-xs text-center">
                <p className="font-semibold mb-1">Render Error:</p>
                <p className="text-white/50">{mermaidError}</p>
              </div>
            ) : svgContent ? (
              <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: svgContent }} />
            ) : (
              <button
                onClick={handleRender}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Klik "Render" untuk melihat diagram
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
