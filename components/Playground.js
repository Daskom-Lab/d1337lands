import React from 'react';
import { FitAddon } from 'xterm-addon-fit';
import { XTerm } from 'xterm-for-react';

class CustomTerminal extends React.Component {
  constructor(props) {
    super(props)
    this.xtermRef = React.createRef()
    this.fitAddon = new FitAddon();

    this.state = {
      currentDirectory: "/",
      currentUser: "guest",
      isInProcess: false,
      input: "",
    }
  }

  printInitialPrompt() {
    this.xtermRef.current.terminal.write(`\r+===================================================================+
      \r|                                                                   |
      \r|  Welcome to Daskom1337 Playground,                                |
      \r|                                                                   |
      \r|  type "help" to display list of available commands                |
      \r|  type "help {command}" to display usage of that command           |
      \r|                                                                   |
      \r|  Go play and enjoy yourself in our playground !!!                 |
      \r|                                                                   |
      \r|  psst, if you happened to be one of daskom1337 community          |
      \r|  member, you can type "login" to log yourself in (ofc right)      |
      \r|  to psst (dont tell them) play some game by typing "startgame"    |
      \r|                                                                   |
      \r+===================================================================+
    \r`);
  }

  printTerminalPrompt() {
    if (this.state.input !== "clear")
      this.xtermRef.current.terminal.write("\r\n")

    let cleanDir = this.state.currentDirectory === "/" ? this.state.currentDirectory : this.state.currentDirectory.slice(0, -1)
    this.xtermRef.current.terminal.write(`\r
      \x1b[A\r${this.state.currentUser}@daskom1337 ${cleanDir} ${this.state.currentUser === "root" ? "#" : "$"} `);
    this.setState({ input: "" })
  }

  sleep = ms => new Promise(r => setTimeout(r, ms));

  handleInput = (input) => {
    // TODO: implement more advance parser for piping commands or commands with parameters and stuff
    //       by handling space, dash (-), quote [double and single] (", ') and other characters

    let inputArgs = input.split(" ")
    let command = inputArgs.shift()
    switch (command) {
      case "clear":
        this.xtermRef.current.terminal.clear()
        this.xtermRef.current.terminal.write("\x1b[2J\r")
        break;

      case "cat":
        let output = ""
        inputArgs.forEach(arg => {
          let cleanDir = this.state.currentDirectory === "/" ? this.state.currentDirectory : this.state.currentDirectory.slice(0, -1)
          let nodeNames = this.props.fileTree[cleanDir].map(node => node.name) 
          if (nodeNames.includes(arg)) {
            if (this.props.fileTree[cleanDir][nodeNames.indexOf(arg)].type === "file")
              output += `\r\n${this.props.fileTree[cleanDir][nodeNames.indexOf(arg)].content}`
            else
              output += `\r\ncat: ${arg}: Is a directory`
          } else {
            output += `\r\ncat: ${arg}: No such file or directory`
          }
        });

        this.xtermRef.current.terminal.write(output)
        break;

      case "ls":
        let cleanDir = this.state.currentDirectory === "/" ? this.state.currentDirectory : this.state.currentDirectory.slice(0, -1)
        let tree = this.props.fileTree[cleanDir]

        this.xtermRef.current.terminal.write("\r\n")

        let i = 0;
        tree.forEach(node => {
          if (!node.name.startsWith(".")) {
            if (node.type === "file")
              this.xtermRef.current.terminal.write(`${node.name}`)
            else
              this.xtermRef.current.terminal.write(`[${node.name}]`)
            
            if (i != tree.length - 1) {
              this.xtermRef.current.terminal.write(" ")
            }
          }
          
          i++; 
        });
        break;

      case "cd":
        if (inputArgs.length > 1) {
          this.xtermRef.current.terminal.write("\r\ncd: Only need one argument")
          return
        } else if (inputArgs.length === 0) {
          this.setState({ currentDirectory: "/" })
          return
        }

        let dirChange = this.state.currentDirectory
        inputArgs[0].split("/").forEach(dir => {
          dir = dir.trim()

          if (dir === ".." && dirChange !== "/") 
            dirChange = `${dirChange.split("/").slice(0, -2).join("/")}/`
          else if (!["", ".."].includes(dir)) 
            dirChange += `${dir}/`
        })

        if (dirChange === "/" || Object.keys(this.props.fileTree).includes(dirChange.slice(0, -1)))
          this.setState({ currentDirectory: dirChange })
        else 
          this.xtermRef.current.terminal.write(`\r\ncd: no such file or directory: ${inputArgs[0]}`)
        break;

      default:
        this.xtermRef.current.terminal.write(`\r\ncommand not found: ${this.state.input}`)
        break;
    }
  }

  componentDidMount() {
    this.fitAddon.fit()
    this.printInitialPrompt()
    this.printTerminalPrompt()
  }

  render() {
    return (
      <>
        <XTerm
          className="w-full h-full border-2 overflow-none border-slate-400 rounded-xl mt-6 shadow-l"
          ref={this.xtermRef}
          options={{
            cursorBlink: true,
            scrollback: 0,
            theme: {
              background:    "#0A0E14",
              foreground:    "#B3B1AD",
              black:         "#01060E",
              red:           "#EA6C73",
              green:         "#91B362",
              yellow:        "#F9AF4F",
              blue:          "#53BDFA",
              magenta:       "#FAE994",
              cyan:          "#90E1C6",
              white:         "#C7C7C7",
              brightBlack:   "#686868",
              brightRed:     "#F07178",
              brightGreen:   "#C2D94C",
              brightYellow:  "#FFB454",
              brightBlue:    "#59C2FF",
              brightMagenta: "#FFEE99",
              brightCyan:    "#95E6CB",
              brightWhite:   "#FFFFFF"
            }
          }}
          addons={[this.fitAddon]}
          onData={async (data) => {
            const code = data.charCodeAt(0)
            
            // Enter key
            if (code === 13) {
              if (this.state.input.length > 0) {
                this.handleInput(this.state.input)
              }
             
              await this.sleep(3) // Needed to wait for set state finish
              this.printTerminalPrompt()

            // Backspace key
            } else if (code === 127 && this.state.input.length > 0 && this.state.input.trim() !== "") {
              this.xtermRef.current.terminal.write("\b \b")
              this.setState({ input: this.state.input.slice(0, -1) })
           
            // Contol keys (eg: arrow keys)
            } else if (code < 32 || code === 127) {
              return;
            
            // Other keys goes to input
            } else { 
              this.xtermRef.current.terminal.write(data)
              this.setState({ input: String(this.state.input + data).replace(/^(\n|\r\n|\r)+|(\n|\r\n|\r)+$/g, '') })
            } 
          }}
        />
      </>
    )
  }
}

export default function Playground({ fileTree }) {
  return (
    <CustomTerminal fileTree={fileTree}/> 
  ) 
}