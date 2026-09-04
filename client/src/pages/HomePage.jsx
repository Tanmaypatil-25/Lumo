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
  ] = useState(false);


  const toggleDetails = () => {
    setDetailsOpen((current) => !current);
  };


  return (
    <main
      className="
        fixed
        inset-0
        h-dvh
        w-full
        overflow-hidden
        overscroll-none
        bg-[#0B0B0F]
        text-white
      "
    >

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

        {/* Sidebar */}
        <div
          className={`
            h-full
            min-h-0
            overflow-hidden

            ${selectedUser
              ? "hidden md:block"
              : "block"
            }
          `}
        >
          <Sidebar />
        </div>


        {/* Conversation */}
        <div
          className={`
            h-full
            min-h-0
            min-w-0
            overflow-hidden

            ${selectedUser
              ? "block"
              : "hidden md:block"
            }
          `}
        >
          <ChatContainer
            detailsOpen={detailsOpen}
            onToggleDetails={toggleDetails}
          />
        </div>


        {/* Conversation details */}
        {selectedUser && (
          <>
            {/* Mobile details */}
            {detailsOpen && (
              <div
                className="
                  fixed
                  inset-0
                  z-50
                  h-dvh
                  w-full
                  overflow-hidden
                  bg-[#0B0B0F]
                  md:hidden
                "
              >
                <RightSideBar
                  detailsOpen={detailsOpen}
                  onClose={toggleDetails}
                />
              </div>
            )}

            {/* Desktop details */}
            <div
              className="
                hidden
                h-full
                min-h-0
                overflow-hidden
                md:block
              "
            >
              <RightSideBar
                detailsOpen={detailsOpen}
              />
            </div>
          </>
        )}

      </div>

    </main>
  );
};


export default HomePage;