import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

export function MarkdownPreview({
  value = '',
  emptyMessage = '开始输入后，这里会显示预览内容。',
  className = '',
}) {
  if (!value.trim()) {
    return (
      <div className={`rounded-[8px] border border-dashed border-[var(--line)] bg-white/45 p-5 text-sm text-[var(--muted)] ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      className={`prose prose-neutral max-w-none break-words text-black prose-headings:text-black prose-p:text-black prose-strong:text-black prose-li:text-black prose-blockquote:text-[#666] prose-code:text-black prose-pre:bg-[#fafafa] prose-pre:text-black prose-table:text-black ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
