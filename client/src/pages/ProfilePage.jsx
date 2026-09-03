import {
  useContext,
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext.jsx";

import toast from "react-hot-toast";

import {
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES
} from "../constants/chat";

const ProfilePage = () => {
  const {
    authUser,
    updateProfile
  } = useContext(AuthContext);

  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] =
    useState(null);

  const [name, setName] =
    useState(authUser?.fullName || "");

  const [bio, setBio] =
    useState(authUser?.bio || "");

  const [previewUrl, setPreviewUrl] =
    useState(
      authUser?.profilePic || null
    );

  const [saving, setSaving] =
    useState(false);

  const fileToBase64 = (file) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(reader.result);

        reader.onerror = () =>
          reject(
            new Error(
              "Could not read the selected image"
            )
          );

        reader.readAsDataURL(file);
      }
    );
  };

  const handleImageSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      toast.error(
        "Only JPG, PNG, and WebP images are allowed"
      );

      event.target.value = "";

      return;
    }

    if (
      file.size > MAX_IMAGE_SIZE
    ) {
      toast.error(
        "Image must be smaller than 2 MB"
      );

      event.target.value = "";

      return;
    }

    setSelectedImg(file);
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (saving) return;

    const cleanName =
      name.trim();

    const cleanBio =
      bio.trim();

    if (
      !cleanName ||
      !cleanBio
    ) {
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        fullName: cleanName,
        bio: cleanBio
      };

      if (selectedImg) {
        profileData.profilePic =
          await fileToBase64(
            selectedImg
          );
      }

      const success =
        await updateProfile(
          profileData
        );

      if (success) {
        navigate("/");
      }
    } catch (error) {
      toast.error(
        error?.message ||
          "Could not update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeSelectedImage =
    () => {
      setSelectedImg(null);
    };

  useEffect(() => {
    if (!selectedImg) {
      setPreviewUrl(
        authUser?.profilePic ||
          null
      );

      return;
    }

    const objectUrl =
      URL.createObjectURL(
        selectedImg
      );

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [
    selectedImg,
    authUser?.profilePic
  ]);

  return (
    <main
      className="
        relative
        h-screen
        overflow-y-auto
        overflow-x-hidden
        bg-[#0B0B0F]
        text-white
      "
    >
      {/* Background glow */}

      <div
        className="
          pointer-events-none
          fixed
          -left-32
          top-20
          h-80
          w-80
          rounded-full
          bg-violet-600/[0.10]
          blur-[130px]
        "
      />

      <div
        className="
          pointer-events-none
          fixed
          -right-32
          bottom-10
          h-96
          w-96
          rounded-full
          bg-indigo-600/[0.08]
          blur-[140px]
        "
      />

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-6xl
          px-4
          py-6
          sm:px-6
          sm:py-8
          lg:px-8
        "
      >
        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-white/[0.08]
            bg-[#121217]/90
            shadow-2xl
            shadow-black/30
            backdrop-blur-2xl
          "
        >
          {/* Header */}

          <header
            className="
              sticky
              top-0
              z-30
              flex
              items-center
              justify-between
              border-b
              border-white/[0.07]
              bg-[#121217]/95
              px-4
              py-3.5
              backdrop-blur-2xl
              sm:px-6
            "
          >
            {/* Header left */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                disabled={saving}
                className="
                  lumo-interactive
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/[0.07]
                  bg-white/[0.035]
                  text-zinc-400
                  transition
                  hover:bg-white/[0.07]
                  hover:text-white
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
                aria-label="Back to conversations"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    text-base
                    font-semibold
                    tracking-[-0.015em]
                    text-zinc-100
                    sm:text-lg
                  "
                >
                  Profile settings
                </h1>

                <p
                  className="
                    hidden
                    text-xs
                    text-zinc-500
                    sm:block
                  "
                >
                  Manage how you
                  appear on Lumo
                </p>
              </div>
            </div>

            {/* Header actions */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                disabled={saving}
                className="
                  hidden
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.035]
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-zinc-400
                  transition
                  hover:bg-white/[0.07]
                  hover:text-zinc-200
                  disabled:pointer-events-none
                  disabled:opacity-50
                  sm:block
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                form="profile-form"
                disabled={
                  saving ||
                  !name.trim() ||
                  !bio.trim()
                }
                className="
                  lumo-interactive
                  inline-flex
                  min-w-[116px]
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-violet-950/25
                  transition
                  hover:bg-violet-500
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >
                {saving ? (
                  <>
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/25
                        border-t-white
                      "
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12L10 17L19 7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    Save
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Content */}

          <div
            className="
              grid
              lg:grid-cols-[minmax(0,1.2fr)_minmax(310px,0.8fr)]
            "
          >
            {/* Form */}

            <form
              id="profile-form"
              onSubmit={handleSubmit}
              className="
                p-5
                sm:p-7
                lg:p-9
              "
            >
              <div
                className="
                  mx-auto
                  max-w-xl
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-violet-300/70
                  "
                >
                  Personal information
                </p>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-semibold
                    tracking-[-0.025em]
                    text-zinc-100
                  "
                >
                  Make your profile
                  yours.
                </h2>

                <p
                  className="
                    mt-2
                    max-w-lg
                    text-sm
                    leading-6
                    text-zinc-500
                  "
                >
                  Update your name,
                  profile photo and bio.
                  These details are
                  visible to people you
                  chat with.
                </p>

                {/* Profile photo */}

                <div
                  className="
                    mt-7
                    rounded-2xl
                    border
                    border-white/[0.07]
                    bg-white/[0.025]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      sm:flex-row
                      sm:items-center
                    "
                  >
                    <div
                      className="
                        relative
                        h-16
                        w-16
                        shrink-0
                      "
                    >
                      <img
                        src={
                          previewUrl ||
                          assets.avatar_icon
                        }
                        alt="Profile preview"
                        className="
                          h-full
                          w-full
                          rounded-2xl
                          object-cover
                          ring-1
                          ring-white/[0.1]
                        "
                      />

                      <span
                        className="
                          absolute
                          -bottom-1
                          -right-1
                          flex
                          h-5
                          w-5
                          items-center
                          justify-center
                          rounded-full
                          border-2
                          border-[#15151A]
                          bg-violet-500
                        "
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-3 w-3"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 8V16M8 12H16"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-medium
                          text-zinc-200
                        "
                      >
                        Profile photo
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-zinc-500
                        "
                      >
                        JPG, PNG or WebP.
                        Maximum file size
                        2 MB.
                      </p>

                      <div
                        className="
                          mt-3
                          flex
                          flex-wrap
                          gap-2
                        "
                      >
                        <label
                          htmlFor="avatar"
                          className="
                            lumo-interactive
                            inline-flex
                            cursor-pointer
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-violet-400/20
                            bg-violet-500/[0.10]
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-violet-200
                            transition
                            hover:bg-violet-500/[0.16]
                          "
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 16V4M12 4L8 8M12 4L16 8"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M5 14V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V14"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>

                          Change photo

                          <input
                            type="file"
                            id="avatar"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                              handleImageSelect
                            }
                            hidden
                          />
                        </label>

                        {selectedImg && (
                          <button
                            type="button"
                            onClick={
                              removeSelectedImage
                            }
                            className="
                              rounded-xl
                              border
                              border-white/[0.07]
                              bg-white/[0.035]
                              px-3
                              py-2
                              text-xs
                              font-medium
                              text-zinc-400
                              transition
                              hover:bg-white/[0.07]
                              hover:text-zinc-200
                            "
                          >
                            Undo selection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display name */}

                <div className="mt-6">
                  <label
                    htmlFor="profile-name"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-zinc-300
                    "
                  >
                    Display name
                  </label>

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-2xl
                      border
                      border-white/[0.08]
                      bg-white/[0.035]
                      px-4
                      transition
                      focus-within:border-violet-400/30
                      focus-within:bg-white/[0.05]
                    "
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="
                        h-[18px]
                        w-[18px]
                        shrink-0
                        text-zinc-600
                      "
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />

                      <path
                        d="M5 19C5.7 15.7 8.1 14 12 14C15.9 14 18.3 15.7 19 19"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>

                    <input
                      id="profile-name"
                      type="text"
                      required
                      maxLength={50}
                      autoComplete="name"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      placeholder="Your name"
                      className="
                        min-w-0
                        flex-1
                        bg-transparent
                        py-3.5
                        text-sm
                        text-zinc-200
                        outline-none
                        placeholder:text-zinc-600
                      "
                    />
                  </div>
                </div>

                {/* Bio */}

                <div className="mt-5">
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <label
                      htmlFor="profile-bio"
                      className="
                        text-sm
                        font-medium
                        text-zinc-300
                      "
                    >
                      Bio
                    </label>

                    <span
                      className="
                        text-xs
                        text-zinc-600
                      "
                    >
                      {bio.length}/160
                    </span>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/[0.08]
                      bg-white/[0.035]
                      transition
                      focus-within:border-violet-400/30
                      focus-within:bg-white/[0.05]
                    "
                  >
                    <textarea
                      id="profile-bio"
                      required
                      maxLength={160}
                      rows={4}
                      value={bio}
                      onChange={(event) =>
                        setBio(
                          event.target.value
                        )
                      }
                      placeholder="Tell people a little about yourself"
                      className="
                        min-h-28
                        w-full
                        resize-none
                        bg-transparent
                        px-4
                        py-3.5
                        text-sm
                        leading-6
                        text-zinc-200
                        outline-none
                        placeholder:text-zinc-600
                      "
                    />
                  </div>
                </div>

                {/* Mobile actions */}

                <div
                  className="
                    mt-6
                    grid
                    grid-cols-2
                    gap-3
                    sm:hidden
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/")
                    }
                    disabled={saving}
                    className="
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-white/[0.035]
                      px-4
                      py-3
                      text-sm
                      font-medium
                      text-zinc-400
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !name.trim() ||
                      !bio.trim()
                    }
                    className="
                      rounded-xl
                      bg-violet-600
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      disabled:opacity-50
                    "
                  >
                    {saving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </div>
            </form>

            {/* Preview */}

            <aside
              className="
                border-t
                border-white/[0.07]
                bg-white/[0.018]
                p-5
                sm:p-7
                lg:border-l
                lg:border-t-0
                lg:p-9
              "
            >
              <div
                className="
                  lg:sticky
                  lg:top-24
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-zinc-600
                  "
                >
                  Preview
                </p>

                <div
                  className="
                    mt-4
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-white/[0.08]
                    bg-gradient-to-b
                    from-white/[0.055]
                    to-white/[0.025]
                    p-6
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      text-center
                    "
                  >
                    <div className="relative">
                      <img
                        src={
                          previewUrl ||
                          assets.avatar_icon
                        }
                        alt="Profile"
                        className="
                          h-28
                          w-28
                          rounded-[28px]
                          object-cover
                          shadow-xl
                          shadow-black/30
                          ring-1
                          ring-white/[0.1]
                        "
                      />

                      <span
                        className="
                          absolute
                          -bottom-1
                          -right-1
                          h-5
                          w-5
                          rounded-full
                          border-[3px]
                          border-[#17171C]
                          bg-green-400
                        "
                      />
                    </div>

                    <h3
                      className="
                        mt-5
                        max-w-full
                        truncate
                        text-lg
                        font-semibold
                        text-zinc-100
                      "
                    >
                      {name.trim() ||
                        "Your name"}
                    </h3>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-medium
                        text-green-400
                      "
                    >
                      Online
                    </p>

                    <p
                      className="
                        mt-4
                        max-w-sm
                        break-words
                        text-sm
                        leading-6
                        text-zinc-500
                      "
                    >
                      {bio.trim() ||
                        "Your bio will appear here."}
                    </p>
                  </div>

                  <div
                    className="
                      mt-6
                      border-t
                      border-white/[0.07]
                      pt-5
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <span
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          bg-violet-500/[0.10]
                          text-violet-300
                        "
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-[17px] w-[17px]"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 7.5C6 6.1 7.1 5 8.5 5H15.5C16.9 5 18 6.1 18 7.5V13.5C18 14.9 16.9 16 15.5 16H11L7 19V16H8.5C7.1 16 6 14.9 6 13.5V7.5Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <div>
                        <p
                          className="
                            text-xs
                            font-medium
                            text-zinc-300
                          "
                        >
                          Public profile
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-xs
                            text-zinc-600
                          "
                        >
                          Visible in your
                          conversations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;