import Head from 'next/head'
import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import Aboutus from '@/components/Aboutus'
import Activity from '@/components/Activity'
import People from '@/components/People'
import { getAssetFile, getFileTree } from "@/utils/assets";
import { getPeopleList } from '@/assets/peoples'
import SimpleBar from 'simplebar-react';
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
  const sharedState = useAppContext();

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
        "w-full h-full border-8 border-green-400 bg-green-800 flex flex-row transition-all duration-700 " +
        (sharedState.isGameActive ? "p-4" : "p-0")
      }>
        {
          sharedState.isGameActive && (
            <div className="flex flex-col m-auto rounded-xl w-2/5 border-2 border-slate-400 bg-slate-900 mr-2 h-full max-w-xl">
              GAME LOG
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
                  <iframe src="http://localhost:8080" className="rounded-xl h-full w-full" />
                  <button className="">
                    <FontAwesomeIcon icon={faGear} />
                  </button>
                  <div className="w-full h-full top-0 rounded-xl absolute bg-slate-700 bg-opacity-80">

                  </div>
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

                </div>
                <div className="flex flex-col w-2/6 h-full rounded-lg border-2 border-slate-400 bg-slate-900">

                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  )
}
