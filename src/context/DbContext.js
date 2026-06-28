"use client";

import React, { createContext, useContext, useMemo } from "react";
import { db } from "@/lib/firebase-config";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,

  writeBatch
} from "firebase/firestore";

const DbContext = createContext(null);

export default function DbProvider({ children }) {
  // Helper tipis: cuma bungkus fungsi Firestore biar konsisten
  const api = useMemo(() => {
    return {
      db,

      // refs
      docRef: (col, id) => doc(db, col, id),
      colRef: (col) => collection(db, col),

      // reads
      getDoc: async (col, id) => getDoc(doc(db, col, id)),
      getDocs: async (q) => getDocs(q),

      // writes 
      setDoc: async (col, id, data, options) => setDoc(doc(db, col, id), data, options),
      addDoc: async (col, data) => addDoc(collection(db, col), data),
      updateDoc: async (col, id, data) => updateDoc(doc(db, col, id), data),
      deleteDoc: async (col, id) => deleteDoc(doc(db, col, id)),

      // realtime listeners
      listenDoc: (col, id, onNext, onErr) => onSnapshot(doc(db, col, id), onNext, onErr),
      listenQuery: (q, onNext, onErr) => onSnapshot(q, onNext, onErr),

      seedCollection: async (collectionName, dataArray) => {
        const batch = writeBatch(db);

        dataArray.forEach((item) => {
          const ref = doc(collection(db, collectionName));
          batch.set(ref, item);
        });

        await batch.commit();
      },

      deleteCollection: async (collectionName) => {
        const snap = await getDocs(collection(db, collectionName));

        const batch = writeBatch(db);

        snap.forEach((d) => {
          batch.delete(doc(db, collectionName, d.id));
        });

        await batch.commit();
      },

      // query builders
      query,
      where,
      orderBy,
      limit,

      // timestamps
      serverTimestamp,
    };
  }, []);

  return <DbContext.Provider value={api}>{children}</DbContext.Provider>;
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb() harus dipakai di dalam <DbProvider>.");
  return ctx;
}
