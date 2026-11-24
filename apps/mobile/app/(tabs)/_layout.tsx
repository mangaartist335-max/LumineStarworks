import { Ionicons } from "@expo/vector-icons";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { PressableScale } from "@/components/PressableScale";
import { feedback } from "@/lib/feedback";
import { useTheme } from "@/theme";

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: "Home", icon: "home-outline", activeIcon: "home" },
  projects: { label: "Projects", icon: "folder-outline", activeIcon: "folder" },
  create: { label: "Create", icon: "add", activeIcon: "add" },
  templates: { label: "Templates", icon: "grid-outline", activeIcon: "grid" },
  settings: { label: "Settings", icon: "settings-outline", activeIcon: "settings" },
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const onPress = () => {
          if (focused) return;
          if (route.name === "create") feedback.start();
          else feedback.select();
          navigateToTab(route.key);
        };

        if (route.name === "create") {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: "center" }}>
              <PressableScale
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Create a new project"
                accessibilityState={{ selected: focused }}
                pressedScale={0.9}
                style={{ marginTop: -26 }}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentAlt]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: colors.background,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.45,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                  }}
                >
                  <Ionicons name="add" size={30} color="#fff" />
                </LinearGradient>
              </PressableScale>
              <AppText variant="caption" style={{ fontSize: 11, fontWeight: "700", color: focused ? colors.accent : colors.muted, marginTop: 2 }}>
                Create
              </AppText>
            </View>
          );
        }

        return (
          <PressableScale
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
            style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}
          >
            <Ionicons name={focused ? meta.activeIcon : meta.icon} size={23} color={focused ? colors.accent : colors.muted} />
            <AppText variant="caption" style={{ fontSize: 11, fontWeight: focused ? "700" : "500", color: focused ? colors.accent : colors.muted }}>
              {meta.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="templates" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
