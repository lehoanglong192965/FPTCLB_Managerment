import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EventCheckInScanner from "./EventCheckInScanner";

export default function CheckInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h1 className="page-title m-0">Điểm Danh Sự Kiện</h1>
        <span />
      </div>
      <EventCheckInScanner eventId={eventId} eventStatus="Ongoing" />
    </div>
  );
}
