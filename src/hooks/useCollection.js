"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/context/DbContext";

export function useCollection(buildQuery, deps = [], { enabled = true } = {}) {
  const { listenQuery } = useDb();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setRows([]);
      return;
    }

    const q = buildQuery?.();
    if (!q) {
      setLoading(false);
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = listenQuery(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useCollection error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, listenQuery, ...deps]);

  return { rows, loading, error };
}
