import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletDefaultIcon";

/* Ép Leaflet đo lại kích thước container — tránh mảng xám do đo sai lúc mount. */
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize());
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", onResize); };
  }, [map]);
  return null;
}

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
        <InvalidateSizeOnMount />
        <Marker position={[lat, lng]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
