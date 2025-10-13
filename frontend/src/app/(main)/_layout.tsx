import { Stack } from "expo-router";
import React from "react";

const MainLayout = () => {
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
