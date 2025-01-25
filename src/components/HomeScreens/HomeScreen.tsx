"use client";

import React from "react";
import Room from "../Room/Room";
import Image from "next/image";

function HomeScreen() {
  return (
    <div className="w-full sm:w-2/3 bg-gradient-to-r flex flex-col h-full items-center justify-center from-slate-700 to-slate-800 font-Roboto p-4">
      <div className="flex flex-col items-center mb-8">
        <Image src="/logo.png" alt="logo" className="w-24 sm:w-36 mb-4" height={64} width={64} priority />
        <h1 className="font-bebas text-2xl sm:text-3xl md:text-5xl text-gray-200 tracking-wider font-header">
          CodingCorner
        </h1>
      </div>
      <div className="mb-6 text-center">
        <p className="text-md sm:text-lg text-gray-400">
          Code, Compile, Conquer
        </p>
      </div>
      <Room />
    </div>
  );
}

export default HomeScreen;
