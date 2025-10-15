import InventoryItem from "@/components/add-screen/InventoryItem";
import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { ELEVATION, TAB_BAR_HEIGHT } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XCircleIcon,
} from "react-native-heroicons/solid";
import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";

const SearchScreen = () => {
  // 🔹 Search & UI state
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // 🧾 Queries
  const inventory = useQuery(api.dailyEntries.fetchInventory);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleClear = () => setQuery("");

  return (
    <View style={styles.screen}>
      <ScreenAppBar title="Search & Add Sale Item" showGoBack={true} />

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MagnifyingGlassIcon size={22} color={PRIMARY_COLOR} />
        <TextInput
          placeholder="Search inventory..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <XCircleIcon size={20} color={BADGE_COLOR} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        data={inventory}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={LinearTransition}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
          />
        }
        renderItem={({ item, index }) => (
          <InventoryItem item={item} index={index} />
        )}
        ListEmptyComponent={() => {
          return (
            <View style={styles.ListEmptyComponent}>
              <CustomText variant="label" color="grey300">
                You currently do not have any inventory Items
              </CustomText>
              <CustomButton
                text="Add Inventory Items"
                onPress={() => router.navigate("/(main)/add")}
              />
            </View>
          );
        }}
      />
      <LinearGradient
        colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fabContainer}
      >
        <TouchableOpacity
          onPress={() => router.navigate("/(main)/add")}
          activeOpacity={0.8}
          style={styles.fab}
        >
          <ShoppingBagIcon size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    margin: theme.gap(2),
    paddingHorizontal: theme.paddingHorizontal,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    height: 50,
    elevation: ELEVATION,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: theme.gap(1),
    color: theme.colors.onBackground,
  },
  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(2),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
    paddingHorizontal: theme.paddingHorizontal,
  },

  ListEmptyComponent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(10),
  },
  fabContainer: {
    position: "absolute",
    right: theme.paddingHorizontal,
    bottom: TAB_BAR_HEIGHT,
    width: theme.gap(12),
    height: theme.gap(12),
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  fab: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}));
