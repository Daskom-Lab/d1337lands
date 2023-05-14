import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkBreaks from "remark-breaks";

export default function Activity() {
  const activity_md = `
  # **Daskom1337 Conference**

  Hello everyone, we are pleased to announce our **first ever conference**, it will happen in between one of the last three months of this year (2023) (exact date to be available soon), we will run this conference online and all talks will be recorded and uploaded to youtube so future people can benefit from it.

  The conference is currently only open for Dasar Komputer Laboratory assistant and ex-assistant, and it is planned to cover broad topics in technology ranging from highly technical things to some general career advice in this industry.

  ~~~txt
  These are the speakers that will bring you some awesome talks this year:

  +---+
  | 1 +-•  [Future Internet]
  +---+     by: Ade Aditya Ramadha a.k.a Adrama
           ____________________________________

           Ade is blablabla

  +---+
  | 2 +-•  [Code directly using Nvidia GPU]
  +---+     by: Iga Narendra Pramawijaya a.k.a IritaSee
           ____________________________________________

           Iga is blablabla

  +---+
  | 3 +-•  [How to make CPU for dummies]
  +---+     by: Muhammad Fakhri Putra Supriyadi a.k.a f4r4w4y
           __________________________________________________

           Fakhri is a software engineer with over than 7 years of experience, 
           he loves to deeply explore about technology especially in the computer 
           related worlds, he is now a senior software engineer in one of company
           in singapore.

           This time he will talk about how to make CPU from the point of not
           knowing anything about the fundamental of how a CPU work to be able
           to create one simple CPU in an FPGA and make an emulation of the CPU
           in python.
  ~~~  

  The CFP for this conference is still **open until August 2023**, you can submit it to 1337daskom@gmail.com with a subject "CFP 2023", we accept either paper or slides for the submission and dont worry about anything since we are still a new player in the conference world so we will basically accept anything as long as you are talking about tech things.

  We will keep you guys posted with everything about this conference, thankyou and see you all later!
  `;

  return (
    <div className="text-white font-ibm">
      <ReactMarkdown
        linkTarget="_blank"
        remarkPlugins={[remarkBreaks]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={dark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {activity_md}
      </ReactMarkdown>
    </div>
  );
}
