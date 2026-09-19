"use client";

import { useEffect, useRef } from "react";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import toast from "react-hot-toast";

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  __requestId?: string;
}

export default function ServerWarmup() {
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // 1. Silent early wake-up ping to backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    try {
      fetch(`${apiUrl}/ping`, { mode: "no-cors" }).catch(() => {});
    } catch {}

    const timers = activeTimersRef.current;

    // 2. Global Axios request interceptor for delayed responses
    const reqInterceptor = axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const customConfig = config as CustomAxiosConfig;
      const requestId = `${customConfig.method || "get"}_${customConfig.url}_${Date.now()}`;
      customConfig.__requestId = requestId;

      // If request takes longer than 3 seconds, show friendly free tier cold-start notice
      const timer = setTimeout(() => {
        toast(
          () => (
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

      timers.set(requestId, timer);
      return customConfig;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const customConfig = response.config as CustomAxiosConfig;
        const requestId = customConfig?.__requestId;
        if (requestId && timers.has(requestId)) {
          clearTimeout(timers.get(requestId));
          timers.delete(requestId);
          toast.dismiss(`cold-start-${requestId}`);
        }
        return response;
      },
      (error: AxiosError) => {
        const customConfig = error.config as CustomAxiosConfig | undefined;
        const requestId = customConfig?.__requestId;
        if (requestId && timers.has(requestId)) {
          clearTimeout(timers.get(requestId));
          timers.delete(requestId);
          toast.dismiss(`cold-start-${requestId}`);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return null;
}
