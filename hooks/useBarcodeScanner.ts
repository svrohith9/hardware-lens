"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useBarcodeScanner(onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const startingRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    startingRef.current = false;
    setIsActive(false);
  }, []);

  const loop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
      return;
    }

    if (busyRef.current) {
      animationRef.current = requestAnimationFrame(loop);
      return;
    }

    busyRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      busyRef.current = false;
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const results = await detectorRef.current.detect(canvas);
      const candidate = results.find((item) => item.rawValue);

      if (candidate?.cornerPoints && candidate.cornerPoints.length > 0) {
        ctx.strokeStyle = "#ef3d36";
        ctx.lineWidth = 6;
        ctx.beginPath();
        candidate.cornerPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      }

      if (candidate?.rawValue) {
        onDetected(candidate.rawValue);
        stop();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scanner failed");
    } finally {
      busyRef.current = false;
    }

    animationRef.current = requestAnimationFrame(loop);
  }, [onDetected, stop]);

  const start = useCallback(async () => {
    if (startingRef.current || isActive) {
      return;
    }
    startingRef.current = true;
    setError(null);
    setIsActive(true);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        if (videoRef.current.readyState < 2) {
          await new Promise<void>((resolve) => {
            videoRef.current?.addEventListener("loadedmetadata", () => resolve(), {
              once: true
            });
          });
        }
        await videoRef.current.play();
      }

      if (!detectorRef.current) {
        if (!("BarcodeDetector" in window)) {
          throw new Error("BarcodeDetector API not supported in this browser");
        }
        detectorRef.current = new BarcodeDetector({
          formats: ["ean_8", "ean_13", "upc_a", "upc_e", "code_128"]
        });
      }

      animationRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera access failed");
      stop();
    } finally {
      startingRef.current = false;
    }
  }, [isActive, loop, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    start,
    stop
  };
}
