"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";

import {
  AGENCY_LOCATION,
  DEFAULT_MAP_CENTER,
  isValidCoordinates,
} from "@/lib/location";

const OSM_TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function getInitialCenter(eventCoordinates) {
  if (isValidCoordinates(eventCoordinates)) {
    return eventCoordinates;
  }

  if (isValidCoordinates(AGENCY_LOCATION.coordinates)) {
    return AGENCY_LOCATION.coordinates;
  }

  return DEFAULT_MAP_CENTER;
}

export default function EventLocationMap({
  value = null,
  onChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const eventMarkerRef = useRef(null);
  const agencyMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initializeMap() {
      const leafletModule = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const L = leafletModule.default ?? leafletModule;
      leafletRef.current = L;

      const initialCenter = getInitialCenter(value);
      const initialZoom =
        isValidCoordinates(value) ||
        isValidCoordinates(AGENCY_LOCATION.coordinates)
          ? 13
          : 5;

      const map = L.map(containerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      const agencyIcon = L.divIcon({
        className: "",
        html: '<div style="width:18px;height:18px;border-radius:9999px;background:#000;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const eventIcon = L.divIcon({
        className: "",
        html: '<div style="width:20px;height:20px;border-radius:9999px;background:#5e604d;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.30)"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      if (isValidCoordinates(AGENCY_LOCATION.coordinates)) {
        agencyMarkerRef.current = L.marker(
          [
            AGENCY_LOCATION.coordinates.lat,
            AGENCY_LOCATION.coordinates.lng,
          ],
          {
            icon: agencyIcon,
            interactive: true,
          },
        )
          .addTo(map)
          .bindTooltip(
            AGENCY_LOCATION.name || "Agency",
            { direction: "top" },
          );
      }

      if (isValidCoordinates(value)) {
        eventMarkerRef.current = L.marker(
          [value.lat, value.lng],
          {
            icon: eventIcon,
            interactive: false,
          },
        )
          .addTo(map)
          .bindTooltip("Lokasi event", {
            direction: "top",
          });
      }

      if (
        isValidCoordinates(AGENCY_LOCATION.coordinates) &&
        isValidCoordinates(value)
      ) {
        lineRef.current = L.polyline(
          [
            [
              AGENCY_LOCATION.coordinates.lat,
              AGENCY_LOCATION.coordinates.lng,
            ],
            [value.lat, value.lng],
          ],
          {
            weight: 2,
            opacity: 0.65,
            dashArray: "7 8",
          },
        ).addTo(map);
      }

      map.on("click", (event) => {
        if (disabled) return;

        onChangeRef.current?.({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        });
      });

      mapRef.current = map;

      window.setTimeout(() => {
        map.invalidateSize();
      }, 0);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      leafletRef.current = null;
      eventMarkerRef.current = null;
      agencyMarkerRef.current = null;
      lineRef.current = null;
    };
  }, [disabled]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;

    if (!L || !map) return;

    const eventIcon = L.divIcon({
      className: "",
      html: '<div style="width:20px;height:20px;border-radius:9999px;background:#5e604d;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.30)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (eventMarkerRef.current) {
      eventMarkerRef.current.remove();
      eventMarkerRef.current = null;
    }

    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    if (!isValidCoordinates(value)) return;

    eventMarkerRef.current = L.marker(
      [value.lat, value.lng],
      {
        icon: eventIcon,
        interactive: false,
      },
    )
      .addTo(map)
      .bindTooltip("Lokasi event", {
        direction: "top",
      });

    if (isValidCoordinates(AGENCY_LOCATION.coordinates)) {
      lineRef.current = L.polyline(
        [
          [
            AGENCY_LOCATION.coordinates.lat,
            AGENCY_LOCATION.coordinates.lng,
          ],
          [value.lat, value.lng],
        ],
        {
          weight: 2,
          opacity: 0.65,
          dashArray: "7 8",
        },
      ).addTo(map);

      const bounds = L.latLngBounds([
        [
          AGENCY_LOCATION.coordinates.lat,
          AGENCY_LOCATION.coordinates.lng,
        ],
        [value.lat, value.lng],
      ]);

      map.fitBounds(bounds.pad(0.25), {
        maxZoom: 15,
        animate: true,
      });
    } else {
      map.setView([value.lat, value.lng], 15, {
        animate: true,
      });
    }
  }, [value?.lat, value?.lng]);

  return (
    /*
     * Leaflet memakai z-index internal yang cukup tinggi
     * (marker, tooltip, control, popup, dll).
     *
     * Wrapper ini membuat stacking context lokal agar seluruh
     * layer Leaflet tetap berada di dalam area map dan tidak
     * menimpa navbar, date picker, ataupun OverlayContext.
     */
    <div
      className="relative z-0 isolate w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
      style={{
        isolation: "isolate",
        zIndex: 0,
      }}
    >
      <div
        ref={containerRef}
        className={`relative z-0 h-[360px] w-full bg-surface-container ${
          disabled ? "pointer-events-none opacity-70" : ""
        }`}
        style={{
          zIndex: 0,
        }}
        aria-label="Peta pemilihan lokasi event"
      />
    </div>
  );
}
