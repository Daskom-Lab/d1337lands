import Head from 'next/head'
import Image from 'next/image'
import React, { useState } from 'react'
import Button from '../components/Button'
import Aboutus from '../components/Aboutus'
import Activity from '../components/Activity'
import People from '../components/People'
import { getAssetFile, getFileTree } from "../utils/assets";
import { getPeopleList } from '../assets/peoples'
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';

import dynamic from "next/dynamic";
const Playground = dynamic(() => import("../components/Playground"), {
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
      <main className="w-full h-full border-8 border-green-400 bg-green-800 flex flex-col">
        <div className="flex flex-col m-auto max-w-6xl w-full h-4/6">
          <div className="font-merriw font-extrabold text-4xl text-yellow-300 mx-auto">
            Daskom1337 Community
          </div>
          {
            menu !== "playground" ? (
              <SimpleBar className="flex flex-col self-center w-full h-full border-2 overflow-auto border-slate-400 bg-slate-900 rounded-xl p-5 mt-6 shadow-l">
                {
                  {
                    "about-us": <Aboutus />,
                    activity: <Activity />,
                    people: <People peopleList={peopleList} />
                  }[menu]
                }
              </SimpleBar>
            ) : (
              <Playground fileTree={fileTree}/>
            )
          }
          <div className="flex flex-row mt-5 px-10">
            <Button text="About Us" color={menu === "about-us" ? "red" : "yellow"} onClick={() => setMenu("about-us")} />
            <Button text="The Activity" color={menu === "activity" ? "red" : "yellow"} onClick={() => setMenu("activity")} />
            <Button text="The People" color={menu === "people" ? "red" : "yellow"} onClick={() => setMenu("people")} />
            <Button text="The Playground" color={menu === "playground" ? "red" : "yellow"} onClick={() => setMenu("playground")} />
          </div>
        </div>
      </main>
    </div>
  )
}
