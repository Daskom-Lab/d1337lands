export default function People({ peopleList }) {
  return (
    <div className="text-white font-overpassm w-full flex flex-col">
      {
        peopleList.map((people, i) => 
          <div className="flex flex-col items-center" key={i}>
            <div className="flex flex-row">
              {
                i%2 === 0 &&
                  <div style={{ fontSize: "5px" }} className="whitespace-pre subpixel-antialiased tracking-wider font-consolas font-mono font-extrabold" dangerouslySetInnerHTML={{__html: people.Avatar}} />
              }
              <div className="flex flex-col mx-8 my-auto">
                <div>
                  {people.Realname} [{people.Handle}]
                </div>
                <div className="whitespace-pre">
                  {people.Description}
                </div>
              </div>
              {
                i%2 !== 0 &&
                  <div style={{ fontSize: "5px" }} className="whitespace-pre subpixel-antialiased tracking-wider font-consolas font-mono font-extrabold" dangerouslySetInnerHTML={{__html: people.Avatar}} />
              }
            </div>
            {
              i !== peopleList.length - 1 &&
                <div className="whitespace-pre">{`
      ___
<---~{==+==}~--->`.replace(/^(\n|\r\n|\r)+|(\n|\r\n|\r)+$/g, '')}</div> 
            }
          </div>
        )
      }
    </div>
  );
}