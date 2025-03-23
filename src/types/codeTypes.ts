export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
  explanation?: string;
}

export interface CodeContext {
  previousSnippets?: CodeSnippet[];
  currentFile?: string;
  selectedText?: string;
}

export interface CodeAssistanceResponse {
  response: string;
  suggestions: string[];
  codeSnippets: CodeSnippet[];
  references: string[];
}