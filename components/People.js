export default function People({ peopleList }) {
  return (
    <div className="text-white font-overpassm w-full">
      {
        peopleList.map((people, i) => 
          <div className="flex flex-row" key={i}>
            <div style={{ fontSize: "5px" }} className="whitespace-pre font-consolas font-mono font-extrabold" dangerouslySetInnerHTML={{__html: people.Avatar}} />
            <div className="flex flex-col ml-8 my-auto">
              <div>
                {people.Realname} [{people.Handle}]
              </div>
              <div className="whitespace-pre">
                {people.Description}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}