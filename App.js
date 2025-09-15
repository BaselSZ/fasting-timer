// App.js
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import * as Notifications from "expo-notifications";
import useFastingTimer from "./hooks/useFastingTimer";
import PresetPicker from "./components/PresetPicker";
import TimerCard from "./components/TimerCard";
import DailyFastingChart from "./components/DailyFastingChart";
import dayjs from "dayjs";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const {
    isFasting,
    startTime,
    endTime,
    durationHours,
    history,
    stats,
    startFast,
    endFast,
    extendFast,
    resetAll,
    clearHistory,
    getDailyTotals,
  } = useFastingTimer();

  const [tick, setTick] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Notifications disabled",
            "You can enable notifications in Settings to get an alert when your fast ends."
          );
        }
      }
    })();
  }, []);

  const now = dayjs();
  const remainingMs =
    isFasting && endTime ? Math.max(0, dayjs(endTime).diff(now)) : 0;
  const elapsedMs =
    isFasting && startTime ? Math.max(0, now.diff(dayjs(startTime))) : 0;

  const fmt = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSec % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const EndInfo = useMemo(() => {
    if (!isFasting || !endTime) return null;
    return (
      <Text style={styles.meta}>
        Ends at {dayjs(endTime).format("ddd, MMM D • h:mm A")}
      </Text>
    );
  }, [isFasting, endTime, tick]);

  // graph data (last 14 days)
  const { labels, data } = getDailyTotals(14);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>FastTrack ⏳</Text>
        <Text style={styles.subtitle}>
          Intermittent fasting timer • with history
        </Text>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setShowHistory(false)}
            style={[styles.tab, !showHistory && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, !showHistory && styles.tabTextActive]}
            >
              Timer
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowHistory(true)}
            style={[styles.tab, showHistory && styles.tabActive]}
          >
            <Text style={[styles.tabText, showHistory && styles.tabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>

        {!showHistory ? (
          isFasting ? (
            <View style={{ width: "100%" }}>
              <TimerCard
                label="Remaining"
                value={fmt(remainingMs)}
                sublabel={EndInfo}
              />
              <TimerCard label="Elapsed" value={fmt(elapsedMs)} light />
              <View style={styles.row}>
                <PrimaryButton
                  title="+30 min"
                  onPress={() => extendFast(0.5)}
                />
                <PrimaryButton title="+1 hour" onPress={() => extendFast(1)} />
                <DangerButton title="End Fast" onPress={endFast} />
              </View>
            </View>
          ) : (
            <View style={{ width: "100%" }}>
              <PresetPicker onStart={(hrs) => startFast(hrs)} />
              <View style={{ height: 16 }} />
              <SecondaryButton
                title="Start custom…"
                onPress={() => startFast(durationHours || 16)}
              />
            </View>
          )
        ) : (
          <View style={{ width: "100%", flex: 1 }}>
            <View style={styles.statsRow}>
              <Stat label="Total" value={`${stats.totalFasts}`} />
              <Stat label="Longest" value={`${stats.longest}h`} />
              <Stat label="Average" value={`${stats.avg}h`} />
            </View>

            <DailyFastingChart labels={labels} data={data} />

            <FlatList
              data={history}
              keyExtractor={(item, idx) => (item.start || "") + idx}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <Text style={styles.empty}>No past fasts yet.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.histItem}>
                  <Text style={styles.histTitle}>
                    {dayjs(item.start).format("MMM D")} • {item.actualHours}h
                  </Text>
                  <Text style={styles.histSub}>
                    {dayjs(item.start).format("h:mm A")} →{" "}
                    {dayjs(item.end).format("h:mm A")} (planned{" "}
                    {item.plannedHours}h)
                  </Text>
                </View>
              )}
            />
            {history.length > 0 && (
              <Pressable onLongPress={clearHistory} style={styles.clearBtn}>
                <Text style={styles.clearText}>
                  Long-press to clear history
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Pressable onLongPress={resetAll} style={styles.resetArea}>
            <Text style={styles.hint}>Long-press to reset all</Text>
          </Pressable>
          <Text style={styles.disclaimer}>
            Timers don’t run while the app is fully killed, but your end time
            and notifications are preserved.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const Stat = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PrimaryButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btn,
      styles.btnPrimary,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.btnText}>{title}</Text>
  </Pressable>
);

const SecondaryButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btn,
      styles.btnSecondary,
      pressed && styles.pressed,
    ]}
  >
    <Text style={[styles.btnText, { color: "#111" }]}>{title}</Text>
  </Pressable>
);

const DangerButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btn,
      styles.btnDanger,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.btnText}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  container: { flex: 1, alignItems: "center", padding: 20, gap: 12 },
  title: { fontSize: 28, color: "white", fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 14, color: "#B5C0D0", marginBottom: 12 },

  tabs: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  tabActive: { backgroundColor: "#2563EB" },
  tabText: { color: "#9CA3AF", fontWeight: "700" },
  tabTextActive: { color: "white" },

  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },

  statsRow: { flexDirection: "row", gap: 10, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statValue: { color: "white", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },

  histItem: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  histTitle: { color: "white", fontWeight: "700" },
  histSub: { color: "#9CA3AF", marginTop: 4 },

  clearBtn: { alignSelf: "center", marginTop: 8, padding: 8 },
  clearText: { color: "#93C5FD" },

  footer: { marginTop: "auto", alignItems: "center", gap: 6 },
  resetArea: { padding: 8 },
  hint: { color: "#94A3B8", fontSize: 12 },
  disclaimer: { color: "#718096", fontSize: 11, textAlign: "center" },

  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnPrimary: { backgroundColor: "#2563EB" },
  btnSecondary: { backgroundColor: "#E5E7EB" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnText: { color: "white", fontWeight: "700" },
  pressed: { opacity: 0.85 },

  meta: { color: "#93C5FD", marginTop: 6, textAlign: "center" },
});
