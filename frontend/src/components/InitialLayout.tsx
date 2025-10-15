import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import CustomText from "./common/CustomText";

const AppLayout = () => {
  const { isAuthenticated, isLoading } = useLoginPrompt();

  // While loading, show nothing (or a loading indicator)
  if (isLoading) {
    return (
      <LinearGradient
        colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.loader}
      >
        <ActivityIndicator size="small" color={"white"} />
        <CustomText variant="label" color="onPrimary">
          Loading your data...
        </CustomText>
      </LinearGradient>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
    </Stack>
  );
};

export default AppLayout;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
});
