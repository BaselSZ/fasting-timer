// File: App.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import dayjs from "dayjs";

import useFastingTimer from "./hooks/useFastingTimer";
import TimerCard from "./components/TimerCard";
import ModePicker from "./components/ModePicker";
import StartTimePicker from "./components/StartTimePicker";

// Notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** ⏱ Keep the once-per-second ticker isolated here so the picker screen doesn't re-render every second */
function TimerSection({ startTime, endTime, onEndFast }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = dayjs();
  const remainingMs = endTime ? Math.max(0, dayjs(endTime).diff(now)) : 0;
  const elapsedMs = startTime ? Math.max(0, now.diff(dayjs(startTime))) : 0;

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
    if (!endTime) return null;
    return (
      <Text style={styles.meta}>
        Ends at {dayjs(endTime).format("ddd, MMM D • h:mm A")}
      </Text>
    );
  }, [endTime, tick]);

  const handleEndFastConfirm = () => {
    Alert.alert(
      "End fast?",
      "Are you sure you want to end your current fast?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Fast", style: "destructive", onPress: () => onEndFast() },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ width: "100%" }}>
      <TimerCard
        label="Remaining"
        value={fmt(remainingMs)}
        sublabel={EndInfo}
      />
      <TimerCard label="Elapsed" value={fmt(elapsedMs)} light />

      {/* Only End Fast (with confirmation) */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <DangerButton title="End Fast" onPress={handleEndFastConfirm} />
      </View>
    </View>
  );
}

export default function App() {
  const {
    isFasting,
    startTime,
    endTime,
    durationHours,
    startFast,
    endFast,
    resetAll,

    // If you added history in your hook these will exist; otherwise we show a placeholder.
    history,
    stats,
    clearHistory,
  } = useFastingTimer();

  const [showHistory, setShowHistory] = useState(false);
  const [modeHours, setModeHours] = useState(durationHours || 16);
  const [startAt, setStartAt] = useState(() => new Date()); // stable, no re-init each render

  // Ask for notification permissions once
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Notifications disabled",
            "Enable notifications in Settings to get an alert when your fast ends."
          );
        }
      }
    })();
  }, []);

  // Optional: light validation before starting from chosen time
  const handleStartFromChosen = useCallback(() => {
    // If you prefer zero validation, replace this with: startFast(modeHours, startAt.toISOString());
    const start = dayjs(startAt);
    const end = start.add(modeHours, "hour");
    const now = dayjs();

    if (start.isAfter(now)) {
      Alert.alert("Invalid start time", "Start time cannot be in the future.");
      return;
    }
    if (!end.isAfter(now)) {
      Alert.alert(
        "This fast already ended",
        "That start + duration has already passed."
      );
      return;
    }
    startFast(modeHours, start.toISOString());
  }, [modeHours, startAt, startFast]);

  // Safe accessors if history/stats aren't implemented yet
  const hasHistoryFeature =
    Array.isArray(history) && stats && typeof stats === "object";
  const listData = hasHistoryFeature ? history : [];
  const safeStats = hasHistoryFeature
    ? stats
    : { totalFasts: 0, longest: 0, avg: 0 };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>FastTrack ⏳</Text>
        <Text style={styles.subtitle}>
          Pick a mode and start time, then track your fast
        </Text>

        {/* Tabs always visible */}
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

        {/* Page content */}
        {showHistory ? (
          <View style={{ width: "100%", flex: 1 }}>
            <View style={styles.statsRow}>
              <Stat label="Total" value={`${safeStats.totalFasts}`} />
              <Stat label="Longest" value={`${safeStats.longest}h`} />
              <Stat label="Average" value={`${safeStats.avg}h`} />
            </View>

            {hasHistoryFeature ? (
              <FlatList
                data={listData}
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
                      {dayjs(item.end).format("h:mm A")}
                      {item.plannedHours
                        ? `  (planned ${item.plannedHours}h)`
                        : null}
                    </Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.placeholder}>
                History isn’t enabled yet in your hook.
              </Text>
            )}

            {hasHistoryFeature && listData.length > 0 && clearHistory && (
              <Pressable onLongPress={clearHistory} style={styles.clearBtn}>
                <Text style={styles.clearText}>
                  Long-press to clear history
                </Text>
              </Pressable>
            )}
          </View>
        ) : isFasting ? (
          <TimerSection
            startTime={startTime}
            endTime={endTime}
            onEndFast={endFast}
          />
        ) : (
          <View style={{ width: "100%", gap: 14 }}>
            <ModePicker value={modeHours} onChange={setModeHours} />
            <StartTimePicker value={startAt} onChange={setStartAt} />

            <PrimaryButton
              title={`Start ${modeHours}h fast (from chosen time)`}
              onPress={handleStartFromChosen}
            />

            {/* You asked to remove the white "Start now" button; leaving a commented copy for later.
            <SecondaryButton
              title="Start now (use chosen mode)"
              onPress={() => startFast(modeHours)}
            />
            */}
          </View>
        )}

        {/* Footer */}
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

/* ---------- Small components ---------- */

const Stat = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PrimaryButton = ({ title, onPress, fullWidth = true }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btnBase,
      fullWidth ? styles.btnFull : styles.btnAuto,
      styles.btnPrimary,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.btnTextLight}>{title}</Text>
  </Pressable>
);

const SecondaryButton = ({ title, onPress, fullWidth = true }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btnBase,
      fullWidth ? styles.btnFull : styles.btnAuto,
      styles.btnSecondary,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.btnTextDark}>{title}</Text>
  </Pressable>
);

const DangerButton = ({ title, onPress, fullWidth = true }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btnBase,
      fullWidth ? styles.btnFull : styles.btnAuto,
      styles.btnDanger,
      pressed && styles.pressed,
    ]}
  >
    <Text style={styles.btnTextLight}>{title}</Text>
  </Pressable>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  container: { flex: 1, alignItems: "center", padding: 20, gap: 12 },
  title: { fontSize: 28, color: "white", fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 14, color: "#B5C0D0", marginBottom: 12 },

  // Tabs
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
    alignSelf: "stretch",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  tabActive: { backgroundColor: "#2563EB" },
  tabText: { color: "#9CA3AF", fontWeight: "700" },
  tabTextActive: { color: "white" },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statValue: { color: "white", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "white", fontSize: 12, marginTop: 2 }, // <- white per your request

  // History list
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
  placeholder: { color: "#9CA3AF", marginTop: 8 },

  // Footer
  footer: { marginTop: "auto", alignItems: "center", gap: 6 },
  resetArea: { padding: 8 },
  hint: { color: "#94A3B8", fontSize: 12 },
  disclaimer: { color: "#718096", fontSize: 11, textAlign: "center" },

  // Buttons
  btnBase: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFull: { width: "100%", alignSelf: "stretch" },
  btnAuto: { flex: 1 },
  btnPrimary: { backgroundColor: "#2563EB" },
  btnSecondary: { backgroundColor: "#E5E7EB" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnTextLight: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  btnTextDark: { color: "#111111", fontWeight: "700", fontSize: 16 },
  pressed: { opacity: 0.9 },

  // Meta
  meta: { color: "#93C5FD", marginTop: 6, textAlign: "center" },
});
