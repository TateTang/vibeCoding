import ReactMarkdown from 'react-markdown'

type MarkdownEditorProps = {
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

function MarkdownEditor({ onChange, placeholder = '请输入 Markdown 内容', value }: MarkdownEditorProps) {
  return (
    <div className="editor-layout">
      <section className="editor-panel">
        <div className="editor-panel-header">
          <h3>编辑器</h3>
          <span>Markdown</span>
        </div>
        <textarea
          className="markdown-textarea"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </section>

      <section className="editor-panel preview-panel">
        <div className="editor-panel-header">
          <h3>实时预览</h3>
          <span>Preview</span>
        </div>
        <div className="markdown-preview editor-preview-body">
          <ReactMarkdown>{value || '### 预览区\n\n开始输入内容后，这里会实时显示渲染结果。'}</ReactMarkdown>
        </div>
      </section>
    </div>
  )
}

export default MarkdownEditor