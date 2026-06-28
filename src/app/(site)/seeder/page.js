"use client";

import { useState } from "react";
import { useDb } from "@/context/DbContext";

import {
  USERS,
  PACKAGES,
  BOOKINGS,
  SCHEDULES,
  PAYMENTS,
  CREWS,
  ASSIGNMENTS
} from "@/lib/dummy/dataDummy";

const seedMap = {
  Users: USERS,
  Packages: PACKAGES,
  Bookings: BOOKINGS,
  Schedules: SCHEDULES,
  Payments: PAYMENTS,
  Crews: CREWS,
  Assignments: ASSIGNMENTS
};

export default function SeederPage() {
  const { seedCollection, deleteCollection } = useDb();

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  // =========================
  // SAFE WRAPPER
  // =========================
  const run = async (fn) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEED SINGLE
  // =========================
  const handleSeed = (key) =>
    run(async () => {
      if (!seedMap[key]) return;
      await seedCollection(key, seedMap[key]);
    });

  // =========================
  // SEED ALL
  // =========================
  const handleSeedAll = () =>
    run(async () => {
      for (const key of Object.keys(seedMap)) {
        await seedCollection(key, seedMap[key]);
      }
      alert("All seeded");
    });

  // =========================
  // DELETE SINGLE
  // =========================
  const handleDelete = (key) =>
    run(async () => {
      await deleteCollection(key);
    });

  // =========================
  // DELETE ALL
  // =========================
  const handleDeleteAll = () =>
    run(async () => {
      for (const key of Object.keys(seedMap)) {
        await deleteCollection(key);
      }
      alert("All deleted");
    });

  // =========================
  // DELETE INPUT
  // =========================
  const handleDeleteInput = () =>
    run(async () => {
      if (!input) return;
      await deleteCollection(input);
      alert(`Deleted: ${input}`);
    });

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Seeder Panel</h1>

      {/* INPUT DELETE */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="collection name (e.g bookings)"
          className="border px-3 py-2 rounded"
        />

        <button
          onClick={handleDeleteInput}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={handleSeedAll}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Seed All
        </button>

        <button
          onClick={handleDeleteAll}
          disabled={loading}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Clear All
        </button>
      </div>

      {/* COLLECTION GRID */}
      <div className="grid grid-cols-2 gap-3">
        {Object.keys(seedMap).map((key) => (
          <div
            key={key}
            className="border p-3 rounded flex justify-between items-center"
          >
            <span className="capitalize">{key}</span>

            <div className="flex gap-2">
              <button
                onClick={() => handleSeed(key)}
                disabled={loading}
                className="text-blue-600 text-sm"
              >
                seed
              </button>

              <button
                onClick={() => handleDelete(key)}
                disabled={loading}
                className="text-red-600 text-sm"
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}