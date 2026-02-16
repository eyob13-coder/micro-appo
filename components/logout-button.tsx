"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hover:bg-red-50 dark:hover:bg-red-500/10 border border-zinc-200 dark:border-zinc-700/50 hover:border-red-200 dark:hover:border-red-500/30 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 text-sm font-medium transition-all duration-200 disabled:opacity-50"
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            <span className="hidden sm:inline">Sign Out</span>
        </button>
    );
}
