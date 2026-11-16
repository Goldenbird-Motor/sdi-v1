"use client";

import { useEffect, useRef } from "react";
import type * as LType from "leaflet";

const ROUTE_POINTS: [number, number][] = [
  [19.2608, 72.9712], // Rutu Enclave, Anand Nagar (Start)
  [19.2528, 72.9746], // Waghbil Naka
  [19.2425, 72.9762], // Patlipada (Metro Line 4)
  [19.2335, 72.9754], // Manpada Junction
  [19.2225, 72.9776], // Kapurbawdi Junction
  [19.2118, 72.9788], // Majiwada Flyover
  [19.1985, 72.9768], // Castle Mill
  [19.1861, 72.9758], // Thane Station (Office Parking)
];

export type JourneyPhase = "morning" | "soak" | "evening";

export default function CorridorMap({ phase }: { phase: JourneyPhase }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const carMarkerRef = useRef<LType.CircleMarker | null>(null);

  const carPosition: [number, number] =
    phase === "morning"
      ? [19.2335, 72.9754]
      : phase === "soak"
      ? [19.1861, 72.9758]
      : [19.2225, 72.9776];

  const phaseLabel =
    phase === "morning"
      ? "7:00 – 8:00 AM • Driving to Thane Station (9.5 km)"
      : phase === "soak"
      ? "8:00 AM – 5:00 PM • Parked Outside in the Sun (9 Hours)"
      : "5:00 – 6:00 PM • Driving Home to Rutu Enclave (9.5 km)";

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [19.2235, 72.9755],
        zoom: 12,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);

      // Full Road Line
      L.polyline(ROUTE_POINTS, {
        color: "#34A87E",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      // Shaded Metro Pillar Stretch
      L.polyline(ROUTE_POINTS.slice(2, 6), {
        color: "#E5A93B",
        weight: 5,
        dashArray: "6 6",
        opacity: 0.95,
      }).addTo(map);

      // Start: Rutu Enclave
      L.circleMarker(ROUTE_POINTS[0], {
        radius: 6,
        color: "#F2ECE1",
        fillColor: "#34A87E",
        fillOpacity: 1,
      })
        .bindTooltip("Rutu Enclave (19.2608° N, 72.9712° E)", {
          permanent: true,
          direction: "right",
        })
        .addTo(map);

      // End: Thane Station
      L.circleMarker(ROUTE_POINTS[ROUTE_POINTS.length - 1], {
        radius: 6,
        color: "#F2ECE1",
        fillColor: "#E5A93B",
        fillOpacity: 1,
      })
        .bindTooltip("Thane Station (19.1861° N, 72.9758° E)", {
          permanent: true,
          direction: "right",
        })
        .addTo(map);

      // Car Marker
      const carMarker = L.circleMarker(carPosition, {
        radius: 9,
        color: "#221912",
        weight: 2.5,
        fillColor: "#F2ECE1",
        fillOpacity: 1,
      })
        .bindTooltip("Test Car", { direction: "top" })
        .addTo(map);

      mapRef.current = map;
      carMarkerRef.current = carMarker;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        carMarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (carMarkerRef.current) {
      carMarkerRef.current.setLatLng(carPosition);
    }
  }, [phase]);

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-xl border-2 border-[#3E3024] bg-[#18110C]">
      <div className="absolute left-3 top-3 z-[1000] rounded-lg border border-[#4A392B] bg-[#221912]/95 px-3.5 py-2 shadow-lg">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#B8A99A]">
          Ghodbunder Road • 9.5 km Each Way (19 km Total)
        </div>
        <div className="mt-0.5 text-xs font-semibold text-[#E5A93B]">{phaseLabel}</div>
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}