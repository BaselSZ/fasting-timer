// hooks/useFastingTimer.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

const STORAGE_KEY = "fasttrack@state_v2";

export default function useFastingTimer() {
  const [isFasting, setIsFasting] = useState(false);
  const [startTime, setStartTime] = useState(null); // ISO
  const [endTime, setEndTime] = useState(null); // ISO
  const [durationHours, setDurationHours] = useState(16);
  const [history, setHistory] = useState([]); // [{ start, end, plannedHours, actualHours, completedAt }]
  const notifIdRef = useRef(null);

  // Load saved state
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
          setHistory(Array.isArray(v.history) ? v.history : []);
          notifIdRef.current = v.notifId || null;
        }
      } catch {}
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    const data = {
      isFasting,
      startTime,
      endTime,
      durationHours,
      history,
      notifId: notifIdRef.current,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [isFasting, startTime, endTime, durationHours, history]);

  const scheduleEndNotification = useCallback(async (endIso) => {
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notifIdRef.current
        );
      } catch {}
      notifIdRef.current = null;
    }
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Fast complete 🎉",
          body: "Time to re-fuel mindfully.",
        },
        trigger: dayjs(endIso).toDate(),
      });
      notifIdRef.current = id;
    } catch {}
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

  const makeEntry = useCallback((startIso, endIso, plannedHrs) => {
    const start = dayjs(startIso);
    const end = dayjs(endIso);
    const actualHours = Math.max(0, end.diff(start, "minute")) / 60;
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      plannedHours: plannedHrs,
      actualHours: Number(actualHours.toFixed(2)),
      completedAt: dayjs().toISOString(),
    };
  }, []);

  const endFast = useCallback(async () => {
    if (isFasting && startTime) {
      const entry = makeEntry(startTime, dayjs().toISOString(), durationHours);
      setHistory((h) => [entry, ...h]); // newest first
    }
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
  }, [isFasting, startTime, durationHours, makeEntry]);

  const resetAll = useCallback(async () => {
    setIsFasting(false);
    setStartTime(null);
    setEndTime(null);
    setDurationHours(16);
    setHistory([]);
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notifIdRef.current
        );
      } catch {}
      notifIdRef.current = null;
    }
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  // ---- Stats
  const stats = useMemo(() => {
    if (!history.length) return { totalFasts: 0, longest: 0, avg: 0 };
    const hours = history.map((e) => e.actualHours || 0);
    const totalFasts = history.length;
    const longest = Math.max(...hours);
    const avg = hours.reduce((a, b) => a + b, 0) / totalFasts;
    return { totalFasts, longest: +longest.toFixed(2), avg: +avg.toFixed(2) };
  }, [history]);

  // ---- Daily totals (last N days), splitting across day boundaries
  const getDailyTotals = useCallback(
    (days = 14) => {
      // initialize map for last N days
      const endOfToday = dayjs().endOf("day");
      const startWindow = endOfToday.subtract(days - 1, "day").startOf("day");
      const indexByDate = new Map();
      const labels = [];
      for (let i = 0; i < days; i++) {
        const d = startWindow.add(i, "day");
        const key = d.format("YYYY-MM-DD");
        indexByDate.set(key, i);
        labels.push(d.format("MM/DD"));
      }
      const totals = new Array(days).fill(0);

      const clampToWindow = (iso) => {
        const t = dayjs(iso);
        if (t.isBefore(startWindow)) return startWindow;
        if (t.isAfter(endOfToday)) return endOfToday;
        return t;
      };

      const addSpan = (a, b) => {
        // Split span across days and accumulate hours
        let curStart = clampToWindow(a);
        let curEnd = clampToWindow(b);
        if (!curEnd.isAfter(curStart)) return;

        while (curStart.isBefore(curEnd)) {
          const dayEnd = curStart.endOf("day");
          const segmentEnd = dayEnd.isBefore(curEnd) ? dayEnd : curEnd;
          const key = curStart.format("YYYY-MM-DD");
          const idx = indexByDate.get(key);
          const hours = Math.max(0, segmentEnd.diff(curStart, "minute")) / 60;
          if (idx !== undefined) totals[idx] += hours;
          curStart = segmentEnd.add(1, "millisecond");
        }
      };

      // Completed fasts
      for (const e of history) {
        addSpan(e.start, e.end);
      }
      // Active fast (if any) contributes up to now
      if (isFasting && startTime) {
        addSpan(startTime, dayjs().toISOString());
      }

      // round nicely
      const rounded = totals.map((v) => +v.toFixed(2));
      return { labels, data: rounded };
    },
    [history, isFasting, startTime]
  );

  return {
    // state
    isFasting,
    startTime,
    endTime,
    durationHours,
    history,
    // actions
    startFast,
    endFast,
    extendFast,
    resetAll,
    clearHistory,
    // stats + graph
    stats,
    getDailyTotals,
  };
}
