import { useEffect, useRef, useState } from 'react';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Card, Spin, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSummary } from '../api/summary';

const keywordPattern =
  /\b(?:async|await|break|case|catch|class|const|continue|default|else|export|extends|false|finally|for|from|function|if|import|let|new|null|return|switch|throw|true|try|undefined|var|while|useState|useEffect|useMemo|useCallback|useContext|useRef)\b/;

const codeTokenPattern =
  /(\/\/.*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|<\/?[A-Za-z][\w.-]*|\b\d+(?:\.\d+)?\b|\b(?:async|await|break|case|catch|class|const|continue|default|else|export|extends|false|finally|for|from|function|if|import|let|new|null|return|switch|throw|true|try|undefined|var|while|useState|useEffect|useMemo|useCallback|useContext|useRef)\b|[{}()[\].,;:])/g;

function getTokenClass(token: string) {
  if (token.startsWith('//') || token.startsWith('/*')) {
    return 'code-token-comment';
  }
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
    return 'code-token-string';
  }
  if (token.startsWith('<')) {
    return 'code-token-tag';
  }
  if (/^\d/.test(token)) {
    return 'code-token-number';
  }
  if (keywordPattern.test(token)) {
    return 'code-token-keyword';
  }
  if (/^[{}()[\].,;:]$/.test(token)) {
    return 'code-token-punctuation';
  }
  return '';
}

function highlightCode(code: string) {
  const nodes = [];
  let lastIndex = 0;

  for (const match of code.matchAll(codeTokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(code.slice(lastIndex, index));
    }

    nodes.push(
      <span className={getTokenClass(token)} key={`${index}-${token}`}>
        {token}
      </span>,
    );
    lastIndex = index + token.length;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return nodes;
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const code = String(children).replace(/\n$/, '');
  const language = className?.match(/language-(\w+)/)?.[1];
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) {
        window.clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copiedTimer.current) {
        window.clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
      message.success('代码已复制');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-toolbar">
        {language ? <span className="markdown-code-language">{language}</span> : <span />}
        <button
          aria-label="复制代码"
          className="markdown-code-copy"
          onClick={copyCode}
          type="button"
        >
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </div>
      <pre>
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

export default function Summary() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSummary()
      .then((data) => setContent(data.content))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <h1 className="page-title">学习总结</h1>
      <Card className="summary-card">
        <div className="markdown-body">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const codeText = String(children);
                if (className?.startsWith('language-') || codeText.includes('\n')) {
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
            }}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </Card>
    </Spin>
  );
}
