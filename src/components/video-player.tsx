"use client";

import {
  AlertCircle,
  ExternalLink,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Video type detection
// ---------------------------------------------------------------------------

type VideoType = "html5" | "youtube" | "vimeo" | "error";

function getYouTubeEmbedUrl(url: string): string | null {
  // https://www.youtube.com/watch?v=XYZ
  const watchMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) {
    // Ensure it has the right params
    const base = url.split("?")[0];
    return `${base}?rel=0&modestbranding=1`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Check if a URL is a playable HTML5 video URL
// ---------------------------------------------------------------------------

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?.*)?$/i;

function isPlayableVideoUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;

  // Local uploads (starts with /uploads/)
  if (url.startsWith("/uploads/")) return true;

  // Check for common video file extensions
  if (VIDEO_EXTENSIONS.test(url)) return true;

  // Check if it's a known CDN / streaming URL pattern
  // (e.g. from cloudflare, mux, cloudinary, etc.)
  if (
    url.includes(".m3u8") ||
    url.includes(".mpd") ||
    url.includes("cloudflarestream.com") ||
    url.includes("mux.com") ||
    url.includes("cloudinary.com") ||
    url.includes("vimeo.com") && !url.includes("/embed/")
  ) return true;

  return false;
}

function detectVideoType(url: string): { type: VideoType; embedUrl?: string } {
  if (!url || url.trim() === "") return { type: "error" };

  const ytUrl = getYouTubeEmbedUrl(url);
  if (ytUrl) return { type: "youtube", embedUrl: ytUrl };

  const vimeoUrl = getVimeoEmbedUrl(url);
  if (vimeoUrl) return { type: "vimeo", embedUrl: vimeoUrl };

  // Local uploads or direct video URLs
  if (isPlayableVideoUrl(url)) return { type: "html5" };

  // URL exists but doesn't look like a playable video
  return { type: "error" };
}

// ---------------------------------------------------------------------------
// Error card
// ---------------------------------------------------------------------------

function VideoErrorCard({ url }: { url: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl bg-slate-950 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-red-500/10">
        <AlertCircle className="h-7 w-7 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">
          Unsupported or invalid video source.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Please verify the URL or try opening it directly.
        </p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open original link
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// YouTube / Vimeo iframe player
// ---------------------------------------------------------------------------

function EmbedPlayer({
  embedUrl,
  title,
  originalUrl,
  assignmentId,
  assetId,
  durationSeconds,
  onProgress,
}: {
  embedUrl: string;
  title: string;
  originalUrl: string;
  assignmentId: string;
  assetId: string;
  durationSeconds: number;
  onProgress?: (pct: number) => void;
}) {
  // For embedded players we can only approximate progress via elapsed time
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pct = Math.min(100, (elapsed / durationSeconds) * 100);

  useEffect(() => {
    onProgress?.(pct);
  }, [pct, onProgress]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 10;
          // Report to API every 10 seconds
          fetch("/api/progress/watch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId,
              assetId,
              lastSecond: next,
              watchedSeconds: next,
              durationSeconds,
              pausedCount: 0,
              skippedCount: 0,
              replayedCount: 0,
              playbackRate: 1,
            }),
          }).catch(() => undefined);
          return next;
        });
      }, 10_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, assignmentId, assetId, durationSeconds]);

  return (
    <div className="overflow-hidden rounded-xl border bg-black shadow-soft">
      <div className="relative aspect-video w-full bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pause timer" : "Start timer"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {isPlaying ? "Tracking" : "Track time"}
            </span>
          </Button>
          <span className="text-xs text-slate-400">
            {Math.round(pct)}% watched
          </span>
        </div>
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
        >
          <ExternalLink className="h-3 w-3" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HTML5 native player
// ---------------------------------------------------------------------------

function Html5Player({
  src,
  assignmentId,
  assetId,
  durationSeconds,
  onProgress,
}: {
  src: string;
  assignmentId: string;
  assetId: string;
  durationSeconds: number;
  onProgress?: (pct: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  const storageKey = `etms-video-${assignmentId}-${assetId}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const saved = Number(localStorage.getItem(storageKey) ?? 0);
    if (saved > 0) video.currentTime = saved;

    const interval = window.setInterval(() => {
      if (video.paused && !playing) return;
      const currentSec = Math.floor(video.currentTime);
      localStorage.setItem(storageKey, String(currentSec));
      const dur = video.duration || durationSeconds || 1;
      const pct = Math.min(100, (video.currentTime / dur) * 100);
      setProgress(pct);
      onProgress?.(pct);

      fetch("/api/progress/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          assetId,
          lastSecond: currentSec,
          watchedSeconds: currentSec,
          durationSeconds: Math.floor(video.duration || durationSeconds || 1),
          pausedCount: video.paused ? 1 : 0,
          skippedCount: 0,
          replayedCount: 0,
          playbackRate: video.playbackRate,
        }),
      }).catch(() => undefined);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [assignmentId, assetId, durationSeconds, storageKey, onProgress, playing]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || durationSeconds || 1;
    const pct = Math.min(100, (video.currentTime / dur) * 100);
    setProgress(pct);
    onProgress?.(pct);
  }, [durationSeconds, onProgress]);

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const updateRate = () => {
    const next = rate >= 2 ? 0.75 : rate + 0.25;
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  // Guard: never render <video> for an unvalidated URL
  const isInvalid = !isPlayableVideoUrl(src);

  if (hasError || isInvalid) return <VideoErrorCard url={src} />;

  return (
    <div className="overflow-hidden rounded-xl border bg-black shadow-soft">
      <video
        ref={videoRef}
        src={src}
        controls={false}
        muted={muted}
        className="aspect-video w-full bg-black"
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setHasError(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* Progress */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-3 py-3 text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800"
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
            onClick={updateRate}
            aria-label={`Playback speed ${rate}x`}
          >
            {rate.toFixed(2)}x
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800"
            onClick={() => {
              setMuted((m) => !m);
              if (videoRef.current) videoRef.current.muted = !muted;
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800"
            onClick={() => videoRef.current?.requestPictureInPicture?.()}
            aria-label="Picture in picture"
          >
            <PictureInPicture2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800"
            onClick={() => videoRef.current?.requestFullscreen?.()}
            aria-label="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          {src.startsWith("http") && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <ExternalLink className="h-3 w-3" />
              Open in new tab
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported VideoPlayer — auto-detects type
// ---------------------------------------------------------------------------

export function VideoPlayer({
  src,
  title = "Training Video",
  assignmentId,
  assetId,
  durationSeconds = 1,
  onProgress,
}: {
  src: string;
  title?: string;
  assignmentId: string;
  assetId: string;
  durationSeconds?: number | null;
  onProgress?: (pct: number) => void;
}) {
  const duration = durationSeconds ?? 1;
  const detected = detectVideoType(src);

  if (detected.type === "error") {
    return <VideoErrorCard url={src} />;
  }

  if (detected.type === "youtube" || detected.type === "vimeo") {
    return (
      <EmbedPlayer
        embedUrl={detected.embedUrl!}
        title={title}
        originalUrl={src}
        assignmentId={assignmentId}
        assetId={assetId}
        durationSeconds={duration}
        onProgress={onProgress}
      />
    );
  }

  // HTML5 (uploads, mp4, webm, ogg, CDN, etc.)
  return (
    <Html5Player
      src={src}
      assignmentId={assignmentId}
      assetId={assetId}
      durationSeconds={duration}
      onProgress={onProgress}
    />
  );
}
