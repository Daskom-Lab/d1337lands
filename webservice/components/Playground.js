import React from 'react';
import { FitAddon } from 'xterm-addon-fit';
import { XTerm } from 'xterm-for-react';
import { colorize, bold } from '@/utils/vt100_codes';
import { getCookie, hasCookie, setCookie, deleteCookie } from 'cookies-next';
import AppContext from '@/context/appstate';
import { POST } from '@/utils/fetcher';

class CustomTerminal extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props)
    this.xtermRef = React.createRef();
    this.fitAddon = new FitAddon();

    this.state = {
      currentDirectory: "/",
      currentUser: "guest",
      input: "",
      shouldFlush: true,
      
      /**
       * Process related states, these states depends
       * fully on what is currently running process
       */ 
      isInProcess: false,
      processType: "",
      processState: 0,

      loginData: {
        username: "",
        password: ""
      }
    }
  }

  async updateCurrentUser() {
    if (!hasCookie("1337token")) return;

    await POST(`http://${this.props.env["HOST"]}:${this.props.env["WEBSERVICE_PORT"]}/api/authentication/validate`, null, getCookie("1337token"))
      .then ((res) => {
        this.setState({
          currentUser: res.nickname
        })
      }).catch (() => {
        this.setState({
          currentUser: "guest"
        })
      })
  }

  printInitialPrompt() {
    this.xtermRef.current.terminal.write(`\r+===================================================================+
      \r|                                                                   |
      \r|  Welcome to ${bold(colorize("green", "Daskom1337"))} Playground,                                |
      \r|                                                                   |
      \r|  type "help" to display list of available commands                |
      \r|  type "help {command}" to display usage of that command           |
      \r|                                                                   |
      \r|  Go play and enjoy yourself in our playground !!!                 |
      \r|                                                                   |
      \r|  psst, if you happened to be one of ${bold(colorize("green", "daskom1337"))} community          |
      \r|  member, you can type "login" to log yourself in (ofc right)      |
      \r|  to psst (dont tell them) play some game by typing "startgame"    |
      \r|                                                                   |
      \r+===================================================================+
    \r`);
  }

  printUserPrompt() {
    let cleanDir = this.state.currentDirectory === "/" ? this.state.currentDirectory : this.state.currentDirectory.slice(0, -1)
    this.xtermRef.current.terminal.write(`\r
      \x1b[A\r${colorize("green",`${this.state.currentUser}@daskom1337`)} ${colorize("blue",cleanDir)} ${this.state.currentUser === "root" ? "#" : "$"} `); 
  }

  async printTerminalPrompt() {
    if (this.state.input !== "clear")
      this.xtermRef.current.terminal.write("\r\n")

    if (!this.state.isInProcess) 
      this.printUserPrompt()
    else 
      switch (this.state.processType) {
        case "login":
          switch (this.state.processState) {
            case 0:
              this.xtermRef.current.terminal.write("Username: ")
              this.setState({ processState: 1 }) 
              break;

            case 1:
              this.xtermRef.current.terminal.write("Password: ")
              this.state.loginData.username = this.state.input
              this.setState({ 
                processState: 2,
                shouldFlush: false,
                loginData: this.state.loginData
              }) 
              break;

            case 2:
              this.state.loginData.password = this.state.input
              this.setState({
                processType: "",
                processState: 3,
                loginData: this.state.loginData
              })

              this.xtermRef.current.terminal.write("[+] Logging in...")

              await this.sleep(3) 
              await POST(`http://${this.props.env["HOST"]}:${this.props.env["WEBSERVICE_PORT"]}/api/authentication/login`, this.state.loginData)
                .then ((res) => {
                  setCookie("1337token", res.accessToken)

                  this.updateCurrentUser();
                  this.xtermRef.current.terminal.write("\r\n[+] Login success \r\n")
                }).catch (() => {
                  this.xtermRef.current.terminal.write("\r\n[+] Login failed \r\n")
                })

              this.setState({
                processState: 0,
                isInProcess: false,
                shouldFlush: true
              })

              this.printUserPrompt()
              break;
          
            default:
              break;
          } 
          break;
      
        default:
          break;
      }
    
    this.setState({ input: "" })
  }

  sleep = ms => new Promise(r => setTimeout(r, ms));

  handleInput = async (input) => {
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
          if (!node.name.startsWith(".") || inputArgs[0] === "-a") {
            if (node.type === "file")
              this.xtermRef.current.terminal.write(`${node.name}`)
            else
              this.xtermRef.current.terminal.write(`${colorize("blue",node.name)}`)
            
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
          else if (dir === ".")
            dirChange = dirChange
          else if (!["", ".."].includes(dir)) 
            dirChange += `${dir}/`
        })

        if (dirChange === "/" || Object.keys(this.props.fileTree).includes(dirChange.slice(0, -1)))
          this.setState({ currentDirectory: dirChange })
        else 
          this.xtermRef.current.terminal.write(`\r\ncd: no such file or directory: ${inputArgs[0]}`)
        break;

      case "help":
        if (inputArgs.length > 1)
          this.xtermRef.current.terminal.write("\r\nhelp: Only need one argument")
        else if (inputArgs.length === 0)
          this.xtermRef.current.terminal.write(`\r\nCommand List:\r\n- clear\r\n- cat\r\n- ls\r\n- cd\r\n- help`)
        else
          switch(inputArgs[0]){
            case "clear":
              this.xtermRef.current.terminal.write("\r\nusage : clear\r\nclear the terminal screen")
              break;
            case "cat":
              this.xtermRef.current.terminal.write("\r\n/ᐠ. ｡.ᐟ\\ᵐᵉᵒʷˎˊ˗\r\nusage : cat [filename]\r\nread files and print on the standard output")
              break;
            case "ls":
              this.xtermRef.current.terminal.write(`\r\nusage : ls [option (optional)]\r\nlist directory contents\r\nOption :\r\n${bold("-a")}\tdo not ignore entries starting with .`)
              break;
            case "cd":
              this.xtermRef.current.terminal.write("\r\nusage : cd [dirname (optional)]\r\nchange directory")
              break;
            case "help":
              this.xtermRef.current.terminal.write("\r\nusage : help [command (optional)]\r\nhelp me")
              break;
            case "login":
              this.xtermRef.current.terminal.write("\r\nusage : login\r\nlog yourself in (if you are one of daskom1337 community member)")
              break;
            default:
              this.xtermRef.current.terminal.write("\r\nNo Command ( ╹x╹ )")
              break;
          }
        break;

      case "login":
        if (inputArgs.length > 0) {
          this.xtermRef.current.terminal.write("\r\nlogin: Dont need any argument");
          return;
        } 

        this.setState({ 
          isInProcess: true,
          processType: "login",
          processState: 0,
          shouldFlush: true
        })
        break;

      case "logout":
        if (inputArgs.length > 0) {
          this.xtermRef.current.terminal.write("\r\nstartgame: Dont need any argument");
          return;
        } 

        if (!hasCookie("1337token")) {
          this.xtermRef.current.terminal.write("\r\n[+] You are not logged in yet!");
          return;
        }

        deleteCookie("1337token");
        this.setState({
          currentUser: "guest"
        })
        break;

      case "changepassword":
        if (inputArgs.length > 0) {
          this.xtermRef.current.terminal.write("\r\nlogin: Dont need any argument");
          return;
        } 
        
        this.setState({ 
          isInProcess: true,
          processType: "changepassword",
          processState: 0,
          shouldFlush: true
        })
        break;

      case "startgame":
        if (inputArgs.length > 0) {
          this.xtermRef.current.terminal.write("\r\nstartgame: Dont need any argument");
          return;
        } 

        if (!hasCookie("1337token")) {
          this.xtermRef.current.terminal.write("\r\n[+] You have to login first!");
          return;
        }

        await POST(`http://${this.props.env["HOST"]}:${this.props.env["WEBSERVICE_PORT"]}/api/authentication/validate`, null, getCookie("1337token"))
          .then (() => {
            this.context.setGameActive(true);
            this.xtermRef.current.terminal.write("\r\n[+] Game started successfully :D");
          }).catch (() => {
            this.context.setGameActive(false)
            this.xtermRef.current.terminal.write("\r\n[+] Oops, you can't cheat bruh :(");
          })
        break;

      default:
        this.xtermRef.current.terminal.write(`\r\ncommand not found: ${this.state.input}`)
        break;
    }
  }

  async componentDidMount() {
    this.fitAddon.fit()
    await this.updateCurrentUser()
    await this.sleep(3)

    if (this.xtermRef.current != null) {
      this.printInitialPrompt()
      await this.printTerminalPrompt()
    }
  }

  render() {
    return (
      <>
        <XTerm
          className="w-full h-full overflow-none"
          ref={this.xtermRef}
          options={{
            cursorBlink: true,
            scrollback: 1000,
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
              if (this.state.input.length > 0 && !this.state.isInProcess) {
                await this.handleInput(this.state.input)
              }
             
              await this.sleep(3) // Needed to wait for set state finish
              if (this.xtermRef.current != null)
                await this.printTerminalPrompt()

            // Backspace key
            } else if (code === 127 && this.state.input.length > 0 && this.state.input.trim() !== "") {
              if (this.state.shouldFlush) 
                this.xtermRef.current.terminal.write("\b \b")
              this.setState({ input: this.state.input.slice(0, -1) })
           
            // Contol keys (eg: arrow keys)
            } else if (code < 32 || code === 127) {
              return;
            
            // Other keys goes to input
            } else {
              if (this.state.shouldFlush) 
                this.xtermRef.current.terminal.write(data)
              this.setState({ input: String(this.state.input + data).replace(/^(\n|\r\n|\r)+|(\n|\r\n|\r)+$/g, '') })
            } 
          }}
        />
      </>
    )
  }
}

export default function Playground({ fileTree, env }) {
  return (
    <CustomTerminal fileTree={fileTree} env={env}/> 
  ) 
}