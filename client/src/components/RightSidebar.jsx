import { useContext, useMemo } from "react";

import defaultAvatar from "../assets/branding/lumo-avatar-default.svg";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";


const RightSideBar = ({
  detailsOpen
}) => {

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


  if (!selectedUser) {
    return null;
  }


  const isOnline =
    onlineUsers.includes(selectedUser._id);


  return (
    <aside
      className={`
    relative
    hidden
    h-full
    min-h-0
    min-w-0
    w-full
    flex-col
    overflow-hidden
    bg-white/[0.018]
    text-white
    backdrop-blur-xl

    transition-[opacity,border-color]
duration-500
ease-in-out

    md:flex

    ${detailsOpen
          ? `
      border-l
      border-white/[0.07]
      opacity-100
    `
          : `
      pointer-events-none
      border-l
      border-transparent
      opacity-0
    `
        }
  `}
    >

      {/* HEADER */}
      <div
        className="
          flex
          h-[76px]
          shrink-0
          items-center
          border-b
          border-white/[0.06]
          px-5
        "
      >
        <div>
          <p className="text-[15px] font-semibold text-zinc-100">
            Conversation details
          </p>

          <p className="mt-0.5 text-xs text-zinc-500">
            Profile and shared media
          </p>
        </div>
      </div>


      {/* SCROLLABLE CONTENT */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">

        {/* PROFILE CARD */}
        <section
          className="
            rounded-[22px]
            border
            border-white/[0.07]
            bg-white/[0.035]
            p-5
            shadow-[0_12px_36px_rgba(0,0,0,0.10)]
          "
        >

          <div className="flex flex-col items-center text-center">

            {/* Avatar */}
            <div className="relative">

              <img
                src={
                  selectedUser.profilePic ||
                  defaultAvatar
                }
                alt={selectedUser.fullName}
                className="
                  h-20
                  w-20
                  rounded-full
                  object-cover
                  ring-1
                  ring-white/[0.10]
                "
              />

              <span
                className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#17171d] ${isOnline
                  ? "bg-green-400"
                  : "bg-zinc-600"
                  }`}
              />

            </div>


            {/* Name */}
            <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-zinc-100">
              {selectedUser.fullName}
            </h2>


            {/* Status */}
            <div className="mt-1 flex items-center gap-1.5">

              <span
                className={`h-1.5 w-1.5 rounded-full ${isOnline
                  ? "bg-green-400"
                  : "bg-zinc-600"
                  }`}
              />

              <span
                className={`text-xs font-medium ${isOnline
                  ? "text-green-400"
                  : "text-zinc-500"
                  }`}
              >
                {isOnline
                  ? "Online"
                  : "Offline"}
              </span>

            </div>


            {/* Bio */}
            {selectedUser.bio && (
              <p className="mt-4 max-w-[240px] text-[13px] leading-5 text-zinc-400">
                {selectedUser.bio}
              </p>
            )}

          </div>

        </section>


        {/* MEDIA SECTION */}
        <section className="mt-7">

          <div className="mb-3 flex items-center justify-between">

            <div>

              <p className="text-[13px] font-semibold text-zinc-200">
                Shared media
              </p>

              <p className="mt-0.5 text-[11px] text-zinc-500">
                {msgImages.length === 0
                  ? "No media shared yet"
                  : `${msgImages.length} ${msgImages.length === 1
                    ? "item"
                    : "items"
                  }`}
              </p>

            </div>


            {msgImages.length > 0 && (
              <div
                className="
                  flex
                  h-8
                  min-w-8
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/[0.06]
                  bg-white/[0.035]
                  px-2
                  text-[11px]
                  font-medium
                  text-zinc-400
                "
              >
                {msgImages.length}
              </div>
            )}

          </div>


          {/* EMPTY MEDIA STATE */}
          {msgImages.length === 0 ? (

            <div
              className="
                flex
                min-h-[130px]
                flex-col
                items-center
                justify-center
                rounded-[18px]
                border
                border-dashed
                border-white/[0.08]
                bg-white/[0.02]
                px-4
                text-center
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/[0.045]
                  text-zinc-500
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />

                  <circle
                    cx="8.5"
                    cy="9"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />

                  <path
                    d="M3.5 17L8.5 12L12.5 16L15.5 13L20.5 18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="mt-3 text-xs font-medium text-zinc-400">
                No shared media
              </p>

              <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                Images shared in this conversation
                will appear here.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-2">

              {msgImages.map((image) => (

                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    openImage(image.url)
                  }
                  className="
                    group
                    relative
                    aspect-square
                    overflow-hidden
                    rounded-[14px]
                    border
                    border-white/[0.07]
                    bg-white/[0.035]
                    transition
                    hover:border-white/[0.12]
                    active:scale-[0.98]
                  "
                  aria-label="Open shared image"
                >

                  <img
                    src={image.url}
                    alt="Shared media"
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-[1.04]
                    "
                  />


                  {/* Hover overlay */}
                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      bg-black/0
                      opacity-0
                      transition
                      duration-200
                      group-hover:bg-black/25
                      group-hover:opacity-100
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/[0.10]
                        bg-black/35
                        text-white
                        backdrop-blur-md
                      "
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[17px] w-[17px]"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 5H19V10"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M19 5L12 12"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />

                        <path
                          d="M10 6H7C5.9 6 5 6.9 5 8V17C5 18.1 5.9 19 7 19H16C17.1 19 18 18.1 18 17V14"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                  </div>

                </button>

              ))}

            </div>

          )}

        </section>

      </div>


      {/* FOOTER */}
      <div
        className="
          shrink-0
          border-t
          border-white/[0.06]
          p-4
        "
      >

        <button
          type="button"
          onClick={logout}
          className="
            lumo-interactive
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-[14px]
            border
            border-red-400/[0.10]
            bg-red-500/[0.07]
            px-4
            py-2.5
            text-sm
            font-medium
            text-red-300
            transition
            hover:border-red-400/[0.16]
            hover:bg-red-500/[0.11]
            hover:text-red-200
            active:scale-[0.99]
          "
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[17px] w-[17px]"
            aria-hidden="true"
          >
            <path
              d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />

            <path
              d="M14 8L18 12L14 16"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M18 12H9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>

          Logout

        </button>

      </div>

    </aside>
  );
};


export default RightSideBar;