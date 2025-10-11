import { APP_NAME } from "@/constants/device";
import { NOTIFICATION_CHANNEL_ID } from "@/constants/notifications";
import { PushTokenService } from "@/services/pushTokenService";
import { useUserStore } from "@/store/useUserStore";
import { PushTokenManager } from "@/utils/pushTokenManager";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { PRIMARY_COLOR } from "unistyles";

function handleRegistrationError(errorMessage: string) {
  console.error("Push notification registration error:", errorMessage);
}

const useSetupForPushNotifications = () => {
  const currentUser = useUserStore((state) => state.currentUser);

  async function registerForPushNotificationsAsync() {
    try {
      // Check if we've already registered a push token
      const isAlreadyRegistered =
        await PushTokenManager.isPushTokenRegistered();

      // If already registered and same user, skip
      if (isAlreadyRegistered) return;

      // Set up notification channel for Android
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: APP_NAME,
          description:
            "Notifications for app updates and important announcements",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "update.wav",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: PRIMARY_COLOR,
          enableLights: true,
          enableVibrate: true,
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        handleRegistrationError(
          "Permission not granted to get push token for push notification!"
        );
        return;
      }

      // Get project ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        handleRegistrationError("Project ID not found in Expo config");
        return;
      }

      // Get push token
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      if (!pushTokenString) {
        handleRegistrationError("Failed to get push token from Expo");
        return;
      }

      // Register token with backend
      const result = await PushTokenService.registerPushToken(pushTokenString);

      if (result.success) {
        // Save registration status locally
        await PushTokenService.savePushTokenRegistration(
          pushTokenString,
          result.tokenId,
          result.userId
        );
      } else {
        handleRegistrationError(
          `Failed to register push token: ${result.message}`
        );
      }
    } catch (error: unknown) {
      handleRegistrationError(`Push token registration failed: ${error}`);
    }
  }

  useEffect(() => {
    // Only register when a user is logged in; never auto-unregister here.
    if (currentUser) {
      registerForPushNotificationsAsync();
    }
  }, [currentUser]);
};

export default useSetupForPushNotifications;
