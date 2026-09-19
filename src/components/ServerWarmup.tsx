"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ServerWarmup() {
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // 1. Silent early wake-up ping to backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    try {
      fetch(`${apiUrl}/ping`, { mode: "no-cors" }).catch(() => {});
    } catch {}

    // 2. Global Axios request interceptor for delayed responses
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const requestId = `${config.method || "get"}_${config.url}_${Date.now()}`;
      (config as any).__requestId = requestId;

      // If request takes longer than 3 seconds, show friendly free tier cold-start notice
      const timer = setTimeout(() => {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-xl">☕</span>
              <div>
                <p className="font-semibold text-sm text-slate-800">
                  Waking up free server (Render)...
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  The backend spins down after inactivity. Cold starts take ~30s on first load. Thank you for waiting!
                </p>
              </div>
            </div>
          ),
          {
            id: `cold-start-${requestId}`,
            duration: 25000,
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              padding: "12px 16px",
            },
          }
        );
      }, 3000);

      activeTimersRef.current.set(requestId, timer);
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => {
        const requestId = (response.config as any)?.__requestId;
        if (requestId && activeTimersRef.current.has(requestId)) {
          clearTimeout(activeTimersRef.current.get(requestId));
          activeTimersRef.current.delete(requestId);
          toast.dismiss(`cold-start-${requestId}`);
        }
        return response;
      },
      (error) => {
        const requestId = (error.config as any)?.__requestId;
        if (requestId && activeTimersRef.current.has(requestId)) {
          clearTimeout(activeTimersRef.current.get(requestId));
          activeTimersRef.current.delete(requestId);
          toast.dismiss(`cold-start-${requestId}`);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
      activeTimersRef.current.forEach((t) => clearTimeout(t));
      activeTimersRef.current.clear();
    };
  }, []);

  return null;
}
