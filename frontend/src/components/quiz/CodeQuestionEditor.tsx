"use client";

import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeQuestionEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeQuestionEditor({ value, onChange, language = "javascript", readOnly = false }: CodeQuestionEditorProps) {
  const handleMount: OnMount = (editor) => {
    setTimeout(() => editor.layout(), 100);
  };

  return (
    <div className="rounded-md overflow-hidden border border-border/50">
      <div className="bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/30">
        {language}
      </div>
      <MonacoEditor
        height="200px"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
          readOnly,
          fontSize: 13,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 8 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
