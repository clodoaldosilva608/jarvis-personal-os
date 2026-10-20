"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCamera — capture a single frame from the user's webcam.
 *
 * Uses navigator.mediaDevices.getUserMedia({ video: true }). The browser
 * prompts for camera permission on first use.
 *
 * For the JARVIS face-scan flow, we don't need full face recognition —
 * we just need to show the user's camera feed during the scan and capture
 * a single frame to display in the orb.
 */

interface UseCameraReturn {
  /** Live MediaStream — bind to a <video> element to show the camera feed. */
  stream: MediaStream | null;
  /** True while the camera is on. */
  active: boolean;
  error: string | null;
  /** Ask the user for camera permission and start the stream. */
  start: () => Promise<MediaStream | null>;
  /** Stop the camera and release the device. */
  stop: () => void;
  /** Capture a single frame as a JPEG data URL. */
  capture: () => string | null;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        try { track.stop(); } catch { /* noop */ }
      }
      streamRef.current = null;
      setStream(null);
    }
    setActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async (): Promise<MediaStream | null> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Câmera não suportada neste dispositivo.");
      return null;
    }
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
      setActive(true);
      return s;
    } catch (e) {
      const err = e as { name?: string; message?: string };
      let msg = "Não foi possível acessar a câmera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Permissão de câmera negada. Autorize nas configurações do navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Câmera está em uso por outro aplicativo.";
      }
      setError(msg);
      setActive(false);
      return null;
    }
  }, []);

  const capture = useCallback((): string | null => {
    if (!streamRef.current || !videoRef.current) return null;
    const video = videoRef.current;
    if (!video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Mirror horizontally so it matches the user's natural orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // Provide a hidden video element that callers can use.
  // We create it lazily and bind it to the stream when available.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const v = document.createElement("video");
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true;
    v.style.position = "fixed";
    v.style.width = "1px";
    v.style.height = "1px";
    v.style.opacity = "0";
    v.style.pointerEvents = "none";
    v.style.left = "-9999px";
    document.body.appendChild(v);
    videoRef.current = v;
    return () => {
      try { document.body.removeChild(v); } catch { /* noop */ }
      videoRef.current = null;
    };
  }, []);

  // Bind stream to video element when available.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => { /* autoplay blocked */ });
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { stream, active, error, start, stop, capture };
}
