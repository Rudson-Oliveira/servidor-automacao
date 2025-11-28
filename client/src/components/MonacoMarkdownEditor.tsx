import React, { useState, useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface MonacoMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  height?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * 📝 MONACO MARKDOWN EDITOR
 * 
 * Editor Monaco com syntax highlighting para Markdown
 * Preview split-pane e atalhos Obsidian
 */
export default function MonacoMarkdownEditor({
  value,
  onChange,
  onSave,
  height = "600px",
  autoSave = true,
  autoSaveDelay = 2000,
}: MonacoMarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [localValue, setLocalValue] = useState(value);
  const editorRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar value externo com localValue
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-save
  useEffect(() => {
    if (!autoSave) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (localValue !== value) {
      autoSaveTimerRef.current = setTimeout(() => {
        onChange(localValue);
        if (onSave) {
          onSave();
          toast.success("Auto-save realizado");
        }
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [localValue, value, onChange, onSave, autoSave, autoSaveDelay]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configurar atalhos Obsidian
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      wrapSelection("**", "**");
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      wrapSelection("*", "*");
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      wrapSelection("[", "](url)");
    });

    // Ctrl+S para salvar
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onChange(localValue);
        onSave();
        toast.success("Nota salva!");
      }
    });
  };

  const wrapSelection = (before: string, after: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const selectedText = editor.getModel()?.getValueInRange(selection) || "";
    const replacement = `${before}${selectedText}${after}`;

    editor.executeEdits("", [
      {
        range: selection,
        text: replacement,
      },
    ]);

    // Mover cursor para posição correta
    if (!selectedText) {
      const newPosition = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length,
      };
      editor.setPosition(newPosition);
    }

    editor.focus();
  };

  const handleManualSave = () => {
    onChange(localValue);
    if (onSave) {
      onSave();
      toast.success("Nota salva!");
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Editor Markdown</span>
          <span className="text-xs text-muted-foreground">
            Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+K: Link | Ctrl+S: Save
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Esconder Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Mostrar Preview
              </>
            )}
          </Button>
          {onSave && (
            <Button variant="default" size="sm" onClick={handleManualSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          )}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={showPreview ? "w-1/2 border-r" : "w-full"}>
          <Editor
            height={height}
            defaultLanguage="markdown"
            value={localValue}
            onChange={(value) => setLocalValue(value || "")}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto p-6 bg-background">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {localValue}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
