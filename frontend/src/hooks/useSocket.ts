"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

export const useSocket = (namespace = "/") => {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    
    // Connect to the specified namespace (or default)
    const socket = io(`${url}${namespace}`, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log(`Socket connected to ${namespace}`);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected from ${namespace}`);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, namespace]);

  return { socket: socketRef.current, isConnected };
};
