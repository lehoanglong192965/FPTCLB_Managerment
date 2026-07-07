import { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (message, { title = "Xác nhận", confirmLabel = "Xác nhận", cancelLabel = "Huỷ", danger = false } = {}) =>
      new Promise((resolve) => {
        setState({ message, title, confirmLabel, cancelLabel, danger, resolve });
      }),
    []
  );

  const resolve = (value) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={() => resolve(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-gray-900 m-0 mb-2">{state.title}</h3>
            <p className="text-[13.5px] text-gray-600 m-0 mb-5 leading-relaxed">{state.message}</p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => resolve(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium cursor-pointer bg-white hover:border-gray-400 transition-colors font-[inherit]"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => resolve(true)}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold border-0 cursor-pointer transition-colors font-[inherit] ${
                  state.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#E6430A] hover:bg-[#c73a08]"
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
};
