"use client";
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvent,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./FireBase"; 
/**
 * This component allows users to plan and visualize a travel route on an interactive map using Leaflet.
 * Users can click on the map or search by country/city to add multiple locations to their trip.
 * The map displays each stop with a marker and popup containing the location details.
 * A polyline connects all stops to visualize the travel path.
 * Users can set start and end dates, calculate the total travel distance using the haversine formula,
 * and save the trip to a backend server (via a POST request to an API).
 * The component integrates with Firebase Authentication to associate trips with a specific user.
 * It uses the OpenStreetMap reverse geocoding API to retrieve human-readable location names.
 */

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

async function latLngToLocationEnglish([lat, lng]) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}&accept-language=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch location");
    const data = await res.json();
    return {
      country: data.address?.country || "Unknown",
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.hamlet ||
        "",
    };
  } catch {
    return { country: "Unknown", city: "" };
  }
}

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const a =
    Math.sin((toRad(lat2 - lat1)) / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin((toRad(lon2 - lon1)) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ClickHandler({ addPoint }) {
  useMapEvent("click", async (e) => {
    const pos = [e.latlng.lat, e.latlng.lng];
    const location = await latLngToLocationEnglish(pos);
    addPoint({ pos, ...location });
  });
  return null;
}

function FlyToPosition({ position }) {
  const map = useMap();
  if (position) map.flyTo(position, 5, { duration: 1.5 });
  return null;
}

export default function TourMap({ userId: userIdProp = null }) {
  const [userId, setUserId] = useState(userIdProp);
  const [authReady, setReady] = useState(false);

  useEffect(() => {
    if (userIdProp) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      setReady(true);
    });
    return unsub;
  }, [userIdProp]);

  const [points, setPoints] = useState([]);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [flyPos, setFlyPos] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const addPoint = (p) => setPoints((prev) => [...prev, p]);
  const reset = () => {
    setPoints([]);
    setStart("");
    setEnd("");
    setSearch("");
    setFlyPos(null);
  };

  const handleSearch = async () => {
    if (!search.trim()) return alert("Enter a country or city");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        search
      )}&limit=1&accept-language=en`;
      const res = await fetch(url, { headers: { "User-Agent": "leaflet-demo" } });
      if (!res.ok) return alert("Search error");
      const data = await res.json();
      if (!data.length) return alert("No results");

      const pos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];

      const location = await latLngToLocationEnglish(pos);

      addPoint({ pos, ...location });
      setFlyPos(pos);
      setSearch("");
    } catch (err) {
      alert("Error searching location");
      console.error(err);
    }
  };

  const saveTrip = async () => {
    if (!points.length) return alert("Add at least one point");
    if (!startDate || !endDate) return alert("Select start & end dates");
    if (!userId) return alert("Please sign‑in again");

    try {
      const res = await fetch("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points, startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Trip saved");
      reset();
    } catch (err) {
      alert("Error saving trip: " + err.message);
      console.error(err);
    }
  };

  const totalKm = points.reduce(
    (acc, p, i) => (i ? acc + haversineDistance(points[i - 1].pos, p.pos) : 0),
    0
  );

  if (!authReady) return <p>Loading…</p>;

  return (
    <div className="container my-3">
      <h3 className="text-center mb-3">Plan Your Trip</h3>

      <div className="d-flex gap-2 mb-3 flex-wrap justify-content-center">
        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Search country / city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Search & Add
        </button>
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap justify-content-center">
        <label>
          Start&nbsp;
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStart(e.target.value)}
            max={endDate || undefined}
            min={today}
          />
        </label>
        <label>
          End&nbsp;
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEnd(e.target.value)}
            min={startDate || today}
          />
        </label>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap justify-content-center">
        <button className="btn btn-warning" onClick={reset}>
          Reset
        </button>
        <button
          className="btn btn-success"
          onClick={saveTrip}
          disabled={!userId} 
        >
          Save Trip
        </button>
      </div>

      <MapContainer
        center={[31.5, 35]}
        zoom={5}
        style={{ height: "60vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler addPoint={addPoint} />
        {flyPos && <FlyToPosition position={flyPos} />}

        {points.map((p, i) => (
          <Marker key={i} position={p.pos}>
            <Popup>
              <strong>Country:</strong> {p.country}
              <br />
              {p.city && (
                <>
                  <strong>City:</strong> {p.city}
                  <br />
                </>
              )}
              <strong>Stop:</strong> {i + 1}
            </Popup>
          </Marker>
        ))}

        {points.length > 1 && (
          <Polyline
            positions={points.map((p) => p.pos)}
            pathOptions={{ color: "blue" }}
          />
        )}
      </MapContainer>

      <p className="text-center mt-3">
        Stops: <strong>{points.length}</strong> | Distance:&nbsp;
        <strong>{totalKm.toFixed(1)} km</strong>
      </p>
    </div>
  );
}
