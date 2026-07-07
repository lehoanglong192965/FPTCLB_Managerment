// Chỉ decode, KHÔNG verify chữ ký phía client — việc verify phải thực hiện ở server.
export function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
