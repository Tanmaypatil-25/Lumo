import { useContext, useMemo } from "react";

import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";


const RightSideBar = () => {

  const {
    selectedUser,
    messages
  } = useContext(ChatContext);

  const {
    logout,
    onlineUsers
  } = useContext(AuthContext);


  // Derive shared media directly from messages
  const msgImages = useMemo(
    () =>
      messages
        .filter((msg) => msg.image)
        .map((msg) => ({
          id: msg._id,
          url: msg.image
        })),
    [messages]
  );


  const openImage = (url) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };


  return selectedUser && (
    <div
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >

      {/* Profile section */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">

        <img
          src={
            selectedUser.profilePic ||
            assets.avatar_icon
          }
          alt=""
          className="w-20 aspect-[1/1] rounded-full"
        />

        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">

          {onlineUsers.includes(
            selectedUser._id
          ) && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}

          {selectedUser.fullName}

        </h1>

        <p className="px-10 mx-auto">
          {selectedUser.bio}
        </p>

      </div>


      <hr className="border-[#ffffff50] my-4" />


      {/* Media section */}
      <div className="px-5 text-xs">

        <p>Media</p>

        <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">

          {msgImages.map((image) => (

            <button
              key={image.id}
              type="button"
              onClick={() =>
                openImage(image.url)
              }
              className="cursor-pointer rounded"
            >

              <img
                src={image.url}
                alt="Shared media"
                className="h-full rounded-md"
              />

            </button>

          ))}

        </div>

      </div>


      {/* Logout section */}
      <button
        type="button"
        onClick={logout}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer"
      >
        Logout
      </button>

    </div>
  );
};


export default RightSideBar;