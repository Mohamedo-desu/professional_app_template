import CustomButton from "@/components/common/CustomButton";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { useAuth } from "@clerk/clerk-expo";

import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const SettingsScreen = () => {
  const { signOut } = useAuth();
  return (
    <View style={styles.screen}>
      <ScreenAppBar title="Manage Your Shop" />
      <View style={styles.body}>
        <CustomButton text="Sign Out" onPress={() => signOut()} />
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
    padding: theme.paddingHorizontal,
    gap: theme.gap(5),
  },
}));
