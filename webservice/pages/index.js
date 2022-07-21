import Head from 'next/head'
import Button from '@/components/Button'
import Aboutus from '@/components/Aboutus'
import Activity from '@/components/Activity'
import People from '@/components/People'
import useEventListener from '@use-it/event-listener'
import dynamic from "next/dynamic";

import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'

import { useState, useEffect, useRef } from 'react'
import { getAssetFile, getFileTree } from "@/utils/assets";
import { getPeopleList } from '@/assets/peoples'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { io } from "socket.io-client"
import { useAppContext } from '@/context/appstate'
import { hasCookie, getCookie } from 'cookies-next'
import { GET, POST } from '@/utils/fetcher'

const Playground = dynamic(() => import("@/components/Playground"), {
  ssr: false
});

export async function getStaticProps() {
  const peopleList = getPeopleList();

  peopleList.forEach(people => {
    if (people.Avatar.endsWith(".html"))
      people.Avatar = getAssetFile(people.Avatar);

    // Remove newline at start and end of description
    people.Description = people.Description.replace(/^(\n|\r\n|\r)+|(\n|\r\n|\r)+$/g, '');
  });

  const fileTree = getFileTree();

  const GAME_PORT = process.env.GAME_PORT;
  const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT;
  const WEBSERVICE_PORT = process.env.WEBSERVICE_PORT;
  const HOST = process.env.HOST;

  let GAME_URL = ""
  let WEBSOCKET_URL = ""
  let WEBSERVICE_URL = ""
  if (process.env.MODE === "DEVELOPMENT") {
    GAME_URL = `http://${HOST}:${GAME_PORT}`
    WEBSOCKET_URL = `http://${HOST}:${WEBSOCKET_PORT}`
    WEBSERVICE_URL = `http://${HOST}:${WEBSERVICE_PORT}`
  } else {
    GAME_URL = `https://${HOST}/game`
    WEBSOCKET_URL = `https://${HOST}/websocket`
    WEBSERVICE_URL = `https://${HOST}`
  }

  return {
    props: {
      peopleList,
      fileTree,
      GAME_URL,
      WEBSOCKET_URL,
      WEBSERVICE_URL
    }
  }
}

export default function Home({ peopleList, fileTree, GAME_URL, WEBSOCKET_URL, WEBSERVICE_URL }) {
  const [menu, setMenu] = useState("about-us")
  const [gameSocket, setGameSocket] = useState(undefined)
  const [chatSocket, setChatSocket] = useState(undefined)
  const [mainMenuOpened, setMainMenuOpened] = useState(false)
  const [profileMenuOpened, setProfileMenuOpened] = useState(false)
  const [isMovementThrottled, setisMovementThrottled] = useState(false)
  const [inputsFocused, setInputsFocused] = useState([])
  const [logBuffer, setLogBuffer] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [logInput, setLogInput] = useState("")
  const [currEvent, setCurrEvent] = useState("")
  const [userData, setUserData] = useState({})
  const [newPlayerImage, setNewPlayerImage] = useState("")
  const [chats, setChats] = useState([])
  const [users, setUsers] = useState([])
  const sharedState = useAppContext()

  const userDataRef = useRef()
  userDataRef.current = userData

  let addLogBuffer = function (newLogBuffer) {
    setLogBuffer(logBuffer => logBuffer + (logBuffer === "" ? "" : "\n") + newLogBuffer)
  }

  let printWelcomingPrompt = function (data, place = "daskom1337 codeventure") {
    // Please dont optimize these string, it was intended 
    // to be written like this for beautiful code purposes :D
    if (data !== undefined)
      setLogBuffer(`Hello and welcome to ${place}, ${data.user_nickname}.`)
    else
      setLogBuffer(`Hello and welcome to ${place}, ${userDataRef.current.user_nickname}.`)
    addLogBuffer(`                                                         `)
    addLogBuffer(`Walk anywhere across the maps using these keys:          `)
    addLogBuffer(`                                                         `)
    addLogBuffer(`                  ("up arrow" or "w")                    `)
    addLogBuffer(`                          Ʌ                              `)
    addLogBuffer(`  ("left arrow" or "a") < + > ("right arrow" or "d")     `)
    addLogBuffer(`                          V                              `)
    addLogBuffer(`                 ("down arrow" or "s")                   `)
    addLogBuffer(`                                                         `)
    addLogBuffer(`Click "enter" or "spacebar" to run event whenever you are`)
    addLogBuffer(`inside the event trigger location.                       `)
    addLogBuffer(`                                                         `)
    addLogBuffer(`Where is the event trigger location ?                    `)
    addLogBuffer(`well, it is for you to find out :D                       `)

    gameSocketEmit("clear_state");
  }

  let addChat = function (newChat) {
    setChats(chats => [...chats, newChat]);
  }

  let addUser = function (newUser) {
    setUsers(users => {
      if (!users.map(user => user.user_id).includes(newUser.user_id))
        return [...users, newUser]
      else return users
    });
  }

  let removeUser = function (userId) {
    setUsers(users => {
      if (users.map(user => user.user_id).includes(userId))
        return users.filter(
          user => user.user_id !== userId
        )
      else return users
    })
  }

  let isEmptyObject = function (object) {
    for (var _ in object) return false;
    return true;
  }

  let gameSocketEmit = function (event, data, callbackfn) {
    if (gameSocket !== undefined && gameSocket !== null) {
      if (!!callbackfn) gameSocket.emit(event, data, callbackfn)
      else if (!!data) gameSocket.emit(event, data)
      else gameSocket.emit(event)
    }
  }

  let chatSocketEmit = function (event, data, callbackfn) {
    if (chatSocket !== undefined && chatSocket !== null) {
      if (!!callbackfn) chatSocket.emit(event, data, callbackfn)
      else if (!!data) chatSocket.emit(event, data)
      else chatSocket.emit(event)
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  useEventListener("keydown", ({ key }) => {
    if (inputsFocused.length > 0 || mainMenuOpened) return

    // Space or Enter clicked (goes into action)
    if ([" ", "Enter"].includes(key)) {
      gameSocketEmit("send_action", {
        "action": "run_event"
      })
      return
    }

    if (!isMovementThrottled) {
      // W or Arrow key Up clicked (move up)
      if (["w", "W", "ArrowUp"].includes(key)) {
        (async () => {
          setisMovementThrottled(true);
          await sleep(200);
          setisMovementThrottled(false);
        })();

        gameSocketEmit("send_action", {
          "action": "move",
          "direction": "up"
        }, (response) => {
          if (response === "OK") {
            printWelcomingPrompt();
            setCurrEvent("");
          }
        })

        return
      }

      // A or Arrow key Left clicked (move left)
      if (["a", "A", "ArrowLeft"].includes(key)) {
        (async () => {
          setisMovementThrottled(true);
          await sleep(200);
          setisMovementThrottled(false);
        })();

        gameSocketEmit("send_action", {
          "action": "move",
          "direction": "left"
        }, (response) => {
          if (response === "OK") {
            printWelcomingPrompt();
            setCurrEvent("");
          }
        })

        return
      }

      // S or Arrow key Down clicked (move down)
      if (["s", "S", "ArrowDown"].includes(key)) {
        (async () => {
          setisMovementThrottled(true);
          await sleep(200);
          setisMovementThrottled(false);
        })();

        gameSocketEmit("send_action", {
          "action": "move",
          "direction": "down"
        }, (response) => {
          if (response === "OK") {
            printWelcomingPrompt();
            setCurrEvent("");
          }
        })

        return
      }

      // D or Arrow key Right clicked (move right)
      if (["d", "D", "ArrowRight"].includes(key)) {
        (async () => {
          setisMovementThrottled(true);
          await sleep(200);
          setisMovementThrottled(false);
        })();

        gameSocketEmit("send_action", {
          "action": "move",
          "direction": "right"
        }, (response) => {
          if (response === "OK") {
            printWelcomingPrompt();
            setCurrEvent("");
          }
        })

        return
      }
    }
  });

  const changePlayerImage = (newImage) => {
    const canvas = document.getElementById("playerImage");
    const ctx = canvas.getContext("2d");

    var image = new Image();
    image.onload = function () {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image,
        16, 135,
        31, 38,
        width / 2, height / 2 - (height - 87),
        93, 114
      );
    }

    image.src = URL.createObjectURL(newImage);
  }

  useEffect(() => {
    if (sharedState.isGameActive)
      if (hasCookie("1337token")) {
        // Game socket initialization
        if (gameSocket === undefined) {
          const socket = io(WEBSOCKET_URL, {
            auth: (cb) => {
              cb({
                token: getCookie("1337token"),
                connection_source: "web"
              })
            }
          })

          socket.on("user_data", (data) => {
            setUserData(data);
            printWelcomingPrompt(data);

            if (isEmptyObject(data.user_datas)) {
              socket.emit("send_action", {
                "action": "initialize_data"
              }, (response) => {
                if (response !== "OK") {
                  console.log(`Error connecting to websocket -> ${response}`)
                }
              })
            }
          })

          socket.on("handle_action", (data) => {
            if (data.action === "run_event") {
              if (data.error_text) {
                setLogBuffer(`ERROR: ${data.error_text}`);
                return;
              }

              const userData = userDataRef.current;
              if (data.event_name !== null && data.event_name !== undefined) {
                setCurrEvent(data.event_name);
                switch (userData.user_datas.map) {
                  case "town":
                    switch (data.event_name) {
                      case "teleportation":
                        setLogBuffer(`Welcome to the teleportation, ${userData.user_nickname}`)
                        addLogBuffer(`                                                       `)
                        addLogBuffer(`Please choose between these islands to teleport to:    `)
                        addLogBuffer(`(write the number of the islands which you want        `)
                        addLogBuffer(`to teleport to and click enter in the input bar below) `)
                        addLogBuffer(`                                                       `)
                        data.packed_data.maps.forEach((element, pos) => {
                          addLogBuffer(`${pos + 1}. ${element}`)
                        });
                        break;

                      case "shop":
                        setLogBuffer(`Hello and welcome to the shop, ${userData.user_nickname}`)
                        addLogBuffer(`                                                        `)
                        addLogBuffer(`You can choose any of these potions to buy:             `)
                        addLogBuffer(`(write the number of the id of the potion which you     `)
                        addLogBuffer(`want to buy and click enter in the input bar below)     `)
                        addLogBuffer(`                                                        `)
                        data.packed_data.shop_list.forEach(element => {
                          addLogBuffer(`[+] potion_id = ${element.id}                `)
                          addLogBuffer(`    potion_code = ${element.code}            `)
                          addLogBuffer(`    potion_desc = ${element.description}     `)
                          addLogBuffer(`    potion_price = ${element.price} leetcoins`)
                          addLogBuffer(`                                             `)
                        });
                        break;

                      case "leaderboard":
                        setLogBuffer(`Congratulation to all these relentless codeventurers`)
                        addLogBuffer(`(you guys have truly done the very best of work)    `)
                        addLogBuffer(`                                                    `)
                        data.packed_data.achievement_list.forEach((element, pos) => {
                          addLogBuffer(`[RANK ${pos + 1}] ${element.user_nickname}`)
                        });
                        break;

                      case "hall_of_fame":
                        setLogBuffer(`Hail to the masters of this whole codeventure lands:`)
                        addLogBuffer(`                                                    `)
                        for (let [key, value] of Object.entries(data.packed_data.user_list)) {
                          addLogBuffer(`>> ${key}`)
                          value.forEach(element => {
                            addLogBuffer(`   title = ${element.title}            `)
                            addLogBuffer(`   description = ${element.description}`)
                            addLogBuffer(`                                       `)
                          });
                          addLogBuffer(`         `)
                        }
                        break;

                      default:
                        break;
                    }
                    break;

                  case "mentorcastle":
                    switch (data.event_name) {
                      case "submission_check":
                        setLogBuffer(`Hello there mentors, now we all got a job to do        `)
                        addLogBuffer(`                                                       `)
                        addLogBuffer(`Please make some correction check on these submissions:`)
                        addLogBuffer(`(write the id of the submission which you want         `)
                        addLogBuffer(`to check and click enter in the input bar below)       `)
                        addLogBuffer(`                                                       `)
                        data.packed_data.submission_list.forEach(element => {
                          addLogBuffer(`[+] submission_id = ${element.id}        `)
                          addLogBuffer(`    submission_answer = ${element.answer}`)
                          addLogBuffer(`    quest_title = ${element.title}       `)
                          addLogBuffer(`    quest_level = ${element.level}       `)
                          addLogBuffer(`    quest_category = ${element.category} `)
                          addLogBuffer(`                                         `)
                        });
                        break;

                      default:
                        break;
                    }
                    break;

                  default: // all island maps
                    if (userData.user_datas.map === undefined ||
                      !userData.user_datas.map.endsWith("island"))
                      return;

                    switch (data.event_name) {
                      case "hint":
                        setLogBuffer(data.packed_data.prompt)
                        break;

                      case "quest":
                        setLogBuffer(`Ohh at last, you successfully found me ${userData.user_nickname}`)
                        addLogBuffer(`here are all the quests i got for you to tackle now :           `)
                        addLogBuffer(`                                                                `)
                        data.packed_data.quest_list.forEach(element => {
                          addLogBuffer(`[+] quest_id = ${element.id}                 `)
                          addLogBuffer(`    quest_title = ${element.answer}          `)
                          addLogBuffer(`    quest_description = ${element.is_correct}`)
                          addLogBuffer(`    quest_level = ${element.title}           `)
                          addLogBuffer(`    quest_reward = ${element.level} leetcoins`)
                          addLogBuffer(`                                             `)
                        });
                        break;

                      case "submission":
                        setLogBuffer(`Welcome back codeventurer, these are the submission  `)
                        addLogBuffer(`that you have sent to me before                      `)
                        addLogBuffer(`                                                     `)
                        addLogBuffer(`You can redeem those that have been corrected by the `)
                        addLogBuffer(`mentors by writing the id of the subimssion and click`)
                        addLogBuffer(`enter in the input bar below                         `)
                        addLogBuffer(`                                                     `)
                        data.packed_data.submission_list.forEach(element => {
                          addLogBuffer(`[+] submission_id = ${element.id}                `)
                          addLogBuffer(`    submission_answer = ${element.answer}        `)
                          addLogBuffer(`    submission_is_correct = ${element.is_correct}`)
                          addLogBuffer(`    quest_title = ${element.title}               `)
                          addLogBuffer(`    quest_level = ${element.level}               `)
                          addLogBuffer(`    quest_category = ${element.category}         `)
                          addLogBuffer(`                                                 `)
                        });
                        break;

                      case "submit_quest":
                        setLogBuffer(data.packed_data.prompt)
                        break;

                      default:
                        break;
                    }
                    break;
                }
              } else {
                setLogBuffer("You are not in any event trigger location currently,");
                addLogBuffer("try to get closer to the event place if there are events nearby");
              }
            } else if (data.action === "run_action") {
              if (data.error_text) {
                setLogBuffer(`ERROR: ${data.error_text}`);
                return;
              }

              if (data.success_text) setLogBuffer(`${data.success_text}`);
            }
          })

          socket.on("map_state", (data) => {
            if (
              data.user_id &&
              data.user_id === userDataRef.current.user_id &&
              data.map !== userDataRef.current.user_datas.map
            ) {
              let curUserData = userDataRef.current;
              curUserData.user_datas.map = data.map
              curUserData.user_datas.position = data.position
              setUserData(curUserData);
              printWelcomingPrompt(undefined, data.map);
            }
          })

          socket.on("user_connect", (data) => {
            addUser(data)
          })

          socket.on("user_disconnect", (data) => {
            removeUser(data.user_id)
          })

          setGameSocket(socket)
        }

        // Chat socket initialization
        if (chatSocket === undefined) {
          const socket = io(`${WEBSOCKET_URL}/chat`, {
            auth: (cb) => {
              cb({ token: getCookie("1337token") })
            }
          })

          socket.on("send_message", (data) => {
            addChat(data)
          })

          setChatSocket(socket)
        }
      }

    if (!sharedState.isGameActive) {
      if (gameSocket !== undefined) setGameSocket(undefined)
      if (chatSocket !== undefined) setChatSocket(undefined)
      setMenu("about-us")
    }
  }, [sharedState.isGameActive])

  return (
    <div className="w-full h-full">
      <Head>
        <title>Daskom1337 Community</title>
        <meta name="description" content="Daskom1337 Community Website" />
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://contact.daskomlab.com/assets/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://contact.daskomlab.com/assets/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://contact.daskomlab.com/assets/favicon/favicon-16x16.png" />
      </Head>
      <main className={
        "w-full h-full border-4 border-lime-500 bg-green-800 flex flex-row transition-all duration-700 " +
        (sharedState.isGameActive ? "p-4" : "p-0")
      }>
        {
          sharedState.isGameActive && (
            <div className="flex flex-col m-auto rounded-lg w-2/5 border-2 border-slate-400 bg-slate-900 mr-2 h-full max-w-xl">
              <div className="w-full text-black bg-green-400 text-xs tracking-wide font-bold font-merriw rounded-t-md px-2 py-1 border-b-2 border-slate-400">
                Game logs - (always read before you ask please...)
              </div>
              <SimpleBar className="flex w-full flex-auto text-white font-overpassm tracking-tighter font-normal text-sm p-2 overflow-auto">
                <span className="h-full w-full whitespace-pre-wrap">
                  {logBuffer}
                </span>
              </SimpleBar>
              <div className="flex w-full px-2">
                <input
                  className="border-2 font-sourcesans border-slate-400 rounded-lg w-full mx-auto mb-2 appearance-none text-md p-[4px] focus:border-green-600 leading-tight focus:outline-none"
                  onFocus={() => setInputsFocused(arr => [...arr, "logs"])}
                  onBlur={() => setInputsFocused(inputsFocused.filter((_, id) => id !== inputsFocused.length - 1))}
                  value={logInput}
                  onChange={el => setLogInput(el.target.value)}
                  onKeyDown={
                    event => {
                      if (event.key === "Enter") {
                        if (userData.user_datas.map === undefined || userData.user_datas.map === null)
                          return

                        switch (userData.user_datas.map) {
                          case "town":
                            switch (currEvent) {
                              case "teleportation":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "chosen_map": logInput,
                                  }
                                })
                                break;

                              case "shop":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "potion_id": logInput,
                                  }
                                })
                                break;

                              default:
                                break;
                            }
                            break;

                          case "mentorcastle":
                            switch (currEvent) {
                              case "submission_check":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "correction_data": logInput,
                                  }
                                })
                                break;

                              default:
                                break;
                            }
                            break;

                          default:
                            if (!userData.user_datas.map.endsWith("island"))
                              return;

                            switch (currEvent) {
                              case "hint":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "hint_data": logInput,
                                  }
                                })
                                break;

                              case "submission":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "submission_id": logInput,
                                  }
                                })
                                break;

                              case "submit_quest":
                                gameSocketEmit("send_action", {
                                  "action": "run_action",
                                  "packed_data": {
                                    "quest_answer_data": logInput,
                                  }
                                })
                                break;

                              default:
                                break;
                            }
                            break;
                        }

                        setLogInput("");
                      }
                    }
                  } />
              </div>
            </div>
          )
        }
        <div className={
          "flex flex-col m-auto flex-auto transition-all duration-700 " +
          (sharedState.isGameActive ? "h-full max-w-full" : "h-[75%] max-w-6xl")
        }>
          <div className={
            "font-merriw font-extrabold text-4xl text-yellow-300 mx-auto " +
            (sharedState.isGameActive ? "hidden" : "visible")
          }>
            Daskom1337 Community
          </div>
          <div className={
            "w-full border-2 border-slate-400 bg-slate-900 rounded-xl shadow-l transition-all duration-700 " +
            (sharedState.isGameActive ? "h-4/6" : "mt-6 h-[75%]")
          }>
            {
              !sharedState.isGameActive ? (
                menu !== "playground" ? (
                  <SimpleBar className="flex flex-col w-full h-full p-5 overflow-auto self-center">
                    {
                      {
                        "about-us": <Aboutus />,
                        activity: <Activity />,
                        people: <People peopleList={peopleList} />
                      }[menu]
                    }
                  </SimpleBar>
                ) : (
                  <Playground fileTree={fileTree} env={{
                    WEBSERVICE_URL: WEBSERVICE_URL
                  }} />
                )
              ) : (
                <div className="w-full h-full text-white relative">
                  <iframe src={GAME_URL} className="rounded-xl h-full w-full pointer-events-none" tabIndex="-1" onFocus={(event) => {
                    event.preventDefault();
                    if (event.relatedTarget) {
                      // Revert focus back to previous blurring element
                      event.relatedTarget.focus();
                    } else {
                      // No previous focus target, blur instead
                      event.currentTarget.blur();
                    }
                  }} />
                  {
                    mainMenuOpened && (
                      <div className="w-full h-full top-0 rounded-xl absolute bg-slate-700 bg-opacity-80 flex">
                        <div className="flex flex-col m-auto max-w-2xl h-auto text-black">
                          <button className="w-full rounded-lg mb-3 bg-yellow-400 border-black border-2 text-3xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400" onClick={async () => {
                            setProfileMenuOpened(true)
                            setMainMenuOpened(false)

                            const result = await GET(userData.user_datas.character, true);
                            changePlayerImage(result);
                          }}>
                            My Profile
                          </button>
                          <button className="w-full rounded-lg mb-3 bg-yellow-400 border-black border-2 text-3xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400">
                            Inventory
                          </button>
                          <button className="w-full rounded-lg bg-yellow-400 border-black border-2 text-3xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400" onClick={() => {
                            sharedState.setGameActive(false)
                            setMainMenuOpened(false)
                          }}>
                            Quit Game
                          </button>
                        </div>
                      </div>
                    )
                  }
                  <button className="rounded-full text-3xl text-black bg-yellow-400 p-2 w-[56px] h-auto absolute top-0 right-0 mr-4 mt-4 hover:-translate-x-1 hover:translate-y-1 hover:scale-110 hover:rotate-90 active:-translate-y-1 active:scale-90 transition duration-150 border-2 border-black" onClick={() => setMainMenuOpened(!mainMenuOpened)}>
                    <FontAwesomeIcon icon={faGear} />
                  </button>
                  {
                    profileMenuOpened && (
                      <div className="w-full h-full top-0 rounded-xl absolute bg-slate-700 bg-opacity-80 flex">
                        <div className="flex flex-col m-auto gap-3 max-w-2xl h-auto text-black">
                          <div className="flex gap-3 m-auto">
                            <canvas className="w-auto h-[100px] bg-white rounded-lg border-2 border-black" id="playerImage"></canvas>
                            <div className="flex flex-col gap-1 my-auto text-white font-merriw text-xl">
                              <span>
                                {userData.user_nickname} [{userData.user_role}]
                              </span>
                              <span>
                                {userData.user_datas.leetcoin} leetcoins
                              </span>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                          <div className="flex w-full">
                            <input id="playerImageUpload" className="hidden" type="file" accept="image/*" onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                const file = event.target.files[0];
                                const fr = new FileReader;

                                fr.onload = function () {
                                  const img = new Image;

                                  img.onload = function () {
                                    if (img.width !== 832 || img.height !== 1344) {
                                      return;
                                    }

                                    changePlayerImage(file);
                                    setNewPlayerImage(fr.result);
                                  };

                                  img.src = fr.result;
                                };

                                fr.readAsDataURL(file);
                              }
                            }} onClick={(event) => {
                              event.target.value = null
                            }} />
                            <button className="w-full rounded-lg bg-yellow-400 border-black border-2 text-xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400" onClick={() => {
                              document.getElementById("playerImageUpload").click();
                            }}>
                              Change Character Image
                            </button>
                          </div>
                          <div className="flex w-full gap-3 items-center">
                            <button className="w-full rounded-lg bg-yellow-400 border-black border-2 text-xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400" onClick={async () => {
                              if (!newPlayerImage || newPlayerImage === "") {
                                setProfileMenuOpened(false);
                                return;
                              }

                              await POST(`${WEBSERVICE_URL}/api/user/character`, {
                                character_image: newPlayerImage.replace("data:image/png;base64,", "")
                              }, getCookie("1337token"))
                                .then((_) => {
                                  console.log("Success uploading new character image!");
                                  setNewPlayerImage("");
                                  setProfileMenuOpened(false);
                                }).catch(() => {
                                  console.log("Error uploading new character image!");
                                  setProfileMenuOpened(false);
                                })
                            }}>
                              Save
                            </button>
                            <button className="w-full rounded-lg bg-yellow-400 border-black border-2 text-xl font-overpassm font-semibold p-2 hover:bg-black hover:text-yellow-400" onClick={() => {
                              setProfileMenuOpened(false);
                              setNewPlayerImage("");
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                </div>
              )
            }
          </div>
          {
            !sharedState.isGameActive ? (
              <div className="flex flex-row mt-5 px-10">
                <Button text="About Us" color={menu === "about-us" ? "red" : "yellow"} onClick={() => setMenu("about-us")} />
                <Button text="The Activity" color={menu === "activity" ? "red" : "yellow"} onClick={() => setMenu("activity")} />
                <Button text="The People" color={menu === "people" ? "red" : "yellow"} onClick={() => setMenu("people")} />
                <Button text="The Playground" color={menu === "playground" ? "red" : "yellow"} onClick={() => setMenu("playground")} />
              </div>
            ) : (
              <div className="flex flex-row mt-2 h-2/6">
                <div className="flex flex-col mr-2 w-4/6 h-full rounded-lg border-2 border-slate-400 bg-slate-900">
                  <div className="w-full text-black bg-green-400 text-xs tracking-wide font-bold font-merriw rounded-t-md px-2 py-1 border-b-2 border-slate-400">
                    Chat - (go talk to other people you nerd!)
                  </div>
                  <SimpleBar className="flex w-full flex-auto text-white font-normal overflow-auto font-sourcesans text-sm p-2">
                    {
                      chats.map((chat, i) =>
                        <div className="flex w-full gap-1" key={i}>
                          <span className={
                            "whitespace-nowrap font-bold " +
                            (chat.user_role === "mentor" ? "text-amber-300" : "text-green-100")
                          }>
                            {chat.user_nickname}
                          </span>
                          <span>
                            :
                          </span>
                          <span className="shrink break-all max-w-full">
                            {chat.user_chat}
                          </span>
                        </div>
                      )
                    }
                  </SimpleBar>
                  <div className="flex w-full px-2">
                    <input
                      className="border-2 font-sourcesans border-slate-400 rounded-lg w-full mx-auto mb-2 appearance-none text-md p-[4px] focus:border-green-600 leading-tight focus:outline-none"
                      onFocus={() => setInputsFocused(arr => [...arr, "chat"])}
                      onBlur={() => setInputsFocused(inputsFocused.filter((_, id) => id !== inputsFocused.length - 1))}
                      value={chatInput}
                      onChange={el => setChatInput(el.target.value)}
                      onKeyDown={
                        event => {
                          if (event.key === "Enter") {
                            chatSocketEmit("send_message", chatInput, (response) => {
                              if (response !== undefined) {
                                addChat(response)
                                setChatInput("")
                              }
                            })
                          }
                        }
                      } />
                  </div>
                </div>
                <div className="flex flex-col w-2/6 h-full rounded-lg border-2 border-slate-400 bg-slate-900">
                  <div className="w-full text-black bg-green-400 text-xs tracking-wide font-bold font-merriw rounded-t-md px-2 py-1 border-b-2 border-slate-400">
                    User activity - (look at these human being, meh)
                  </div>
                  <SimpleBar className="flex w-full flex-auto text-white font-normal overflow-auto font-sourcesans text-sm p-2">
                    {
                      users.map((user, _) =>
                        <div className="flex w-full gap-1" key={user.user_id}>
                          <span className={
                            "whitespace-nowrap font-bold " +
                            (user.user_role === "mentor" ? "text-amber-300" : "text-green-100")
                          }>
                            {user.user_nickname}
                          </span>
                          <span className="shrink break-all max-w-full">
                            [ {!isEmptyObject(user.user_datas) ? `currently in ${user.user_datas.map}` : "just landed"} ]
                          </span>
                        </div>
                      )
                    }
                  </SimpleBar>
                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  )
}
