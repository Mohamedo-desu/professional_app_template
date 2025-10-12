import CustomText from "@/components/common/CustomText";
import CustomTabBar from "@/components/tabs/CustomTabBar";
import { APP_NAME, TAGLINE } from "@/constants/device";
import { Fonts } from "@/constants/Fonts";
import { api } from "@/convex/_generated/api";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { router, Tabs } from "expo-router";
import React, { createContext } from "react";
import { TouchableOpacity, View } from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { useSharedValue } from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";

// Define NavItem type for auto-suggestions
interface NavItem {
  name: string;
  label: string;
  headerTitle: string;
  solid: any;
  outline: any;
  badge?: number;
  headerShown: boolean;
}

// Context to provide scrollY to all tab screens
export const TabScrollYContext = createContext<any>(null);

const TabsLayout = () => {
  const { theme } = useUnistyles();
  const scrollY = useSharedValue(0);

  // Get notification count for badge
  const notificationCount = useQuery(
    api.notifications.getUserNotificationsUnreadCount
  );

  const NAV_ITEMS: NavItem[] = [
    {
      name: "index",
      label: "Home",
      solid: IconsSolid.HomeIcon,
      outline: IconsOutline.HomeIcon,
      headerShown: true,
      headerTitle: APP_NAME,
    },
    {
      name: "settings",
      label: "Settings",
      solid: IconsSolid.Cog6ToothIcon,
      outline: IconsOutline.Cog6ToothIcon,
      headerShown: true,
      headerTitle: APP_NAME,
    },
  ];

  const commonScreenOptions: BottomTabNavigationOptions = {
    headerShown: true,
    tabBarStyle: {
      backgroundColor: theme.colors.primary,
      elevation: 3,
    },
    headerStyle: {
      backgroundColor: PRIMARY_COLOR,
    },
    headerTintColor: theme.colors.onBackground,
    tabBarBadgeStyle: {
      backgroundColor: BADGE_COLOR,
      fontFamily: Fonts.Regular,
      fontSize: 12,
    },
    headerTitleAlign: "center",
    tabBarActiveTintColor: theme.colors.onPrimary,
    tabBarInactiveTintColor: theme.colors.grey700,
  };

  return (
    <TabScrollYContext.Provider value={scrollY}>
      <Tabs
        screenOptions={commonScreenOptions}
        tabBar={(props) => <CustomTabBar {...props} scrollY={scrollY} />}
      >
        {NAV_ITEMS.map(
          ({
            name,
            label,
            headerShown,
            headerTitle,
            solid: SolidIcon,
            outline: OutlineIcon,
            badge,
          }) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                tabBarLabel: label,
                headerShown: headerShown,
                headerTitle: headerTitle,
                ...(name === "index" && {
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerRightContainer}
                      activeOpacity={0.8}
                      onPress={() => {
                        router.navigate("/(main)/add");
                      }}
                    >
                      <IconsSolid.PlusCircleIcon color={"white"} size={25} />
                    </TouchableOpacity>
                  ),
                  headerTitle: (props) => {
                    const { tintColor, allowFontScaling, style } = props;
                    return (
                      <View>
                        <CustomText
                          variant="label"
                          bold
                          textAlign="center"
                          color="onPrimary"
                          allowFontScaling={allowFontScaling}
                        >
                          {APP_NAME}
                        </CustomText>

                        <CustomText
                          variant="small"
                          italic
                          textAlign="center"
                          color="onPrimary"
                          allowFontScaling={allowFontScaling}
                        >
                          {TAGLINE}
                        </CustomText>
                      </View>
                    );
                  },
                }),
                ...(name === "search" && {
                  headerLeft: () => (
                    <TouchableOpacity
                      style={styles.headerLeftContainer}
                      activeOpacity={0.8}
                      onPress={() => router.back()}
                    >
                      <IconsSolid.ArrowLeftIcon color={"white"} size={22} />
                    </TouchableOpacity>
                  ),
                }),
                tabBarIcon: ({ focused, size, color }) =>
                  focused ? (
                    <SolidIcon size={size} color={color} />
                  ) : (
                    <OutlineIcon size={size} color={color} />
                  ),
                ...(badge !== undefined && { tabBarBadge: badge }),
              }}
            />
          )
        )}
      </Tabs>
    </TabScrollYContext.Provider>
  );
};

export default TabsLayout;

const styles = StyleSheet.create((theme) => ({
  headerLeftContainer: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightContainer: { marginRight: 12 },
}));
