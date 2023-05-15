import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkBreaks from "remark-breaks";

export default function Activity() {
  const activity_md = `
  # **Daskom1337 Conference**

  Hello everyone, we are pleased to announce our **first ever conference**, it will happen in between one of the last three months of this year (2023) (exact date to be available soon), we will run this conference online and all talks will be recorded and uploaded to youtube so future people can benefit from it.

  The conference is currently only open for Dasar Komputer Laboratory assistant and ex-assistant, and the goal of it is to cover broad topics in technology ranging from highly technical things to some general career advice in this industry.

  ~~~txt
  These are the speakers that will bring you some awesome talks this year:

  +---+
  | 1 +-•  [Future Internet]
  +---+     by: Ade Aditya Ramadha a.k.a Adrama
           ____________________________________

           Ade is a researcher at Telkom University's NDN Research Group and 
           has published several papers and books on computer networks. He likes 
           learning about new technologies and sharing his knowledge with others. 

           Ade is a master's student of electrical engineering specializing in 
           computer networks at Telkom University.

           This time he will talk about Named Data Networking (NDN), one of the 
           future Internet network candidates to resolve several current Internet 
           problems and implement a simple File Transfer Protocol (FTP) using NDN 
           to show the improvement over the implemented Internet Protocol (IP).

  +---+
  | 2 +-•  [Code directly using Nvidia GPU]
  +---+     by: Iga Narendra Pramawijaya a.k.a IritaSee
           ____________________________________________

           Quarter time reader, part time coder, full time learner. That is how 
           Iga describe himself. 
           
           Iga is a Master's Student based in Gumi, North Gyeongsang, South Korea 
           and specialising in Digital Medical Signal Processing. Passionate about 
           science with 12 years experience in computer programming, interpersonal 
           skills for working in a team and successfully completing several projects.

           This time, he will talk about how GPU can solve computational problem 
           in an accelerated way, promising to deliver advanced computations and 
           simulations. Sessions will be delivered in C programming language and 
           hopefully this session could inspire cross-field-colaboration projects 
           in the future.

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

  (More people will hopefully add to this)
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
