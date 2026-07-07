import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#F4F5F7", padding: "24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Đã xảy ra lỗi không mong muốn
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px", maxWidth: 400 }}>
          Vui lòng tải lại trang. Nếu lỗi tiếp tục xảy ra, hãy liên hệ quản trị viên hệ thống.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px", background: "#F37021", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tải lại trang
        </button>
        {import.meta.env.DEV && this.state.error && (
          <pre style={{
            marginTop: 24, textAlign: "left", fontSize: 11,
            color: "#dc2626", background: "#fef2f2", padding: "12px 16px",
            borderRadius: 6, maxWidth: 640, overflow: "auto",
          }}>
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}
