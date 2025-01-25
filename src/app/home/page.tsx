"use client";

import FolderSection from "@/components/HomeScreens/FolderSection";
import HomeScreen from "@/components/HomeScreens/HomeScreen";
import React from "react";

function HomePage() {
  return (
    <div className="flex flex-col sm:flex-row w-full h-screen">
      <HomeScreen />
      <FolderSection />
    </div>
  );
}

export default HomePage;
