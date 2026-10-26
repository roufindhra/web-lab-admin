import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Buttons";

interface AnchoredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  title: string;
  description: string;
  targetSelector?: string;
}

export const WalkthroughDialog: React.FC<AnchoredDialogProps> = ({
  isOpen,
  onClose,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  title,
  description,
  targetSelector,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    if (!isOpen || !targetSelector) {
      setCoords(null);
      return false;
    }

    const formattedSelector =
      targetSelector.startsWith("#") || targetSelector.startsWith(".")
        ? targetSelector
        : `#${targetSelector}`;

    const element = document.querySelector(formattedSelector);

    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCoords({
          top: Math.max(16, rect.top),
          left: rect.right + 16,
        });
        return true;
      }
    }

    setCoords(null);
    return false;
  }, [isOpen, targetSelector]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const observer = new MutationObserver(() => updatePosition());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const handleResizeOrScroll = () => updatePosition();
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, targetSelector, currentStep, updatePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyle: React.CSSProperties = coords
    ? {
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        margin: 0,
      }
    : {};

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="fixed inset-0 bg-black/20 pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        style={positionStyle}
        className={`md-dialog-container pointer-events-auto z-10 w-80 p-5 animate-in fade-in zoom-in-95 duration-200 ${
          !coords
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
            : ""
        }`}
      >
        {coords && (
          <div
            className="absolute -left-1 top-1 h-10 w-8 rotate-60 border-l border-b"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-high)",
              borderColor: "var(--md-sys-color-outline-variant)",
            }}
          />
        )}

        <div className="mb-3 flex items-center justify-between text-xs font-semibold opacity-70">
          <span>
            Langkah {currentStep + 1} dari {totalSteps}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_10%,transparent)]"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 space-y-1.5">
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          <p className="text-xs opacity-80 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          {currentStep > 0 && (
            <Button variant="outlined" onClick={onPrev}>
              Kembali
            </Button>
          )}
          <Button variant="filled" onClick={onNext}>
            {currentStep === totalSteps - 1 ? "Selesai" : "Lanjut"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
