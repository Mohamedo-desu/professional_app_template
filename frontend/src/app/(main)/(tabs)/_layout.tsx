import CustomTabBar from "@/components/tabs/CustomTabBar";
import { Fonts } from "@/constants/Fonts";
import { api } from "@/convex/_generated/api";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { Tabs } from "expo-router";
import React, { createContext } from "react";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { useSharedValue } from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";
import { BADGE_COLOR } from "unistyles";

// Define NavItem type for auto-suggestions
interface NavItem {
  name: string;
  solid: any;
  outline: any;
  badge?: number;
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
      solid: IconsSolid.BuildingStorefrontIcon,
      outline: IconsOutline.BuildingStorefrontIcon,
    },
    {
      name: "settings",
      solid: IconsSolid.Cog6ToothIcon,
      outline: IconsOutline.Cog6ToothIcon,
      badge: 10,
    },
  ];
  const commonScreenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: "transparent",
      elevation: 0,
      paddingTop: 5,
    },
    tabBarBadgeStyle: {
      backgroundColor: BADGE_COLOR,
      fontFamily: Fonts.SemiBold,
      fontSize: 10,
    },
    tabBarActiveTintColor: theme.colors.onPrimary,
    tabBarInactiveTintColor: theme.colors.grey400,
  };
  return (
    <TabScrollYContext.Provider value={scrollY}>
      <Tabs
        screenOptions={commonScreenOptions}
        tabBar={(props) => <CustomTabBar {...props} scrollY={scrollY} />}
      >
        {NAV_ITEMS.map(
          ({ name, solid: SolidIcon, outline: OutlineIcon, badge }) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
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
