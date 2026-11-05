import { useEffect, useRef } from "react";

export function ProductVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let attempted = false;
    const load = () => {
      if (!video.getAttribute("src")) {
        video.src = src;
        video.load();
      }
    };
    const playOnce = () => {
      if (attempted) return;
      attempted = true;
      load();
      video.muted = true;
      // Native controls remain available if autoplay is blocked.
      void video.play().catch(() => {});
    };
    // A manual start or pause also opts out of future automatic playback.
    const respectManualPlayback = () => { attempted = true; };
    video.addEventListener("play", respectManualPlayback);
    video.addEventListener("pause", respectManualPlayback);

    if (typeof IntersectionObserver === "undefined") {
      playOnce();
      return () => {
        video.removeEventListener("play", respectManualPlayback);
        video.removeEventListener("pause", respectManualPlayback);
      };
    }

    const nearObserver = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      load();
      nearObserver.disconnect();
    }, { rootMargin: "300px 0px" });
    const visibleObserver = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      playOnce();
      visibleObserver.disconnect();
    });
    nearObserver.observe(video);
    visibleObserver.observe(video);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
      video.removeEventListener("play", respectManualPlayback);
      video.removeEventListener("pause", respectManualPlayback);
    };
  }, [src]);

  return <video ref={videoRef} muted controls playsInline preload="none" poster={poster} className="aspect-video w-full" aria-label="فيديو النافورة" />;
}