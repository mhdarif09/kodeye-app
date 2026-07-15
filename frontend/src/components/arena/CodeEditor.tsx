"use client";

import { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-[#1e1e1e] h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    ),
  }
);

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  mode: string;
  myRole: string;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function CodeEditor({ value, onChange, mode, myRole }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  const debouncedOnChange = useCallback(
    debounce((code: string) => {
      onChange(code);
    }, 300),
    [onChange]
  );

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (val: string | undefined) => {
    if (isRemoteChange.current) return;
    debouncedOnChange(val ?? "");
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
    <div className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-white/[0.06] shrink-0">
        <span className="text-xs text-white/35 font-mono tracking-wide">scratchpad.md</span>
        {mode === "coop" && (
          <span className="text-[10px] text-emerald-500/60 font-medium">🤝 Collaborative Edit</span>
        )}
      </div>

      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
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
          hideCursorInOverviewRuler: true,
          readOnly: mode === "duel" && myRole === "role_b",
        }}
      />
    </div>
  );
}
