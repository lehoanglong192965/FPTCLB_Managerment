/**
 * FE-CORE-05 — Skeleton loading placeholders
 *
 * Exports:
 *   Skeleton        — block cơ bản (width/height tuỳ chỉnh)
 *   SkeletonText    — dòng chữ (nhiều dòng)
 *   SkeletonCard    — card sự kiện / CLB
 *   SkeletonTable   — bảng dữ liệu N dòng
 *   SkeletonAvatar  — avatar tròn + tên bên cạnh
 */

const pulse = 'animate-pulse bg-gray-200 rounded';

/* ── Primitive ─────────────────────────────────────────────── */

export function Skeleton({ width = '100%', height = 16, className = '', rounded = 'rounded' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

/* ── Dòng chữ (mặc định 3 dòng, dòng cuối ngắn hơn) ────────── */

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={pulse}
          style={{ height: 14, width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/* ── Avatar + tên ───────────────────────────────────────────── */

export function SkeletonAvatar({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="animate-pulse bg-gray-200 rounded-full flex-shrink-0"
        style={{ width: size, height: size }}
      />
      <div className="flex-1 space-y-1.5">
        <div className={`${pulse}`} style={{ height: 12, width: '55%' }} />
        <div className={`${pulse}`} style={{ height: 10, width: '35%' }} />
      </div>
    </div>
  );
}

/* ── Card (banner + nội dung) ───────────────────────────────── */

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl overflow-hidden ${className}`}>
      <div className={`${pulse} rounded-none`} style={{ height: 160 }} />
      <div className="p-4 space-y-3">
        <div className={pulse} style={{ height: 16, width: '75%' }} />
        <div className={pulse} style={{ height: 12, width: '50%' }} />
        <div className="flex gap-2 pt-1">
          <div className={pulse} style={{ height: 10, width: 80 }} />
          <div className={pulse} style={{ height: 10, width: 60 }} />
        </div>
      </div>
    </div>
  );
}

/* ── Bảng N dòng ────────────────────────────────────────────── */

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={pulse} style={{ height: 12, flex: 1 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-4 py-3 border-b border-gray-50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={pulse}
              style={{ height: 12, flex: 1, width: c === 0 ? '30%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
