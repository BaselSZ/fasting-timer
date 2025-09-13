import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import useFastingTimer from "./hooks/useFastingTimer";
import PresetPicker from "./components/PresetPicker";
import TimerCard from "./components/TimerCard";
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
    startFast,
    endFast,
    extendFast,
    resetAll,
  } = useFastingTimer();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>FastTrack ⏳</Text>
        <Text style={styles.subtitle}>Simple intermittent fasting timer</Text>

        {isFasting ? (
          <View style={{ width: "100%" }}>
            <TimerCard
              label="Remaining"
              value={fmt(remainingMs)}
              sublabel={EndInfo}
            />
            <TimerCard label="Elapsed" value={fmt(elapsedMs)} light />

            <View style={styles.row}>
              <PrimaryButton title="+30 min" onPress={() => extendFast(0.5)} />
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
        )}

        <View style={styles.footer}>
          <Pressable onLongPress={resetAll} style={styles.resetArea}>
            <Text style={styles.hint}>Long‑press to reset</Text>
          </Pressable>
          <Text style={styles.disclaimer}>
            Note: Timers don’t run while the app is fully killed, but your end
            time and notifications are preserved.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
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
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
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
