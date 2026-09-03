import { useContext, useState } from "react";

import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";


const LoginPage = () => {

  const [currState, setCurrState] =
    useState("Sign up");

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [isDataSubmitted, setIsDataSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);


  const {
    login,
    signup
  } = useContext(AuthContext);


  const isSignup =
    currState === "Sign up";


  const onSubmitHandler = async (event) => {

    event.preventDefault();


    // First step of signup
    if (
      isSignup &&
      !isDataSubmitted
    ) {
      setIsDataSubmitted(true);
      return;
    }


    try {

      setSubmitting(true);


      if (isSignup) {

        await signup({
          fullName,
          email,
          password,
          bio
        });

        return;
      }


      await login({
        email,
        password
      });

    } finally {

      setSubmitting(false);

    }
  };


  const switchToLogin = () => {

    setCurrState("Login");

    setIsDataSubmitted(false);

    setBio("");
  };


  const switchToSignup = () => {

    setCurrState("Sign up");

    setIsDataSubmitted(false);
  };


  const goBackToSignupDetails = () => {

    setIsDataSubmitted(false);
  };


  return (
    <main
      className="
        relative
        flex
        min-h-screen
        w-full
        overflow-hidden
        bg-[#0B0B0F]
        text-white
      "
    >

      {/* Background decoration */}
      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-violet-500/[0.08]
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-48
          right-[-120px]
          h-[500px]
          w-[500px]
          rounded-full
          bg-indigo-500/[0.06]
          blur-[140px]
        "
      />


      <div
        className="
          relative
          z-10
          mx-auto
          grid
          min-h-screen
          w-full
          max-w-[1400px]
          grid-cols-1
          lg:grid-cols-[1.05fr_0.95fr]
        "
      >

        {/* LEFT BRAND SECTION */}
        <section
          className="
            hidden
            min-h-screen
            flex-col
            justify-between
            border-r
            border-white/[0.06]
            px-12
            py-10
            lg:flex
            xl:px-16
          "
        >

          {/* Logo */}
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-[14px]
                border
                border-violet-400/[0.12]
                bg-violet-500/[0.09]
              "
            >
              <img
                src={assets.logo_icon}
                alt=""
                className="h-7 w-7 object-contain"
              />
            </div>

            <div>

              <p
                className="
                  text-[17px]
                  font-semibold
                  tracking-[-0.02em]
                  text-zinc-100
                "
              >
                Lumo
              </p>

              <p className="text-[11px] text-zinc-500">
                Real-time conversations
              </p>

            </div>

          </div>


          {/* Brand content */}
          <div className="max-w-[520px]">

            <div
              className="
                mb-6
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-violet-400/[0.12]
                bg-violet-500/[0.07]
                px-3
                py-1.5
                text-xs
                font-medium
                text-violet-300
              "
            >

              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-violet-400
                "
              />

              Lumo 2.0

            </div>


            <h1
              className="
                max-w-[500px]
                text-[44px]
                font-semibold
                leading-[1.08]
                tracking-[-0.04em]
                text-zinc-50
                xl:text-[52px]
              "
            >
              Conversations that feel
              simple, fast and personal.
            </h1>


            <p
              className="
                mt-5
                max-w-[460px]
                text-[15px]
                leading-7
                text-zinc-400
              "
            >
              Stay connected through fast,
              real-time messaging with a clean
              and focused experience built
              around your conversations.
            </p>


            {/* Feature row */}
            <div
              className="
                mt-9
                grid
                max-w-[480px]
                grid-cols-3
                gap-3
              "
            >

              <div
                className="
                  rounded-[18px]
                  border
                  border-white/[0.06]
                  bg-white/[0.025]
                  p-4
                "
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-violet-300"
                  aria-hidden="true"
                >
                  <path
                    d="M7 8H17M7 12H14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <path
                    d="M20 11.5C20 15.64 16.42 19 12 19C10.78 19 9.63 18.74 8.6 18.28L4 20L5.24 16.46C4.46 15.11 4 13.4 4 11.5C4 7.36 7.58 4 12 4C16.42 4 20 7.36 20 11.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>

                <p className="mt-3 text-xs font-medium text-zinc-300">
                  Real-time
                </p>

              </div>


              <div
                className="
                  rounded-[18px]
                  border
                  border-white/[0.06]
                  bg-white/[0.025]
                  p-4
                "
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-violet-300"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3L19 6V11C19 15.42 16.08 19.3 12 21C7.92 19.3 5 15.42 5 11V6L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9 12L11 14L15 10"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <p className="mt-3 text-xs font-medium text-zinc-300">
                  Secure
                </p>

              </div>


              <div
                className="
                  rounded-[18px]
                  border
                  border-white/[0.06]
                  bg-white/[0.025]
                  p-4
                "
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-violet-300"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />

                  <path
                    d="M12 8V12L15 14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <p className="mt-3 text-xs font-medium text-zinc-300">
                  Instant
                </p>

              </div>

            </div>

          </div>


          <p className="text-xs text-zinc-600">
            Built for simple, meaningful conversations.
          </p>

        </section>


        {/* RIGHT AUTH SECTION */}
        <section
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-5
            py-10
            sm:px-8
            lg:px-10
          "
        >

          <div className="w-full max-w-[440px]">

            {/* Mobile logo */}
            <div
              className="
                mb-10
                flex
                items-center
                justify-center
                gap-2.5
                lg:hidden
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-[13px]
                  border
                  border-violet-400/[0.12]
                  bg-violet-500/[0.09]
                "
              >
                <img
                  src={assets.logo_icon}
                  alt=""
                  className="h-6 w-6"
                />
              </div>

              <span
                className="
                  text-lg
                  font-semibold
                  tracking-[-0.02em]
                "
              >
                Lumo
              </span>

            </div>


            {/* AUTH CARD */}
            <div
              className="
                rounded-[26px]
                border
                border-white/[0.075]
                bg-white/[0.035]
                p-6
                shadow-[0_24px_80px_rgba(0,0,0,0.28)]
                backdrop-blur-2xl
                sm:p-8
              "
            >

              {/* Header */}
              <div>

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p
                      className="
                        text-[24px]
                        font-semibold
                        tracking-[-0.025em]
                        text-zinc-100
                      "
                    >
                      {
                        isSignup
                          ? isDataSubmitted
                            ? "Tell us about yourself"
                            : "Create your account"
                          : "Welcome back"
                      }
                    </p>


                    <p
                      className="
                        mt-2
                        text-[13px]
                        leading-5
                        text-zinc-500
                      "
                    >
                      {
                        isSignup
                          ? isDataSubmitted
                            ? "Add a short bio so people know a little about you."
                            : "Join Lumo and start your conversations."
                          : "Sign in to continue to your conversations."
                      }
                    </p>

                  </div>


                  {
                    isSignup &&
                    isDataSubmitted && (
                      <button
                        type="button"
                        onClick={
                          goBackToSignupDetails
                        }
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
                          border-white/[0.06]
                          bg-white/[0.035]
                          text-zinc-400
                          transition
                          hover:border-white/[0.10]
                          hover:bg-white/[0.06]
                          hover:text-white
                        "
                        aria-label="Go back"
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
                    )
                  }

                </div>


                {/* Signup progress */}
                {
                  isSignup && (
                    <div className="mt-6">

                      <div className="flex gap-2">

                        <div
                          className="
                            h-1
                            flex-1
                            rounded-full
                            bg-violet-500
                          "
                        />

                        <div
                          className={`h-1 flex-1 rounded-full transition ${isDataSubmitted
                            ? "bg-violet-500"
                            : "bg-white/[0.08]"
                            }`}
                        />

                      </div>


                      <div
                        className="
                          mt-2
                          flex
                          justify-between
                          text-[10px]
                          font-medium
                          uppercase
                          tracking-[0.08em]
                          text-zinc-600
                        "
                      >

                        <span>
                          Account
                        </span>

                        <span>
                          Profile
                        </span>

                      </div>

                    </div>
                  )
                }

              </div>


              <form
                onSubmit={onSubmitHandler}
                className="mt-7"
              >

                <div className="space-y-4">

                  {/* Full name */}
                  {
                    isSignup &&
                    !isDataSubmitted && (
                      <div>

                        <label
                          htmlFor="fullName"
                          className="
                            mb-2
                            block
                            text-xs
                            font-medium
                            text-zinc-400
                          "
                        >
                          Full name
                        </label>

                        <div
                          className="
                            flex
                            h-12
                            items-center
                            gap-3
                            rounded-[14px]
                            border
                            border-white/[0.07]
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
                            className="h-[17px] w-[17px] shrink-0 text-zinc-600"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="8"
                              r="4"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />

                            <path
                              d="M5 20C5.6 16.6 8.15 15 12 15C15.85 15 18.4 16.6 19 20"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                          </svg>


                          <input
                            id="fullName"
                            onChange={(event) =>
                              setFullName(
                                event.target.value
                              )
                            }
                            value={fullName}
                            type="text"
                            placeholder="Enter your full name"
                            required
                            autoComplete="name"
                            className="
                              min-w-0
                              flex-1
                              bg-transparent
                              text-sm
                              text-zinc-200
                              outline-none
                              placeholder:text-zinc-600
                            "
                          />

                        </div>

                      </div>
                    )
                  }


                  {/* Email */}
                  {
                    !isDataSubmitted && (
                      <div>

                        <label
                          htmlFor="email"
                          className="
                            mb-2
                            block
                            text-xs
                            font-medium
                            text-zinc-400
                          "
                        >
                          Email
                        </label>

                        <div
                          className="
                            flex
                            h-12
                            items-center
                            gap-3
                            rounded-[14px]
                            border
                            border-white/[0.07]
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
                            className="h-[17px] w-[17px] shrink-0 text-zinc-600"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="5"
                              width="18"
                              height="14"
                              rx="3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />

                            <path
                              d="M4 7L12 13L20 7"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>


                          <input
                            id="email"
                            onChange={(event) =>
                              setEmail(
                                event.target.value
                              )
                            }
                            value={email}
                            type="email"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            className="
                              min-w-0
                              flex-1
                              bg-transparent
                              text-sm
                              text-zinc-200
                              outline-none
                              placeholder:text-zinc-600
                            "
                          />

                        </div>

                      </div>
                    )
                  }


                  {/* Password */}
                  {
                    !isDataSubmitted && (
                      <div>

                        <label
                          htmlFor="password"
                          className="
                            mb-2
                            block
                            text-xs
                            font-medium
                            text-zinc-400
                          "
                        >
                          Password
                        </label>

                        <div
                          className="
                            flex
                            h-12
                            items-center
                            gap-3
                            rounded-[14px]
                            border
                            border-white/[0.07]
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
                            className="h-[17px] w-[17px] shrink-0 text-zinc-600"
                            aria-hidden="true"
                          >
                            <rect
                              x="5"
                              y="10"
                              width="14"
                              height="10"
                              rx="3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />

                            <path
                              d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                          </svg>


                          <input
                            id="password"
                            onChange={(event) =>
                              setPassword(
                                event.target.value
                              )
                            }
                            value={password}
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            autoComplete={
                              isSignup
                                ? "new-password"
                                : "current-password"
                            }
                            className="
    min-w-0
    flex-1
    bg-transparent
    text-sm
    text-zinc-200
    outline-none
    placeholder:text-zinc-600
  "
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (current) => !current
                              )
                            }
                            className="
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-lg
    text-zinc-500
    transition
    hover:bg-white/[0.05]
    hover:text-zinc-300
  "
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-[17px] w-[17px]"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3 3L21 21"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M10.6 10.7C10.2 11.05 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.95 13.8 13.3 13.4"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M6.4 6.5C4.85 7.55 3.65 9.1 3 12C4.4 16.3 7.8 19 12 19C13.55 19 14.95 18.65 16.2 18"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M9.8 5.2C10.5 5.05 11.25 5 12 5C16.2 5 19.6 7.7 21 12C20.55 13.35 19.9 14.5 19.1 15.45"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-[17px] w-[17px]"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3 12C4.4 7.7 7.8 5 12 5C16.2 5 19.6 7.7 21 12C19.6 16.3 16.2 19 12 19C7.8 19 4.4 16.3 3 12Z"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinejoin="round"
                                />

                                <circle
                                  cx="12"
                                  cy="12"
                                  r="2.5"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                />
                              </svg>
                            )}
                          </button>

                        </div>

                      </div>
                    )
                  }


                  {/* Bio */}
                  {
                    isSignup &&
                    isDataSubmitted && (
                      <div>

                        <div
                          className="
                            mb-2
                            flex
                            items-center
                            justify-between
                            gap-4
                          "
                        >

                          <label
                            htmlFor="bio"
                            className="
                              text-xs
                              font-medium
                              text-zinc-400
                            "
                          >
                            Short bio
                          </label>


                          <span
                            className="
                              text-[10px]
                              text-zinc-600
                            "
                          >
                            {bio.length}/160
                          </span>

                        </div>


                        <textarea
                          id="bio"
                          onChange={(event) =>
                            setBio(
                              event.target.value
                            )
                          }
                          value={bio}
                          rows={5}
                          maxLength={160}
                          placeholder="Tell people a little about yourself..."
                          required
                          className="
                            min-h-[130px]
                            w-full
                            resize-none
                            rounded-[16px]
                            border
                            border-white/[0.07]
                            bg-white/[0.035]
                            px-4
                            py-3
                            text-sm
                            leading-6
                            text-zinc-200
                            outline-none
                            transition
                            placeholder:text-zinc-600
                            focus:border-violet-400/30
                            focus:bg-white/[0.05]
                          "
                        />

                      </div>
                    )
                  }

                </div>


                {/* Terms */}
                {
                  !isDataSubmitted && (
                    <label
                      className="
                        mt-5
                        flex
                        cursor-pointer
                        items-start
                        gap-3
                        text-[12px]
                        leading-5
                        text-zinc-500
                      "
                    >

                      <input
                        type="checkbox"
                        required
                        className="
                          mt-1
                          h-4
                          w-4
                          shrink-0
                          accent-violet-500
                        "
                      />

                      <span>
                        I agree to the Terms of Use
                        and Privacy Policy.
                      </span>

                    </label>
                  )
                }


                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    lumo-interactive
                    mt-6
                    flex
                    h-12
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-[14px]
                    bg-violet-600
                    px-4
                    text-sm
                    font-semibold
                    text-white
                    shadow-[0_8px_30px_rgba(124,58,237,0.18)]
                    transition
                    hover:bg-violet-500
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {
                    submitting ? (

                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-[17px] w-[17px] animate-spin"
                          aria-hidden="true"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="opacity-20"
                          />

                          <path
                            d="M21 12A9 9 0 0 0 12 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>

                        Please wait
                      </>

                    ) : (

                      <>
                        {
                          isSignup
                            ? isDataSubmitted
                              ? "Create account"
                              : "Continue"
                            : "Sign in"
                        }

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-[17px] w-[17px]"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12H19M14 7L19 12L14 17"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </>

                    )
                  }

                </button>


                {/* Switch auth mode */}
                <div
                  className="
                    mt-6
                    border-t
                    border-white/[0.06]
                    pt-5
                    text-center
                  "
                >

                  {
                    isSignup ? (

                      <p className="text-[13px] text-zinc-500">

                        Already have an account?{" "}

                        <button
                          type="button"
                          onClick={switchToLogin}
                          className="
                            font-medium
                            text-violet-300
                            transition
                            hover:text-violet-200
                          "
                        >
                          Sign in
                        </button>

                      </p>

                    ) : (

                      <p className="text-[13px] text-zinc-500">

                        New to Lumo?{" "}

                        <button
                          type="button"
                          onClick={switchToSignup}
                          className="
                            font-medium
                            text-violet-300
                            transition
                            hover:text-violet-200
                          "
                        >
                          Create an account
                        </button>

                      </p>

                    )
                  }

                </div>

              </form>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
};


export default LoginPage;