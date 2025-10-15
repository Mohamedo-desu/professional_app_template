import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useEffect } from "react";

interface UseLoginPromptReturn {
  isAuthenticated: boolean;
  isLoading: string | boolean | null;
}

export const useLoginPrompt = (): UseLoginPromptReturn => {
  const { userId, isLoaded } = useAuth();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId } : "skip"
  );

  useEffect(() => {
    if (currentUser) {
      setCurrentUser(currentUser);
    }
  }, [currentUser]);

  const isAuthenticated = !!userId && !!currentUser;
  const isLoading = !isLoaded || (userId && currentUser === undefined);

  return { isAuthenticated, isLoading };
};
