import ReactMarkdown from "react-markdown"
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter"
import {dark} from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkBreaks from "remark-breaks";

export default function Activity() {
  const activity_md = `
  **Hello there**, we currently have no idea what to put here, so go ahead look on to the other page while we're trying to figure this out.
  `;
  
  return (
    <div className="text-white font-overpassm">
      <ReactMarkdown
        linkTarget="_blank"
        remarkPlugins={[remarkBreaks]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={dark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                { String(children).replace(/\n$/, '') }
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                { children }
              </code>
            )
          }
        }}
      >
        { activity_md }
      </ReactMarkdown>
    </div>
  );
}
