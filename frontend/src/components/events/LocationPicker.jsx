import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletDefaultIcon";
import { Search, MapPin, Loader2 } from "lucide-react";

/* Toạ độ mặc định: khuôn viên ĐH FPT (Hoà Lạc). Chỉ dùng khi chưa chọn vị trí. */
const DEFAULT_CENTER = [21.0138, 105.5256];
const NOMINATIM = "https://nominatim.openstreetmap.org";

/* Di chuyển bản đồ tới toạ độ mới khi chọn từ ô tìm kiếm. */
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/* Bắt sự kiện click trên bản đồ để đặt ghim. */
function ClickCapture({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LocationPicker({ address, lat, lng, onChange, error }) {
  const [query, setQuery]         = useState(address || "");
  const [results, setResults]     = useState([]);
  const [open, setOpen]           = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating]   = useState(false);
  const debounceRef = useRef(null);
  const boxRef      = useRef(null);

  const hasPin = typeof lat === "number" && typeof lng === "number";

  /* Đồng bộ khi giá trị address từ ngoài thay đổi (VD reset form). */
  useEffect(() => { setQuery(address || ""); }, [address]);

  /* Đóng dropdown khi click ra ngoài. */
  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const runSearch = async (q) => {
    if (!q || q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "vi" } }
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (val) => {
    setQuery(val);
    onChange({ address: val, lat, lng });   // giữ ô địa chỉ chỉnh tay được
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 500);
  };

  const pickSuggestion = (item) => {
    const nlat = parseFloat(item.lat);
    const nlng = parseFloat(item.lon);
    setQuery(item.display_name);
    setOpen(false);
    setResults([]);
    onChange({ address: item.display_name, lat: nlat, lng: nlng });
  };

  /* Reverse geocode khi click / kéo ghim để điền lại địa chỉ. */
  const reverseGeocode = async (nlat, nlng) => {
    onChange({ address: query, lat: nlat, lng: nlng });   // đặt ghim ngay, tên điền sau
    setLocating(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?format=jsonv2&lat=${nlat}&lon=${nlng}`,
        { headers: { "Accept-Language": "vi" } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setQuery(data.display_name);
        onChange({ address: data.display_name, lat: nlat, lng: nlng });
      }
    } catch {
      /* giữ nguyên địa chỉ đang có */
    } finally {
      setLocating(false);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      {/* Ô tìm địa chỉ */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Tìm địa chỉ hoặc gõ tên địa điểm, rồi tinh chỉnh bằng cách click trên bản đồ"
          style={{
            width: "100%", padding: "9px 12px 9px 34px", fontSize: 13.5, color: "#111827",
            border: `1.5px solid ${error ? "#f87171" : "#e5e7eb"}`,
            borderRadius: 10, outline: "none", background: error ? "#fff5f5" : "#fff",
            boxSizing: "border-box",
          }}
        />
        {(searching || locating) && (
          <Loader2 size={15} style={{ position: "absolute", right: 12, top: 11, color: "#E6430A", animation: "otp-spin 1s linear infinite" }} />
        )}
      </div>

      {/* Danh sách gợi ý */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 1000, top: 44, left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: 240, overflowY: "auto",
        }}>
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => pickSuggestion(r)}
              style={{
                display: "flex", gap: 8, alignItems: "flex-start", width: "100%", textAlign: "left",
                padding: "9px 12px", border: "none", borderBottom: "1px solid #f3f4f6",
                background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#374151", lineHeight: 1.45,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF3EE")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <MapPin size={14} style={{ color: "#E6430A", flexShrink: 0, marginTop: 2 }} />
              <span>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bản đồ */}
      <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb", height: 280 }}>
        <MapContainer
          center={hasPin ? [lat, lng] : DEFAULT_CENTER}
          zoom={hasPin ? 16 : 13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCapture onPick={reverseGeocode} />
          {hasPin && (
            <Marker
              position={[lat, lng]}
              draggable
              eventHandlers={{
                dragend: (e) => { const p = e.target.getLatLng(); reverseGeocode(p.lat, p.lng); },
              }}
            />
          )}
          {hasPin && <Recenter lat={lat} lng={lng} />}
        </MapContainer>
      </div>

      <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}>
        <MapPin size={12} />
        {hasPin
          ? `Đã ghim: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} — click hoặc kéo ghim để chỉnh.`
          : "Click lên bản đồ hoặc tìm địa chỉ để đặt ghim vị trí (không bắt buộc)."}
      </p>
    </div>
  );
}
