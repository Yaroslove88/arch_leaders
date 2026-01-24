'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-obsidian-core rounded-lg border border-ui-border-soft">
      <span className="text-ui-text-muted">Загрузка редактора...</span>
    </div>
  ),
});

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'handlebars' | 'plaintext' | 'json';
  height?: string;
  readOnly?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  language = 'handlebars',
  height = '400px',
  readOnly = false,
}: PromptEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
    
    // Register Handlebars-like language if needed
    if (language === 'handlebars') {
      try {
        // Monaco doesn't have built-in Handlebars, use plaintext with custom highlighting
        editor.updateOptions({
          wordBasedSuggestions: 'off',
          quickSuggestions: false,
        });
      } catch (e) {
        console.warn('Failed to configure editor:', e);
      }
    }
  }, [language]);

  const handleChange = useCallback((val: string | undefined) => {
    onChange(val || '');
  }, [onChange]);

  // Custom theme colors matching our design system
  const beforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme('architectural-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280' },
        { token: 'keyword', foreground: '60a5fa' },
        { token: 'string', foreground: '34d399' },
        { token: 'variable', foreground: 'f59e0b' },
        { token: 'number', foreground: 'c084fc' },
      ],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#e5e5e5',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editor.selectionBackground': '#3b82f644',
        'editorCursor.foreground': '#3b82f6',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.selectionHighlightBackground': '#3b82f622',
      },
    });
  }, []);

  return (
    <div className="border border-ui-border-soft rounded-lg overflow-hidden" style={{ height }}>
      <Editor
        height="100%"
        language={language === 'handlebars' ? 'plaintext' : language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        beforeMount={beforeMount}
        theme="architectural-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          bracketPairColorization: {
            enabled: true,
          },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
}

// JSON-specific editor variant
export function JsonEditor({
  value,
  onChange,
  height = '300px',
  readOnly = false,
}: Omit<PromptEditorProps, 'language'>) {
  return (
    <PromptEditor
      value={value}
      onChange={onChange}
      language="json"
      height={height}
      readOnly={readOnly}
    />
  );
}
