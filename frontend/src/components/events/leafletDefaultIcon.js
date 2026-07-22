import L from "leaflet";

/* Sửa lỗi icon marker mặc định bị vỡ khi bundle bằng Vite.
   Icon.Default._getIconUrl bỏ qua iconUrl set qua mergeOptions, nên phải
   gán hẳn một icon tường minh (URL đã được Vite resolve) cho mọi Marker. */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
