import Head from 'next/head'
import Image from 'next/image'
import React, { useState } from 'react'
import Button from '../components/Button'

export default function Home() {
  const [menu, setMenu] = useState("about-us");

  return (
    <div className="w-full h-full">
      <Head>
        <title>Daskom1337 Community</title>
        <meta name="description" content="Daskom1337 Community Website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="w-full h-full border-8 border-green-400 bg-green-800 flex flex-col">
        <div className="flex flex-col m-auto max-w-6xl">
          <div className="font-merriw font-extrabold text-4xl text-yellow-300 mx-auto">
            Daskom1337 Community
          </div>
          <div className="flex flex-col border-2 border-slate-400 bg-slate-800 rounded-xl p-5 mt-6 h-5/6 overflow-auto shadow-l">
            <div className="text-white font-overpassm">
              [+] We basically consist of some of people from Dasar Komputer Laboratory that somehow manage their way to love technology and some even goes really far into it up to the level that we couldn't describe, so instead of finding and recruiting people from the wild, we created a community like this to share and learn knowledge together (for free, because we are indonesian, and we love everything for free). <br /><br />

              [+] We are ofcourse the creator of this thing (and almost everything since 2017 in daskom were, are and probably will always be created by us) including the <a href="https://daskomlab.com/" target="_blank" rel="noopener noreferrer">daskomlab web application</a> that daskom is using for everyday practicum. <br /><br />

              [+] We also have a <a href="https://www.youtube.com/channel/UCl51jsRs074Ve1cyXxrbhxA" target="_blank" rel="noopener noreferrer">youtube channel</a> with running lists of videos that will probably and hopefully gives you knowledge and understanding about magic, science, and crafts in the digital world. <br /><br />

              [+] We hold several events to give knowledge for free for all of you (and us) which are <a href="https://github.com/Daskom-Lab/weekend-crash-course" target="_blank" rel="noopener noreferrer">weekend crash course</a>, <a href="https://github.com/Daskom-Lab/2021-Academy" target="_blank" rel="noopener noreferrer">prochef academy</a> and <a href="https://daskom-lab.github.io/daskomctf" target="_blank" rel="noopener noreferrer">capture the flag</a>.
            </div>
          </div>
          <div className="flex flex-row mt-5 px-10">
            <Button text="About Us" color={menu === "about-us" ? "green" : "yellow"} onClick={() => setMenu("about-us")} />
            <Button text="The Activity" color={menu === "activity" ? "green" : "yellow"} onClick={() => setMenu("activity")} />
            <Button text="The People" color={menu === "people" ? "green" : "yellow"} onClick={() => setMenu("people")} />
          </div>
        </div>
      </main>
    </div>
  )
}
