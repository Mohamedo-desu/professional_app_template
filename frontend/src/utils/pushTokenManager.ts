import { PushTokenService } from "@/services/pushTokenService";
import { getFromLocalStorage } from "@/store/storage";
import { useUserStore } from "@/store/useUserStore";
import { getDeviceId } from "@/utils/deviceId";

/**
 * Utility functions for push token management
 */
export class PushTokenManager {
  /**
   * Check if push notifications are properly set up
   */
  static async isPushNotificationSetup(): Promise<boolean> {
    try {
      return await this.isPushTokenRegistered();
    } catch (error) {
      console.error("Error checking push notification setup:", error);
      return false;
    }
  }

  /**
   * Checks if a push token is already registered locally
   * @returns Promise with boolean indicating if token exists
   */
  static async isPushTokenRegistered(): Promise<boolean> {
    try {
      const { pushTokenString, pushTokenRegistered, pushTokenUserId } =
        getFromLocalStorage([
          "pushTokenString",
          "pushTokenRegistered",
          "pushTokenUserId",
        ]);

      const currentUser = useUserStore.getState().currentUser;

      // If logged-in user differs from stored userId, re-register; else avoid re-registering
      if (currentUser && currentUser._id && pushTokenString) {
        if (pushTokenUserId && pushTokenUserId === currentUser._id) {
          return pushTokenRegistered === "true";
        }

        await PushTokenService.registerPushToken(pushTokenString);
      }

      // Return true if we have both a token and registration confirmation
      return !!(pushTokenString && pushTokenRegistered === "true");
    } catch (error) {
      console.error("Error checking token registration status:", error);
      return false;
    }
  }

  /**
   * Get the current device ID and ensure device info is cached
   */
  static async getCurrentDeviceId(): Promise<string | null> {
    try {
      // Ensure device info is cached when getting device ID
      return await getDeviceId();
    } catch (error) {
      console.error("Error getting device ID:", error);
      return null;
    }
  }

  /**
   * Initialize device tracking (cache both device ID and info)
   */
  static async initializeDeviceTracking(): Promise<{
    deviceId: string;
    deviceInfo: any;
  }> {
    try {
      const deviceInfo = getDeviceInfo(); // Cache device info
      const deviceId = await getDeviceId(); // Cache device ID

      return { deviceId, deviceInfo };
    } catch (error) {
      console.error("Error initializing device tracking:", error);
      throw error;
    }
  }
}
