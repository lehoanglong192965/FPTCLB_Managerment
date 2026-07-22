const CSV_MIME_TYPE = "text/csv;charset=utf-8";

const isBlob = (value) =>
  typeof Blob !== "undefined" && value instanceof Blob;

const messageFromPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const message =
    payload.message ??
    payload.error?.message ??
    (typeof payload.error === "string" ? payload.error : null) ??
    payload.detail;

  return typeof message === "string" && message.trim() ? message.trim() : null;
};

const parseErrorPayload = async (payload) => {
  if (isBlob(payload)) {
    try {
      return messageFromPayload(JSON.parse(await payload.text()));
    } catch {
      return null;
    }
  }

  if (typeof payload === "string") {
    try {
      return messageFromPayload(JSON.parse(payload));
    } catch {
      return null;
    }
  }

  return messageFromPayload(payload);
};

export async function getDownloadErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status;
  if (!status || status >= 500) return fallbackMessage;

  return (await parseErrorPayload(error?.response?.data)) ?? fallbackMessage;
}

export function buildEventCsvFileName(eventId, exportType) {
  const safeEventId = String(eventId ?? "").replace(/[^0-9]/g, "") || "export";
  const suffix = exportType === "attendance" ? "attendance" : "registrations";
  return "event-" + safeEventId + "-" + suffix + ".csv";
}

export function downloadCsvFile(csvData, fileName) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("CSV downloads are only available in a browser.");
  }

  const blob = isBlob(csvData)
    ? csvData
    : new Blob([csvData ?? ""], { type: CSV_MIME_TYPE });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = String(fileName || "export.csv").replace(/[^a-zA-Z0-9._-]/g, "_");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
