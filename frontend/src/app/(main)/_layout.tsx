import useSetupForPushNotifications from "@/hooks/useSetupForPushNotifications";
import { Stack } from "expo-router";
import React from "react";

const MainLayout = () => {
  useSetupForPushNotifications();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

export default MainLayout;
