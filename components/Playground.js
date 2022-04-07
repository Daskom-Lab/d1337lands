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
      \r|  to psst (dont tell them) play some "game" by typing "startgame"  |
      \r|                                                                   |
      \r+===================================================================+`);
  }

  printTerminalPrompt() {
    this.xtermRef.current.terminal.write(`\r
      \r${this.state.currentUser}@daskom1337 ${this.state.currentDirectory} ${this.state.currentUser === "root" ? "#" : "$"} `);
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
          className="w-full h-full border-2 overflow-none border-slate-400 bg-slate-800 rounded-xl mt-6 shadow-l"
          ref={this.xtermRef}
          options={{
            scrollback: 0,
            theme: {
              background: "#0A0E14",
              foreground: "#B3B1AD",
              black:   "#01060E",
              red:     "#EA6C73",
              green:   "#91B362",
              yellow:  "#F9AF4F",
              blue:    "#53BDFA",
              magenta: "#FAE994",
              cyan:    "#90E1C6",
              white:   "#C7C7C7",
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
            const code = data.charCodeAt(0);
            if (code === 13) {
            }
          }}
        />
      </>
    )
  }
}

export default function Playground() {
  return (
    <CustomTerminal /> 
  ) 
}