import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard, QrCode, RefreshCcw } from "lucide-react";

const DUPLICATE_WINDOW_MS = 5000;

function cameraErrorMessage(error) {
  const name = error?.name ?? "";
  const message = String(error?.message ?? error ?? "").toLowerCase();
  if (!window.isSecureContext) {
    return "Trình duyệt chỉ cho phép mở camera trên HTTPS hoặc localhost.";
  }
  if (name === "NotAllowedError" || message.includes("permission") || message.includes("notallowed")) {
    return "Quyền camera đang bị chặn. Hãy bấm biểu tượng ổ khóa cạnh địa chỉ trang, cho phép Camera rồi tải lại trang.";
  }
  if (name === "NotFoundError" || message.includes("no camera") || message.includes("notfound")) {
    return "Không tìm thấy camera trên thiết bị này. Bạn vẫn có thể nhập mã vé thủ công.";
  }
  if (name === "NotReadableError" || message.includes("could not start") || message.includes("trackstart") || message.includes("in use")) {
    return "Camera đang được ứng dụng hoặc tab khác sử dụng. Hãy đóng ứng dụng camera/Zoom/Meet rồi thử lại.";
  }
  if (name === "OverconstrainedError" || message.includes("constraint")) {
    return "Camera không hỗ trợ cấu hình được yêu cầu. Hãy chọn camera khác hoặc thử lại.";
  }
  return `Không thể mở camera${error?.message ? `: ${error.message}` : "."}`;
}

export default function QrCheckInPanel({ onTicketRead }) {
  const readerIdRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerTaskRef = useRef(Promise.resolve());
  const onTicketReadRef = useRef(onTicketRead);
  const lastScanRef = useRef({ value: "", at: 0 });
  const submittingRef = useRef(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scannerGeneration, setScannerGeneration] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [notice, setNotice] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  if (!readerIdRef.current) {
    readerIdRef.current = "qr-ticket-reader-" + Math.random().toString(36).slice(2, 10);
  }

  useEffect(() => {
    onTicketReadRef.current = onTicketRead;
  }, [onTicketRead]);

  const enqueueScannerTask = useCallback((task) => {
    const queuedTask = scannerTaskRef.current.then(task, task);
    scannerTaskRef.current = queuedTask.catch(() => undefined);
    return queuedTask;
  }, []);

  const disposeScanner = useCallback(async (scanner) => {
    if (!scanner) return;
    if (scannerRef.current === scanner) scannerRef.current = null;
    try {
      await scanner.stop();
    } catch {
      // A scanner can already be stopped while its component is changing.
    }
    try {
      await scanner.clear();
    } catch {
      // Clearing an unavailable reader is safe to ignore.
    }
  }, []);

  const submitTicket = useCallback(async (rawTicketCode, stopCameraAfterSuccess = false) => {
    const ticketCode = rawTicketCode?.trim();
    if (!ticketCode) {
      setNotice("Scan or enter a ticket code first.");
      return false;
    }
    const now = Date.now();
    const previous = lastScanRef.current;
    if (submittingRef.current) {
      setNotice("The previous ticket is still being processed.");
      return false;
    }
    if (previous.value === ticketCode && now - previous.at < DUPLICATE_WINDOW_MS) {
      setNotice("This ticket was scanned recently. Please wait before scanning it again.");
      return false;
    }

    lastScanRef.current = { value: ticketCode, at: now };
    submittingRef.current = true;
    setSubmitting(true);
    setNotice("");
    try {
      await onTicketReadRef.current(ticketCode);
      if (stopCameraAfterSuccess) {
        const scannerToStop = scannerRef.current;
        setNotice("Check-in completed. Start the camera again for the next ticket.");
        setCameraEnabled(false);
        void enqueueScannerTask(() => disposeScanner(scannerToStop));
      }
      return true;
    } catch {
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [disposeScanner, enqueueScannerTask]);

  useEffect(() => {
    if (!cameraEnabled) return undefined;

    let disposed = false;
    let localScanner = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (disposed) return;

        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API requires HTTPS or localhost");
        }

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) {
          const notFoundError = new Error("No camera found");
          notFoundError.name = "NotFoundError";
          throw notFoundError;
        }
        setAvailableCameras(cameras);
        const preferredCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ?? cameras[0];
        const cameraId = selectedCameraId && cameras.some((camera) => camera.id === selectedCameraId)
          ? selectedCameraId
          : preferredCamera.id;
        setSelectedCameraId(cameraId);

        await enqueueScannerTask(async () => {
          if (disposed) return;
          if (scannerRef.current) await disposeScanner(scannerRef.current);
          if (disposed) return;

          const scanner = new Html5Qrcode(readerIdRef.current);
          localScanner = scanner;
          scannerRef.current = scanner;

          const config = { fps: 10, qrbox: { width: 240, height: 240 } };
          if (Html5QrcodeSupportedFormats?.QR_CODE) {
            config.formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE];
          }

          await scanner.start(
            cameraId,
            config,
            (decodedText) => { void submitTicket(decodedText, true); },
            () => {}
          );

          if (disposed) await disposeScanner(scanner);
        });
      } catch (error) {
        console.warn("[QrCheckInPanel] Camera start failed:", error);
        if (localScanner) {
          await enqueueScannerTask(() => disposeScanner(localScanner));
        }
        if (disposed) return;
        setCameraError(cameraErrorMessage(error));
        setCameraEnabled(false);
      }
    };

    void startScanner();
    return () => {
      disposed = true;
      void enqueueScannerTask(() => disposeScanner(localScanner));
    };
  }, [cameraEnabled, disposeScanner, enqueueScannerTask, scannerGeneration, selectedCameraId, submitTicket]);

  const submitManualCode = async (event) => {
    event.preventDefault();
    const accepted = await submitTicket(manualCode);
    if (accepted) setManualCode("");
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white"><QrCode size={19} /></div>
          <div>
            <h3 className="font-semibold text-slate-900">QR ticket check-in</h3>
            <p className="mt-1 text-sm text-slate-600">The ticket is verified for this event and recorded only once.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCameraError(""); setNotice(""); setCameraEnabled((enabled) => !enabled); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            {cameraEnabled ? <CameraOff size={16} /> : <Camera size={16} />}
            {cameraEnabled ? "Stop camera" : "Use camera"}
          </button>
          {cameraEnabled && (
            <button type="button" onClick={() => { setCameraError(""); setNotice(""); setScannerGeneration((generation) => generation + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <RefreshCcw size={16} /> Restart
            </button>
          )}
        </div>
        {availableCameras.length > 1 && (
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Chọn camera
            <select
              value={selectedCameraId}
              onChange={(event) => { setSelectedCameraId(event.target.value); setCameraError(""); setScannerGeneration((generation) => generation + 1); }}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {availableCameras.map((camera, index) => <option key={camera.id} value={camera.id}>{camera.label || `Camera ${index + 1}`}</option>)}
            </select>
          </label>
        )}
      </div>

      {cameraEnabled && <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-2"><div id={readerIdRef.current} className="min-h-64 overflow-hidden rounded-lg bg-black" /></div>}
      {cameraError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{cameraError}</p>}

      <form onSubmit={submitManualCode} className="rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="manual-ticket-code" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Keyboard size={16} /> Enter ticket code without a camera</label>
        <div className="flex gap-2">
          <input id="manual-ticket-code" value={manualCode} onChange={(event) => { setManualCode(event.target.value); setNotice(""); }} placeholder="Paste or enter a ticket code" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <button type="submit" disabled={submitting || !manualCode.trim()} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Processing" : "Check in"}</button>
        </div>
      </form>
      {notice && <p className="text-sm text-slate-600" role="status">{notice}</p>}
    </div>
  );
}
