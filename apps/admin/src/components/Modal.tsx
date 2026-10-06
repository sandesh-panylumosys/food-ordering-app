import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { IconButton } from './Button';
import { IconX } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** `drawer` slides in from the right edge; `center` is a classic dialog. */
  variant?: 'center' | 'drawer';
  /** When false, Escape / backdrop clicks are ignored (e.g. while saving). */
  dismissible?: boolean;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Built on the native <dialog> element: focus trapping, Escape and inertness come for free. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'center',
  dismissible = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      className={cx(
        'bg-transparent p-0 text-ink backdrop:bg-espresso/45 backdrop:backdrop-blur-[2px] open:flex',
        variant === 'center'
          ? cx('m-auto w-[calc(100%-2rem)]', SIZES[size])
          : 'my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-2xl',
      )}
    >
      {open && (
        <div
          className={cx(
            'flex w-full flex-col overflow-hidden bg-white shadow-2xl',
            variant === 'center' ? 'max-h-[calc(100dvh-2rem)] rounded-2xl' : 'h-full',
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold text-espresso">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" onClick={requestClose} disabled={!dismissible} className="-mr-2 -mt-1">
              <IconX />
            </IconButton>
          </header>
          {children && <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>}
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-cream/50 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
