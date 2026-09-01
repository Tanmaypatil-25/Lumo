import { useContext, useState } from "react";

import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";


const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign up");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const {
    login,
    signup
  } = useContext(AuthContext);


  const onSubmitHandler = async (event) => {

    event.preventDefault();


    // First step of signup
    if (
      currState === "Sign up" &&
      !isDataSubmitted
    ) {
      setIsDataSubmitted(true);
      return;
    }


    // Signup
    if (currState === "Sign up") {

      await signup({
        fullName,
        email,
        password,
        bio
      });

      return;
    }


    // Login
    await login({
      email,
      password
    });
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


  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">

      {/* Left section */}
      <img
        src={assets.logo_big}
        className="w-[min(30vw,250px)]"
        alt="Lumo logo"
      />


      {/* Right section */}
      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
      >

        <h2 className="font-medium text-2xl flex justify-between items-center">

          {currState}

          {
            currState === "Sign up" &&
            isDataSubmitted && (
              <button
                type="button"
                onClick={() =>
                  setIsDataSubmitted(false)
                }
                className="cursor-pointer"
                aria-label="Go back"
              >
                <img
                  src={assets.arrow_icon}
                  className="w-5"
                  alt=""
                />
              </button>
            )
          }

        </h2>


        {
          currState === "Sign up" &&
          !isDataSubmitted && (
            <input
              onChange={(event) =>
                setFullName(event.target.value)
              }
              value={fullName}
              type="text"
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Full Name"
              required
            />
          )
        }


        {
          !isDataSubmitted && (
            <>
              <input
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                value={email}
                type="email"
                placeholder="Email Address"
                required
                className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                value={password}
                type="password"
                placeholder="Password"
                required
                minLength={6}
                className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </>
          )
        }


        {
          currState === "Sign up" &&
          isDataSubmitted && (
            <textarea
              onChange={(event) =>
                setBio(event.target.value)
              }
              value={bio}
              rows={4}
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Set a short bio"
              required
            />
          )
        }


        <button
          type="submit"
          className="py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer"
        >
          {
            currState === "Sign up"
              ? isDataSubmitted
                ? "Create Account"
                : "Continue"
              : "Login Now"
          }
        </button>


        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            required
          />

          <p>
            Agree to the terms of use & privacy policy.
          </p>
        </div>


        <div className="flex flex-col gap-2">

          {
            currState === "Sign up" ? (

              <p className="text-sm text-gray-600">

                Already have an account?{" "}

                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-medium text-violet-500 cursor-pointer"
                >
                  Login here
                </button>

              </p>

            ) : (

              <p className="text-sm text-gray-600">

                Create an account{" "}

                <button
                  type="button"
                  onClick={switchToSignup}
                  className="font-medium text-violet-500 cursor-pointer"
                >
                  Sign Up!
                </button>

              </p>

            )
          }

        </div>

      </form>

    </div>
  );
};


export default LoginPage;