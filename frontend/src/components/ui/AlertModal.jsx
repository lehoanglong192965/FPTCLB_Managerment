function IconSuccess() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" stroke="#16A34A" strokeWidth="3" fill="none" />
      <polyline points="16,28 24,36 40,20" stroke="#16A34A" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconError() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" stroke="#DC2626" strokeWidth="3" fill="none" />
      {/* Eyes */}
      <circle cx="21" cy="23" r="2.5" fill="#DC2626" />
      <circle cx="35" cy="23" r="2.5" fill="#DC2626" />
      {/* Frown */}
      <path d="M19 36 Q28 28 37 36" stroke="#DC2626" strokeWidth="3"
        strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" stroke="#F37021" strokeWidth="3" fill="none" />
      {/* Bell shape */}
      <path d="M28 14 C22 14 18 19 18 25 L18 32 L15 35 L41 35 L38 32 L38 25 C38 19 34 14 28 14Z"
        fill="#F37021" />
      <rect x="24.5" y="35" width="7" height="2.5" rx="1" fill="#F37021" />
      <path d="M25.5 38.5 Q28 42 30.5 38.5" stroke="#F37021" strokeWidth="2"
        strokeLinecap="round" fill="none" />
      {/* Clapper */}
      <circle cx="28" cy="12" r="2" fill="#F37021" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" stroke="#D97706" strokeWidth="3" fill="none" />
      <path d="M28 18 L28 31" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="28" cy="38" r="2.2" fill="#D97706" />
    </svg>
  );
}

const TYPE_CFG = {
  success: {
    bg:       '#F0FDF4',
    border:   '#16A34A',
    color:    '#16A34A',
    btnBg:    '#16A34A',
    btnHover: '#15803D',
    IconComp: IconSuccess,
  },
  error: {
    bg:       '#FFF5F5',
    border:   '#DC2626',
    color:    '#DC2626',
    btnBg:    '#DC2626',
    btnHover: '#B91C1C',
    IconComp: IconError,
  },
  warning: {
    bg:       '#FFFBEB',
    border:   '#D97706',
    color:    '#D97706',
    btnBg:    '#D97706',
    btnHover: '#B45309',
    IconComp: IconWarning,
  },
  info: {
    bg:       '#FFF3EC',
    border:   '#F37021',
    color:    '#F37021',
    btnBg:    '#F37021',
    btnHover: '#e05c0a',
    IconComp: IconInfo,
  },
};

export default function AlertModal({
  type = 'info',
  title,
  message,
  subMessage,
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onClose,
}) {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.info;
  const { IconComp } = cfg;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center mb-4">
          <IconComp />
        </div>

        {/* Title */}
        {title && (
          <h3 className="text-xl font-extrabold mb-3" style={{ color: cfg.color }}>
            {title}
          </h3>
        )}

        {/* Message */}
        {message && (
          <p className="text-sm font-semibold text-gray-800 mb-1">{message}</p>
        )}
        {subMessage && (
          <p className="text-sm text-gray-500 mb-6">{subMessage}</p>
        )}
        {!subMessage && (message || title) && <div className="mb-6" />}

        {/* Confirm button */}
        <button
          onClick={onConfirm ?? onClose}
          className="w-full py-3 text-sm text-white rounded-lg font-bold mb-2 transition-colors"
          style={{ background: cfg.btnBg }}
          onMouseEnter={e => e.currentTarget.style.background = cfg.btnHover}
          onMouseLeave={e => e.currentTarget.style.background = cfg.btnBg}
        >
          {confirmLabel}
        </button>

        {/* Cancel button (optional) */}
        {cancelLabel && (
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}
