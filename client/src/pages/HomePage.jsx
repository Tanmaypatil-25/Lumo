import { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0B0B0F] text-white">
      <div
        className={`grid h-full w-full grid-cols-1 ${selectedUser
            ? "md:grid-cols-[320px_minmax(0,1fr)_320px]"
            : "md:grid-cols-[320px_minmax(0,1fr)]"
          }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSideBar />
      </div>
    </main>
  );
};

export default HomePage;