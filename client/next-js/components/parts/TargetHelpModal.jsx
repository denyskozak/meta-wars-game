import { useEffect, useState, useCallback } from "react";
import "./TargetHelpModal.css";

const STORAGE_KEY = 'hideTargetHelp';

export const TargetHelpModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hide = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'true';
    if (!hide) {
      setOpen(true);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const dontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        close();
      }
    };
    const clickHandler = () => {
      close();
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('mousedown', clickHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('mousedown', clickHandler);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="target-help-overlay">
      <h2 className="target-help-title">Target Help</h2>
      <div className="target-help-body">
        <img src="/icons/target-green.svg" alt="Target Help" className="target-help-image" />
      </div>
      <div className="target-help-actions">
        <button className="target-help-button" onClick={dontShowAgain}>Don't show again</button>
        <button className="target-help-button" onClick={close}>Close (Enter or Space)</button>
      </div>
    </div>
  );
};
