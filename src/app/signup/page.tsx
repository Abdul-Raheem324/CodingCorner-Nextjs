"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  password: string;
  email: string;
}

function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>({
    username: "",
    password: "",
    email: "",
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onSignUp = async () => {
    if (!user.email.endsWith("@gmail.com")) {
      toast.error("Please enter a valid Gmail address.");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/users/signup", user);
      toast.success("User registered successfully");
      router.push("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          if (error.response.data && error.response.data.error) {
            toast.error(error.response.data.error);
          } else {
            toast.error("Error in registration!");
          }
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
      onSignUp();
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
            alt="CodingCorner Logo"
            width={48}
            height={48}
            className="w-12"
          />
          <h1 className="font-bebas text-3xl text-gray-900">CodingCorner</h1>
        </div>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700"
            >
              Username
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onKeyUp={handleInputEnter}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>
            <input
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
              onClick={onSignUp}
            >
              {loading ? <ClipLoader size={32} color="white" /> : "Sign Up"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Page;
