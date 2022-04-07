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
      \r+===================================================================+`);
  }

  printTerminalPrompt = (isFirstLine) => {
    if (!isFirstLine)
      this.xtermRef.current.terminal.write("\r\n")
    this.xtermRef.current.terminal.write(`${this.state.currentUser}@daskom1337 ${this.state.currentDirectory} ${this.state.currentUser === "root" ? "#" : "$"} `);
  }

  handleInput = (input) => {
    if (input.includes(" ")) {
      // TODO: implement more advance parser for piping commands or commands with parameters and stuff
      return
    }

    switch (input) {
      case "clear":
        this.xtermRef.current.terminal.clear()
        this.xtermRef.current.terminal.write("\x1b[2J\r")
        this.setState({ input: "" })
        break;

      case "ls":
        // TODO: implement the ls and cat command
        this.xtermRef.current.terminal.write()
    
      default:
        this.xtermRef.current.terminal.write(`\r
          \rcommand not found: ${this.state.input}`)
        break;
    }
  }

  componentDidMount() {
    console.log(this.props.fileTree)
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
          onData={(data) => {
            const code = data.charCodeAt(0)
            
            // Enter key
            if (code === 13) {
              if (this.state.input.length > 0) {
                this.handleInput(this.state.input)
              }
              
              this.printTerminalPrompt(this.state.input === "clear")
              this.setState({ input: "" })

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
              this.setState({ input: String(this.state.input + data).trim() })
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