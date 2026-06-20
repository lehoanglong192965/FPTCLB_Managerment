import { ShieldOff, ShieldCheck } from "lucide-react";

/**
 * FE1 component — nút Tạm khóa / Mở khóa tài khoản.
 * Props:
 *   user     — object { userID, roleID, accountStatus, fullName }
 *   onToggle — fn(user, "suspend" | "activate")
 *   variant  — "default" (full label) | "compact" (short label, smaller padding)
 */
export default function SuspendButton({ user, onToggle, variant = "default" }) {
  if (!user || user.roleID === 1) return null;

  const isActive  = user.accountStatus === "Active";
  const isCompact = variant === "compact";

  const base = `inline-flex items-center gap-1.5 font-semibold cursor-pointer transition-colors whitespace-nowrap border ${
    isCompact ? "px-3 py-1 rounded-md text-xs" : "px-4 py-2 rounded-lg text-[13px]"
  }`;

  return isActive ? (
    <button
      className={`${base} border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100`}
      onClick={() => onToggle(user, "suspend")}
    >
      <ShieldOff size={isCompact ? 12 : 14} />
      {isCompact ? "Tạm khóa" : "Tạm khóa tài khoản"}
    </button>
  ) : (
    <button
      className={`${base} border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      onClick={() => onToggle(user, "activate")}
    >
      <ShieldCheck size={isCompact ? 12 : 14} />
      {isCompact ? "Mở khóa" : "Mở khóa tài khoản"}
    </button>
  );
}
