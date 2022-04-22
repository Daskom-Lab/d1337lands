import Head from 'next/head'
import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import Aboutus from '@/components/Aboutus'
import Activity from '@/components/Activity'
import People from '@/components/People'
import { getAssetFile, getFileTree } from "@/utils/assets";
import { getPeopleList } from '@/assets/peoples'
import SimpleBar from 'simplebar-react';
import useEventListener from '@use-it/event-listener'
import 'simplebar/dist/simplebar.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'

import dynamic from "next/dynamic";
import { useAppContext } from '@/context/appstate'
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

  return {
    props: {
      peopleList,
      fileTree
    }
  }
}

export default function Home({ peopleList, fileTree }) {
  const [menu, setMenu] = useState("about-us");
  const [mainMenuOpened, setMainMenuOpened] = useState(false)
  const [inputsFocused, setInputsFocused] = useState([])
  const sharedState = useAppContext();

  useEventListener("keydown", ({ key }) => {
    if (inputsFocused.length > 0) return

    // Space or Enter clicked (goes into action)
    if ([" ", "Enter"].includes(key)) {

      return
    }

    // W or Arrow key Up clicked (move up)
    if (["w", "W", "ArrowUp"].includes(key)) {

      return
    }

    // A or Arrow key Left clicked (move left)
    if (["a", "A", "ArrowLeft"].includes(key)) {

      return
    }

    // S or Arrow key Down clicked (move down)
    if (["s", "S", "ArrowDown"].includes(key)) {

      return
    }

    // D or Arrow key Right clicked (move right)
    if (["d", "D", "ArrowRight"].includes(key)) {
      
      return
    }
  });

  useEffect(() => {
    console.log("AppWide: " + JSON.stringify(sharedState))
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
              <div className="w-full flex-auto">

              </div>
              <div className="flex w-full px-2">
                <input 
                  className="border-2 font-sourcesans border-slate-400 rounded-lg w-full mx-auto mb-2 appearance-none text-md p-[4px] focus:border-green-600 leading-tight focus:outline-none" 
                  onFocus={() => setInputsFocused(arr => [...arr, "logs"])}
                  onBlur={() => setInputsFocused(inputsFocused.filter((_, id) => id !== inputsFocused.length - 1))} />
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
                  <Playground fileTree={fileTree} />
                )
              ) : (
                <div className="w-full h-full text-white relative">
                  <iframe src="http://localhost:7777" className="rounded-xl h-full w-full" />
                  {
                    mainMenuOpened && (
                      <div className="w-full h-full top-0 rounded-xl absolute bg-slate-700 bg-opacity-80">
                      </div>
                    )
                  }
                  <button className="rounded-full text-3xl text-black bg-yellow-400 p-2 w-[56px] h-auto absolute top-0 right-0 mr-4 mt-4 hover:-translate-x-1 hover:translate-y-1 hover:scale-110 hover:rotate-90 transition duration-150 border-2 border-black" onClick={() => setMainMenuOpened(!mainMenuOpened)}>
                    <FontAwesomeIcon icon={faGear} />
                  </button>
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
                  <div className="w-full flex-auto">

                  </div>
                  <div className="flex w-full px-2">
                    <input 
                      className="border-2 font-sourcesans border-slate-400 rounded-lg w-full mx-auto mb-2 appearance-none text-md p-[4px] focus:border-green-600 leading-tight focus:outline-none" 
                      onFocus={() => setInputsFocused(arr => [...arr, "chat"])}
                      onBlur={() => setInputsFocused(inputsFocused.filter((_, id) => id !== inputsFocused.length - 1))} />
                  </div>
                </div>
                <div className="flex flex-col w-2/6 h-full rounded-lg border-2 border-slate-400 bg-slate-900">
                  <div className="w-full text-black bg-green-400 text-xs tracking-wide font-bold font-merriw rounded-t-md px-2 py-1 border-b-2 border-slate-400">
                    User activity - (look at these human being, meh)
                  </div>
                  <div className="w-full flex-auto">

                  </div>
                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  )
}
