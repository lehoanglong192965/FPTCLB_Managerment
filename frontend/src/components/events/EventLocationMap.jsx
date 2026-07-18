import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletDefaultIcon";

/* Bản đồ chỉ-đọc hiển thị vị trí sự kiện. Trả về null nếu chưa có toạ độ. */
export default function EventLocationMap({ lat, lng, label, height = 220 }) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #EBEBEB", height }}>
      <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
