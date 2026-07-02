import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Generic modal.
 * Props:
 *   isOpen   boolean
 *   onClose  () => void
 *   title    string | ReactNode
 *   children ReactNode
 *   footer   ReactNode          — action buttons
 *   size     'sm'|'md'|'lg'|'xl'  (default 'md')
 *   closable boolean            (default true) — show X + ESC + backdrop click
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closable = true,
}) {
  const overlayRef = useRef(null);

  // ESC để đóng
  useEffect(() => {
    if (!isOpen || !closable) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closable, onClose]);

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (closable && e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${SIZE[size] ?? SIZE.md} flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            {title && (
              <h2 className="text-base font-semibold text-gray-900 leading-snug">
                {title}
              </h2>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
