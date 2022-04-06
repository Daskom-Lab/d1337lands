import ReactMarkdown from "react-markdown"
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter"
import {dark} from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkBreaks from "remark-breaks";

export default function Aboutus() {
  const aboutus_md = `
  [+] We basically consist of some of people from Dasar Komputer Laboratory that somehow manage their way to love technology and some even goes really far into it up to the level that we couldn't describe, so instead of finding and recruiting people from the wild, we created a community like this to share and learn knowledge together (for free, because we are indonesian, and we love everything for free).

  [+] We are ofcourse the creator of this thing (and almost everything since 2017 in daskom were, are and probably will always be created by us) including the [daskomlab web application](https://daskomlab.com/) that daskom is using for everyday practicum.

  [+] We also have a [youtube channel](https://www.youtube.com/channel/UCl51jsRs074Ve1cyXxrbhxA) with running lists of videos that will probably and hopefully gives you knowledge and understanding about magic, science, and crafts in the digital world.

  [+] We hold several events to give knowledge for free for all of you (and us) which are [weekend crash course](https://github.com/Daskom-Lab/weekend-crash-course), [prochef academy](https://github.com/Daskom-Lab/2021-Academy) and [capture the flag](https://daskom-lab.github.io/daskomctf).
  `;
  
  return (
    <div className="text-white font-overpassm">
      <ReactMarkdown
        children={aboutus_md}
        linkTarget="_blank"
        remarkPlugins={[remarkBreaks]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, '')}
                style={dark}
                language={match[1]}
                PreTag="div"
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      />
    </div>
  );
}
