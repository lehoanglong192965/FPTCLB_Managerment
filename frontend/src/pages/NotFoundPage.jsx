import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F7] px-6 text-center">
      <div className="text-[96px] font-black text-[#F37021] leading-none select-none mb-2">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Trang không tồn tại</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-[360px]">
        Đường dẫn bạn truy cập không hợp lệ hoặc đã bị xoá. Hãy kiểm tra lại URL hoặc quay về trang chủ.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors font-[inherit]"
        >
          ← Quay lại
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 rounded-lg bg-[#F37021] hover:bg-[#d9620f] text-white text-sm font-semibold cursor-pointer transition-colors border-none font-[inherit]"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
