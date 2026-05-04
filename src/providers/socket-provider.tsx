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

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
            transports: ["polling", "websocket"],
            reconnection: true,
            auth: { token: token }
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);

            // Join user room if logged in (Though backend handle it, redundancy is safe)
            if (profile?._id) {
                socketInstance.emit("join", `user:${profile._id}`);
            }
        });

        socketInstance.on("connect_error", (err) => {
        });

        socketInstance.on("error", (error) => {
        });

        socketInstance.on("disconnect", () => {
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
