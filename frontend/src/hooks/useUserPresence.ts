import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Simplified hook to manage user online presence using only user fields
 */
export const useUserPresence = () => {
  const { isSignedIn } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const previousAuthState = useRef<boolean>(false);
  const previousAppState = useRef<AppStateStatus>(AppState.currentState);

  // Simplified mutations - only update user fields
  const updateUserStatus = useMutation(api.userPresence.updateUserStatus);

  /**
   * Update user online status
   */
  const updateStatus = useCallback(
    async (status: "online" | "offline") => {
      if (!isSignedIn) {
        return;
      }

      try {
        const result = await updateUserStatus({ status });

        setIsOnline(result?.isOnline || false);
      } catch (error) {
        console.error("❌ Failed to update user status:", error);
      }
    },
    [isSignedIn, updateUserStatus]
  );

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);

      if (!isSignedIn) {
        return;
      }

      // App coming to foreground
      if (previousAppState.current !== "active" && nextAppState === "active") {
        await updateStatus("online");
      }
      // App going to background or inactive
      else if (
        previousAppState.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        await updateStatus("offline");
      }

      previousAppState.current = nextAppState;
    },
    [isSignedIn, updateStatus]
  );

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    const handleAuthChange = async () => {
      const currentlySignedIn = !!isSignedIn;

      // User just logged in
      if (
        !previousAuthState.current &&
        currentlySignedIn &&
        appState === "active"
      ) {
        await updateStatus("online");
      }
      // User just logged out
      else if (previousAuthState.current && !currentlySignedIn) {
        await updateStatus("offline");
        setIsOnline(false);
      }

      previousAuthState.current = currentlySignedIn;
    };

    handleAuthChange();
  }, [isSignedIn, appState, updateStatus]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  /**
   * Initialize status on mount
   */
  useEffect(() => {
    if (isSignedIn && appState === "active") {
      updateStatus("online");
    }
  }, [isSignedIn, appState, updateStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isSignedIn) {
        updateUserStatus({ status: "offline" }).catch(console.error);
      }
    };
  }, [isSignedIn, updateUserStatus]);

  return {
    isOnline: !!(isOnline && isSignedIn),
    appState,
  };
};

/**
 * Hook to get online status of a specific user
 */
export const useUserOnlineStatus = (userId: Id<"users"> | null | undefined) => {
  const onlineStatus = useQuery(
    api.userPresence.getUserOnlineStatus,
    userId ? { userId } : "skip"
  );

  return {
    isOnline: onlineStatus?.isOnline || false,
    lastSeenAt: onlineStatus?.lastSeenAt,
    isLoading: onlineStatus === undefined,
  };
};
