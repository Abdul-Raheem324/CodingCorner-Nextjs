"use client";

import Image from "next/image";
import Link from "next/link";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { usePlaygroundState } from "@/context/playgroundProvider";
import { useEffect, useState } from "react";
import RingLoader from "react-spinners/RingLoader";

function HomePage() {
  const { user } = usePlaygroundState();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#e7f0fd] flex justify-center items-center">
        <RingLoader color="#00b5d8" size={75} />
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col h-screen font-Roboto">
      <div className="w-full bg-white border flex justify-between items-center shadow-lg px-4 py-2 md:px-8">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="CodingCorner Logo"
            width={64}
            height={64}
            className="w-12 md:w-16"
          />
          <h1 className="text-xl font-bebas md:text-2xl tracking-wide font-header">
            CodingCorner
          </h1>
        </div>
        {user ? (
          <div>
            <h1>{user?.username}</h1>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <Link
              className="px-3 py-2 hover:border-black rounded-md hover:bg-[#3b82f5] transition delay-100 hover:text-gray-200 text-blue-500 text-sm md:text-lg font-semibold"
              href={"/login"}
            >
              Login
            </Link>
            <Link
              className="px-3 py-1 border rounded-md border-[#3b82f5] hover:bg-[#5576ac] transition delay-100 text-blue-500 hover:text-gray-200 text-sm md:text-lg"
              href={"/signup"}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      <div className="w-full h-full flex flex-col lg:flex-row justify-between p-4 md:p-12 bg-[#e7f0fd]">
        <div className="flex flex-col justify-center p-4 md:p-8 flex-1">
          <div className="relative w-full">
            <TypewriterEffectSmooth
              words={[{ text: "Begin Your Coding Adventure Today" }]}
            />
          </div>
          <p className="text-lg md:text-xl text-[#babbc1] mb-4 md:mb-6">
            Learn to code from scratch and unleash your creativity with every
            line.
          </p>
          <div>
            <button className="flex gap-2 items-center text-[#54454e] shadow-xl text-sm md:text-lg bg-gray-50 backdrop-blur-md lg:font-semibold isolation-auto before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-sky-500 hover:text-gray-50 before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 relative z-10 px-3 py-1 md:px-4 md:py-2 overflow-hidden border-2 rounded-full group">
              {user ? (
                <Link href={"/home"}>Start Coding!</Link>
              ) : (
                <Link href={"/login"}>Get Started</Link>
              )}
              <svg
                className="w-6 h-6 md:w-8 md:h-8 justify-end group-hover:rotate-90 group-hover:bg-gray-50 text-gray-50 ease-linear duration-300 rounded-full border border-gray-700 group-hover:border-none p-1 md:p-2 rotate-45"
                viewBox="0 0 16 19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                  className="fill-gray-800 group-hover:fill-gray-800"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center p-4 md:p-8 flex-1">
          <Image
            src="/illustration.png"
            className="w-full max-w-xs md:max-w-md lg:max-w-lg xl:max-w-4xl object-contain"
            alt="Coding Illustration"
            width={640}
            height={480}
            quality={100}
            priority={true}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
