"use client";

import { usePlaygroundState } from "@/context/playgroundProvider";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";

interface User {
  _id: string;
  password: string;
  email: string;
}

function Page() {
  const { setUser } = usePlaygroundState();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user1, setUser1] = useState<User>({
    password: "",
    email: "",
    _id: "",
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser1(JSON.parse(storedUser));
      }
    }
  }, []);

  const onLogin = async () => {
    if (!user1.email || !user1.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!user1.email.endsWith("@gmail.com")) {
      toast.error("Please enter a valid Gmail address.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", user1);
      const data = response.data.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data));
      }

      setUser?.(data);
      toast.success("Login successful!");
      router.push("/home");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          toast.error(error.response.data.error || "Error in registration!");
        } else {
          toast.error("An unexpected error occurred.");
        }
        console.log(error.message);
      } else {
        toast.error("An unknown error occurred.");
        console.log(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputEnter = (e: React.KeyboardEvent) => {
    if (e.code === "Enter") {
      onLogin();
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e7f0fd]">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 md:p-8">
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="w-19"
            priority={true}
          />
          <h1 className="text-3xl font-bebas text-gray-900">CodingCorner</h1>
        </div>
        <form className="space-y-6 font-Roboto">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>
            <input
              value={user1.email}
              onChange={(e) => setUser1({ ...user1, email: e.target.value })}
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onKeyUp={handleInputEnter}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <input
              value={user1.password}
              onChange={(e) => setUser1({ ...user1, password: e.target.value })}
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium transition text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
              onClick={onLogin}
            >
              {loading ? <ClipLoader size={32} color="white" /> : "Login"}
            </button>
          </div>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-center">
          <p className="text-sm text-gray-600">Create Account :</p>

          <div>
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
