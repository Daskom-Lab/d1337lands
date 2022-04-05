export default function People({ peopleList }) {
  return (
    <div className="text-white font-overpassm w-full">
      {
        peopleList.map((object, i) => 
          <div key={i}>

          </div>
        )
      }
    </div>
  );
}