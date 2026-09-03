import { useContext, useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSidebar";

import { ChatContext } from "../../context/ChatContext";


const HomePage = () => {

  const {
    selectedUser
  } = useContext(ChatContext);


  const [
    detailsOpen,
    setDetailsOpen
  ] = useState(true);


  const toggleDetails = () => {
    setDetailsOpen((current) => !current);
  };


  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0B0B0F] text-white">

      <div
        className={`
          grid
          h-full
          w-full
          grid-cols-1
          overflow-hidden

          md:transition-[grid-template-columns]
md:duration-400
md:ease-linear

          ${selectedUser
            ? detailsOpen
              ? "md:grid-cols-[320px_minmax(0,1fr)_320px]"
              : "md:grid-cols-[minmax(300px,0.75fr)_minmax(0,2fr)_0px]"
            : "md:grid-cols-[320px_minmax(0,1fr)]"
          }
        `}
      >

        <Sidebar />


        <ChatContainer
          detailsOpen={detailsOpen}
          onToggleDetails={toggleDetails}
        />


        {selectedUser && (
          <RightSideBar
            detailsOpen={detailsOpen}
          />
        )}

      </div>

    </main>
  );
};


export default HomePage;