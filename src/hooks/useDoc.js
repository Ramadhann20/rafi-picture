"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/context/DbContext";

export function useDoc(col, id, { enabled = true } = {}) {
  const { listenDoc } = useDb();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !col || !id) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = listenDoc(
      col,
      id,
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error("useDoc error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [col, id, enabled, listenDoc]);

  return { data, loading, error };
}
