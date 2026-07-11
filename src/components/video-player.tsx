"use client";

import { Maximize, Pause, PictureInPicture2, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function VideoPlayer({ src, assignmentId, assetId, durationSeconds = 1 }: { src: string; assignmentId: string; assetId: string; durationSeconds?: number | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const key = `etms-video-${assignmentId}-${assetId}`;
    const saved = Number(localStorage.getItem(key) ?? 0);
    if (saved > 0) video.currentTime = saved;

    const interval = window.setInterval(() => {
      localStorage.setItem(key, String(Math.floor(video.currentTime)));
      const percent = Math.min(100, (video.currentTime / (video.duration || durationSeconds || 1)) * 100);
      setProgress(percent);
      fetch("/api/progress/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          assetId,
          lastSecond: Math.floor(video.currentTime),
          watchedSeconds: Math.floor(video.currentTime),
          durationSeconds: Math.floor(video.duration || durationSeconds || 1),
          pausedCount: video.paused ? 1 : 0,
          skippedCount: 0,
          replayedCount: 0,
          playbackRate: video.playbackRate
        })
      }).catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [assignmentId, assetId, durationSeconds]);

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

  return (
    <div className="overflow-hidden rounded-xl border bg-black shadow-soft">
      <video ref={videoRef} src={src} controls={false} className="aspect-video w-full bg-black" onEnded={() => setPlaying(false)} />
      <div className="h-1 bg-slate-800">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-3 py-3 text-white">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800" onClick={toggle}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="h-9 border-slate-700 bg-slate-900 text-white hover:bg-slate-800" onClick={updateRate}>{rate.toFixed(2)}x</Button>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-slate-300" />
          <Button variant="secondary" className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800" onClick={() => videoRef.current?.requestPictureInPicture?.()}>
            <PictureInPicture2 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="h-9 w-9 border-slate-700 bg-slate-900 px-0 text-white hover:bg-slate-800" onClick={() => videoRef.current?.requestFullscreen?.()}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
