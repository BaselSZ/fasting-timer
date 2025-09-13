import { useCallback, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

const STORAGE_KEY = "fasttrack@state_v1";

export default function useFastingTimer() {
  const [isFasting, setIsFasting] = useState(false);
  const [startTime, setStartTime] = useState(null); // ISO strings
  const [endTime, setEndTime] = useState(null);
  const [durationHours, setDurationHours] = useState(16);
  const notifIdRef = useRef(null);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const v = JSON.parse(raw);
          setIsFasting(!!v.isFasting);
          setStartTime(v.startTime || null);
          setEndTime(v.endTime || null);
          setDurationHours(v.durationHours || 16);
          notifIdRef.current = v.notifId || null;
        }
      } catch (e) {}
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    const data = {
      isFasting,
      startTime,
      endTime,
      durationHours,
      notifId: notifIdRef.current,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [isFasting, startTime, endTime, durationHours]);

  const scheduleEndNotification = useCallback(async (endIso) => {
    // Cancel previous
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notifIdRef.current
        );
      } catch {}
      notifIdRef.current = null;
    }
    // Schedule a new one
    const trigger = dayjs(endIso).toDate();
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Fast complete 🎉",
          body: "Time to re‑fuel mindfully.",
        },
        trigger,
      });
      notifIdRef.current = id;
    } catch (e) {
      // noop if scheduling fails (permissions, etc.)
    }
  }, []);

  const startFast = useCallback(
    async (hours = 16) => {
      const start = dayjs();
      const end = start.add(hours, "hour");
      setIsFasting(true);
      setStartTime(start.toISOString());
      setEndTime(end.toISOString());
      setDurationHours(hours);
      await scheduleEndNotification(end.toISOString());
    },
    [scheduleEndNotification]
  );

  const extendFast = useCallback(
    async (hours = 1) => {
      if (!endTime) return;
      const newEnd = dayjs(endTime).add(hours, "hour");
      setEndTime(newEnd.toISOString());
      await scheduleEndNotification(newEnd.toISOString());
    },
    [endTime, scheduleEndNotification]
  );

  const endFast = useCallback(async () => {
    setIsFasting(false);
    setEndTime(null);
    setStartTime(null);
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notifIdRef.current
        );
      } catch {}
      notifIdRef.current = null;
    }
  }, []);

  const resetAll = useCallback(async () => {
    setIsFasting(false);
    setStartTime(null);
    setEndTime(null);
    setDurationHours(16);
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notifIdRef.current
        );
      } catch {}
      notifIdRef.current = null;
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isFasting,
    startTime,
    endTime,
    durationHours,
    startFast,
    endFast,
    extendFast,
    resetAll,
  };
}
