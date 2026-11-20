"use client";

import { useEffect, useState } from "react";

type OpeningScreenProps = {
  /** When false, the screen fades out and unmounts after the exit animation. */
  show: boolean;
  /** Optional label shown under the brand name (e.g. loading/status text). */
  label?: string;
  /** ms to wait before starting exit when `show` becomes false (lets enter animation be seen). */
  minDuration?: number;
};

export default function OpeningScreen({ show, label, minDuration = 0 }: OpeningScreenProps) {
  const [visible, setVisible] = useState(show);
  const [exiting, setExiting] = useState(false);
  const [readyToExit, setReadyToExit] = useState(minDuration === 0);

  useEffect(() => {
    if (minDuration <= 0) return;
    const id = window.setTimeout(() => setReadyToExit(true), minDuration);
    return () => window.clearTimeout(id);
  }, [minDuration]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      return;
    }
    if (!readyToExit) return;
    setExiting(true);
    const id = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(id);
  }, [show, readyToExit]);

  if (!visible) return null;

  return (
    <div className={`opening-screen${exiting ? " is-exiting" : ""}`} aria-hidden={exiting} role="status" aria-live="polite">
      <div className="opening-glow" />
      <div className="opening-frame">
        <div className="opening-mark" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <div className="opening-wordmark">
          <span className="opening-name">
            <span className="opening-name-bold">Armoire</span>
          </span>
          <span className="opening-rule" />
          <span className="opening-tagline">Your closet, styled by intelligence</span>
        </div>
        {label ? <p className="opening-label">{label}</p> : null}
      </div>
    </div>
  );
}
