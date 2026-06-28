"use client";

import { useEffect, useMemo, useState } from "react";
import { useDb } from "@/context/DbContext";

export function useUsersByIds(userIds = [], enabled = true) {
  const { getDoc } = useDb();

  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uniqueIds = useMemo(() => {
    return Array.from(new Set((userIds || []).filter(Boolean)));
  }, [userIds]);

  useEffect(() => {
    if (!enabled || uniqueIds.length === 0) {
      setUsersById({});
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          uniqueIds.map(async (uid) => {
            // ⬇️ INI YANG BENAR SESUAI DbContext
            const snap = await getDoc("Users", uid);
            return { uid, exists: snap.exists(), data: snap.data() };
          })
        );

        if (cancelled) return;

        const map = {};
        for (const r of results) {
          map[r.uid] = r.exists ? { id: r.uid, ...r.data } : null;
        }

        setUsersById(map);
      } catch (e) {
        console.error("useUsersByIds error:", e);
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, uniqueIds, getDoc]);

  return { usersById, loading, error };
}
