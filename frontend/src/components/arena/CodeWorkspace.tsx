"use client";

import { useRef, useEffect } from "react";
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

interface CodeWorkspaceProps {
  problem: string;
  template: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeWorkspace({ problem, template, language, value, onChange, readOnly }: CodeWorkspaceProps) {
  const editorRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {problem && (
        <div className="px-4 py-2 bg-[#1e1e1e] border-b border-white/[0.06] shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-0.5">Problem</p>
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-mono">{problem}</p>
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e]">
        <div className="flex items-center px-4 py-1.5 bg-[#252526] border-b border-white/[0.06] shrink-0">
          <span className="text-xs text-white/35 font-mono tracking-wide">solution.{language}</span>
        </div>

        <MonacoEditor
          height="100%"
          language={language}
          defaultValue={value}
          onChange={handleChange}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'GeistMono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "none",
            overviewRulerBorder: false,
            readOnly,
          }}
        />
      </div>
    </div>
  );
}
