import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare,
  Bold,
  Braces,
  Columns2,
  Eraser,
  Heading,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Sigma,
  Strikethrough,
} from 'lucide-react'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../../shared/ui/Button'
import { Input, Textarea } from '../../shared/ui/Field'
import { MarkdownPreview } from '../../shared/ui/MarkdownPreview'
import { InlineLoader } from '../../shared/ui/States'
import { fetchTopics } from '../topics/api'
import { createPost } from './api'

export function PostComposerPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bodyRef = useRef(null)
  const topicsQuery = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
      title: '',
      content_markdown: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values) => createPost(topicId, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      queryClient.invalidateQueries({ queryKey: ['topic-posts'] })
      queryClient.invalidateQueries({ queryKey: ['hot-posts'] })
      queryClient.invalidateQueries({ queryKey: ['post-search'] })
      navigate(`/posts/${data.id}`, { replace: true })
    },
    onError: (error) => {
      setError('root', { message: error.message })
    },
  })

  if (topicsQuery.isLoading) {
    return <InlineLoader label="正在加载编辑器..." />
  }

  const markdown = watch('content_markdown') || ''
  const bodyField = register('content_markdown', { required: '请输入正文内容' })

  const updateMarkdown = (nextValue, nextSelection) => {
    setValue('content_markdown', nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    window.requestAnimationFrame(() => {
      const textarea = bodyRef.current

      if (!textarea) {
        return
      }

      textarea.focus()
      textarea.setSelectionRange(nextSelection.start, nextSelection.end)
    })
  }

  const applyMarkdownFormat = (formatter) => {
    const textarea = bodyRef.current
    const start = textarea?.selectionStart ?? markdown.length
    const end = textarea?.selectionEnd ?? markdown.length
    const selectedText = markdown.slice(start, end)
    const result = formatter({
      value: markdown,
      start,
      end,
      selectedText,
    })

    updateMarkdown(result.value, result.selection)
  }

  const wrapSelection = (before, after = before, placeholder = '文本') => {
    applyMarkdownFormat(({ value, start, end, selectedText }) => {
      const text = selectedText || placeholder
      const nextValue = `${value.slice(0, start)}${before}${text}${after}${value.slice(end)}`
      const selectionStart = start + before.length

      return {
        value: nextValue,
        selection: {
          start: selectionStart,
          end: selectionStart + text.length,
        },
      }
    })
  }

  const insertBlock = (template, selectStart, selectEnd = selectStart) => {
    applyMarkdownFormat(({ value, start, end }) => {
      const needsLeadingBreak = start > 0 && value[start - 1] !== '\n'
      const needsTrailingBreak = end < value.length && value[end] !== '\n'
      const prefix = needsLeadingBreak ? '\n' : ''
      const suffix = needsTrailingBreak ? '\n' : ''
      const nextValue = `${value.slice(0, start)}${prefix}${template}${suffix}${value.slice(end)}`
      const offset = start + prefix.length

      return {
        value: nextValue,
        selection: {
          start: offset + selectStart,
          end: offset + selectEnd,
        },
      }
    })
  }

  const prefixLines = (prefix, placeholder) => {
    applyMarkdownFormat(({ value, start, end, selectedText }) => {
      const text = selectedText || placeholder
      const formatted = text
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n')
      const nextValue = `${value.slice(0, start)}${formatted}${value.slice(end)}`

      return {
        value: nextValue,
        selection: {
          start: start + prefix.length,
          end: start + formatted.length,
        },
      }
    })
  }

  const toolbarActions = [
    { icon: Heading, label: '标题', action: () => prefixLines('## ', '标题') },
    { icon: Bold, label: '加粗', action: () => wrapSelection('**', '**', '加粗文本') },
    { icon: Italic, label: '斜体', action: () => wrapSelection('*', '*', '斜体文本') },
    { icon: Quote, label: '引用', action: () => prefixLines('> ', '引用内容') },
    { icon: Link2, label: '链接', action: () => wrapSelection('[', '](https://example.com)', '链接文本') },
    { icon: Image, label: '图片', action: () => insertBlock('![图片描述](https://example.com/image.png)', 2, 6) },
    { icon: Braces, label: '代码', action: () => wrapSelection('`', '`', 'code') },
    { icon: List, label: '无序列表', action: () => prefixLines('- ', '列表项') },
    { icon: ListOrdered, label: '有序列表', action: () => prefixLines('1. ', '列表项') },
    { icon: Strikethrough, label: '删除线', action: () => wrapSelection('~~', '~~', '删除线文本') },
    { icon: CheckSquare, label: '任务列表', action: () => prefixLines('- [ ] ', '任务') },
    {
      icon: Columns2,
      label: '表格',
      action: () => insertBlock('| 标题 | 内容 |\n| --- | --- |\n| 示例 | 文本 |', 2, 4),
    },
    { icon: Sigma, label: '公式', action: () => wrapSelection('$', '$', 'E = mc^2') },
  ]

  return (
    <div className="space-y-6">
      <form className="overflow-hidden border-[3px] border-black" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="flex items-center justify-between border-b border-[#d9d9d9] px-6 py-4">
          <div className="min-w-0 flex-1 pr-6">
            <Input
              id="post-title"
              type="text"
              autoComplete="off"
              placeholder="请输入标题"
              className="border-none px-0 py-0 text-[20px] font-medium"
              {...register('title', { required: '请输入标题' })}
            />
          </div>
          <div className="flex items-center gap-4 text-[16px]">
            <span className="text-[#c9c9cf]">保存成功</span>
            <Button type="button" variant="ghost" className="rounded-[4px] border border-[#ef2f2f] px-4 py-2 text-[#ef2f2f]">
              草稿箱
            </Button>
            <Button type="submit" variant="primary" className="rounded-[4px] border-none px-4 py-2 text-[15px]" disabled={mutation.isPending}>
              {mutation.isPending ? '发布中…' : '发布'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#d9d9d9] px-5 py-3 text-[#585858]">
          <div className="flex flex-wrap items-center gap-3">
            {toolbarActions.map((item) => (
              <ToolbarIcon key={item.label} icon={item.icon} label={item.label} onClick={item.action} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ToolbarIcon
              icon={Eraser}
              label="清空"
              onClick={() => updateMarkdown('', { start: 0, end: 0 })}
            />
          </div>
        </div>

        <div className="grid min-h-[760px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 border-r border-[#d9d9d9]">
            <Textarea
              id="post-body"
              autoComplete="off"
              placeholder="请输入正文内容..."
              className="h-full min-h-[760px] w-full border-none px-6 py-5 text-[16px] leading-8"
              {...bodyField}
              ref={(element) => {
                bodyField.ref(element)
                bodyRef.current = element
              }}
            />
          </div>
          <div className="min-w-0 px-6 py-8">
            <MarkdownPreview
              value={markdown}
              emptyMessage="开始编写正文后，这里会显示 Markdown 预览。"
              className="w-full text-[17px] leading-8"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#d9d9d9] px-5 py-4 text-[13px] text-[#585858]">
          <div className="flex items-center gap-6">
            <span>字符数: {markdown.length}</span>
            <span>行数: {markdown.split('\n').length}</span>
            <span>正文字数: {markdown.replace(/\s/g, '').length}</span>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>同步滚动</span>
            </label>
            <button type="button" className="focus-ring">
              回到顶部
            </button>
          </div>
        </div>

        {(errors.title?.message || errors.content_markdown?.message || errors.root?.message) ? (
          <div className="border-t border-[#d9d9d9] px-5 py-3 text-sm text-[var(--accent-deep)]" aria-live="polite">
            {errors.title?.message || errors.content_markdown?.message || errors.root?.message}
          </div>
        ) : null}
      </form>
    </div>
  )
}

function ToolbarIcon({ icon: Icon, label, onClick }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="focus-ring flex h-7 w-7 items-center justify-center">
      <Icon aria-hidden="true" size={16} strokeWidth={2} />
    </button>
  )
}
