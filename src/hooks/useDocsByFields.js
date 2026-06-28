"use client";

import { useEffect, useMemo, useState } from "react";
import { useDb } from "@/context/DbContext";

// util kecil: pecah array jadi per-10
function chunkArray(arr, size = 10) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// util kecil: bikin "key" deps yang stabil tanpa JSON.stringify
function stableKeyFromArray(arr) {
  return (arr || []).filter(Boolean).join("|");
}

export function useServicesByCodes(serviceCodes = [], { enabled = true } = {}) {
  const { colRef, query, where, listenQuery } = useDb();

  const cleanCodes = useMemo(() => {
    // unique + buang yang kosong
    return Array.from(new Set((serviceCodes || []).filter(Boolean)));
  }, [stableKeyFromArray(serviceCodes)]);

  const chunks = useMemo(() => chunkArray(cleanCodes, 10), [stableKeyFromArray(cleanCodes)]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || cleanCodes.length === 0) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const map = new Map();   // key: service.code
    const unsubs = [];

    const applyToState = () => {
      // urutkan sesuai urutan pilihan customer (serviceCodes asli)
      const ordered = (serviceCodes || [])
        .filter(Boolean)
        .map((c) => map.get(c))
        .filter(Boolean);

      setRows(ordered);
      setLoading(false);
    };

    try {
      chunks.forEach((chunk) => {
        const q = query(
          colRef("Services"),
          where("code", "in", chunk)
        );

        const unsub = listenQuery(
          q,
          (snap) => {
            snap.docs.forEach((d) => {
              const data = { id: d.id, ...d.data() };
              // pakai field code sebagai key merge
              if (data?.code) map.set(data.code, data);
            });

            applyToState();
          },
          (err) => {
            console.error("useServicesByCodes error:", err);
            setError(err);
            setLoading(false);
          }
        );

        unsubs.push(unsub);
      });
    } catch (e) {
      setError(e);
      setLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u?.());
    };
  }, [
    enabled,
    listenQuery,
    query,
    where,
    colRef,
    stableKeyFromArray(cleanCodes), // deps stabil
    stableKeyFromArray(serviceCodes) // penting untuk reorder
  ]);

  return { rows, loading, error };
}

export function useVendorsByServiceCodes(serviceCodes = [], { enabled = true } = {}) {
  const { colRef, query, where, listenQuery } = useDb();

  const cleanCodes = useMemo(
    () => Array.from(new Set((serviceCodes || []).filter(Boolean))),
    [stableKeyFromArray(serviceCodes)]
  );

  const chunks = useMemo(
    () => chunkArray(cleanCodes, 10),
    [stableKeyFromArray(cleanCodes)]
  );

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || cleanCodes.length === 0) {
      setVendors([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const map = new Map(); // key: vendor.uid
    const unsubs = [];

    try {
      chunks.forEach((chunk) => {
        const q = query(
          colRef("Vendors"),
          where("supported_services", "array-contains-any", chunk)
        );

        const unsub = listenQuery(
          q,
          (snap) => {
            snap.docs.forEach((d) => {
              const data = { id: d.id, ...d.data() };
              map.set(data.uid ?? d.id, data);
            });

            setVendors(Array.from(map.values()));
            setLoading(false);
          },
          (err) => {
            console.error("useVendorsByServiceCodes error:", err);
            setError(err);
            setLoading(false);
          }
        );

        unsubs.push(unsub);
      });
    } catch (e) {
      setError(e);
      setLoading(false);
    }

    return () => unsubs.forEach((u) => u?.());
  }, [
    enabled,
    listenQuery,
    query,
    where,
    colRef,
    stableKeyFromArray(cleanCodes),
  ]);

  return { vendors, loading, error };
}