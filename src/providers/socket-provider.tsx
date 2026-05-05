"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/api/use-profile";
import { notificationKeys } from "@/hooks/api/use-notifications";
import { getStoredAuthSession } from "@/lib/auth-session";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const session = getStoredAuthSession();
    const token = session?.accessToken;
    const { data: profile } = useProfile({ enabled: !!token });
    const queryClient = useQueryClient();

    useEffect(() => {
        const session = getStoredAuthSession();
        const token = session?.accessToken;

        if (!token) {
            return;
        }

        let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
        
        // Ensure we are connecting to the ROOT, not /api/v1
        if (socketUrl.includes("/api/v1")) {
            socketUrl = socketUrl.split("/api/v1")[0];
        }
        
        const socketInstance = io(socketUrl, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity, // Keep trying if Render spins down
            reconnectionDelay: 2000,
            auth: { token: token }
        });

        socketInstance.on("connect", () => {
            console.log("🚀 Socket Connected:", socketInstance.id);
            setIsConnected(true);

            if (profile?._id) {
                socketInstance.emit("join", `user:${profile._id}`);
                // Refresh queries on connect to catch missed notifications
                queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            }
        });

        socketInstance.on("connect_error", (err) => {
            console.error("❌ Socket Connection Error:", err.message);
        });

        socketInstance.on("error", (error) => {
            console.error("❌ Socket Error:", error);
        });

        socketInstance.on("disconnect", (reason) => {
            console.warn("⚠️ Socket Disconnected:", reason);
            setIsConnected(false);
        });

        // Listen for new in-app notifications (Bell updates)
        socketInstance.on("new_notification", (data) => {

            // 1. Show Toast
            toast(data.title || "New Notification", {
                description: data.content,
                duration: 4000,
                action: {
                    label: "View",
                    onClick: () => window.location.href = "/notifications"
                }
            });

            // 2. Force Refresh Tanstack Queries
            queryClient.refetchQueries({ queryKey: notificationKeys.all, type: 'active' });
        });

        // Listen for real-time push simulations
        socketInstance.on("push_notification", (data) => {
            toast.info(data.title, {
                description: data.content,
                duration: 5000,
            });
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [profile?._id, queryClient]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
