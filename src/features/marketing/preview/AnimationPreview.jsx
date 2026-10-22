'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowsOut,
  DeviceTablet,
  Laptop,
  Desktop,
  FrameCorners,
  DeviceMobile,
  DownloadSimple,
  ArrowClockwise,
  X
} from '@phosphor-icons/react';

import Select from '@/features/common/Select';
import { analytics } from '@/libs/auth/analytics';
import { useSandboxSrcdoc, parseDependencies } from '@/features/marketing/preview/inlinePreviewImages';

const VIEWPORT_PRESETS = [
  { id: "full", label: "Full", w: null, Icon: FrameCorners },
  { id: "mobile", label: "Mobile", w: 375, Icon: DeviceMobile },
  { id: "tablet", label: "Tablet", w: 768, Icon: DeviceTablet },
  { id: "laptop", label: "Laptop", w: 1024, Icon: Laptop },
  { id: "desktop", label: "Desktop", w: 1440, Icon: Desktop }
];

const DEFAULT_DESKTOP_WIDTH = VIEWPORT_PRESETS.find((preset) => preset.id === "desktop")?.w ?? null;

function PreviewStage({ srcdoc, src, reloadKey, title, renderWidth, scale, stageHeight }) {
  return (
    <div
      style={{
        width: renderWidth * scale,
        height: stageHeight,
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: renderWidth,
          height: stageHeight / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left"
        }}
      >
        <iframe
          key={reloadKey}
          {...(src ? { src } : { srcDoc: srcdoc })}
          title={title}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block"
          }}
        />
      </div>
    </div>
  );
}

export default function AnimationPreview({
  animation,
  codeState,
  previewSrcOverride = null,
  customize = null,
  bare = false,
  fill = false
}) {
  const [viewportWidth, setViewportWidth] = useState(DEFAULT_DESKTOP_WIDTH);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const stageContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!stageContainerRef.current) return;
    const el = stageContainerRef.current;
    const updateSize = () => {
      setContainerWidth(el.clientWidth);
      setContainerHeight(el.clientHeight);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const htmlCode = codeState?.html ?? animation.html_code ?? "";
  const cssCode = codeState?.css ?? animation.css_code ?? "";
  const jsCode = codeState?.js ?? animation.js_code ?? animation.gsap_code ?? "";
  const hasInlineCode = !previewSrcOverride && !!(htmlCode || cssCode || jsCode);
  const committedAttrs = customize?.committed;

  const sandboxApiUrl = useMemo(() => {
    const baseUrl = `/api/sandbox/iframe/${encodeURIComponent(animation.slug)}`;
    if (committedAttrs && Object.keys(committedAttrs).length !== 0) {
      return `${baseUrl}?attrs=${encodeURIComponent(JSON.stringify(committedAttrs))}`;
    }
    return baseUrl;
  }, [animation.slug, committedAttrs]);

  const iframeSrc = previewSrcOverride || (hasInlineCode ? undefined : sandboxApiUrl);

  const { srcdoc, isLoading } = useSandboxSrcdoc({
    animationName: animation.title,
    animationDescription: animation.description,
    category: animation.category,
    layout: animation.layout,
    htmlCode,
    cssCode,
    jsCode,
    dependencies: parseDependencies(animation.dependencies),
    metadata: animation.metadata
  });

  const isPreviewLoading = !!hasInlineCode && isLoading;
  const customizeValues = customize?.values;

  useEffect(() => {
    if (hasInlineCode || !customize || !customizeValues || Object.keys(customizeValues).length === 0) return;
    const timer = setTimeout(() => {
      const iframe = stageContainerRef.current?.querySelector("iframe");
      iframe?.contentWindow?.postMessage(
        {
          type: "anm:customize",
          selector: customize.selector,
          attrs: customizeValues,
          api: customize.api
        },
        "*"
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [customizeValues, hasInlineCode, reloadKey, customize]);

  const handleReplay = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const previewVideoUrl = animation?.preview_video_url || null;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClip = useCallback(async () => {
    if (!previewVideoUrl || isDownloading) return;
    setIsDownloading(true);
    analytics.track("detail_clip_downloaded", { slug: animation.slug });
    try {
      const response = await fetch(previewVideoUrl);
      if (!response.ok) throw new Error(String(response.status));
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `annnimate-${animation.slug}.mp4`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      window.open(previewVideoUrl, "_blank", "noopener");
    } finally {
      setIsDownloading(false);
    }
  }, [previewVideoUrl, isDownloading, animation?.slug]);

  useEffect(() => {
    if (bare) return;
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        target?.closest?.(".cm-editor")
      ) {
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReplay();
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        handleExitFullscreen();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, handleReplay, handleExitFullscreen, bare]);

  useEffect(() => {
    if (bare) return;
    function onMessage(e) {
      if (e?.data?.type !== "annnimate-shortcut") return;
      const key = e.data.key;
      if (key === "f") setIsFullscreen((prev) => !prev);
      else if (key === "r") handleReplay();
      else if (key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleReplay, bare]);

  const renderWidth = viewportWidth ?? (containerWidth || 0);
  const scale = renderWidth > containerWidth && containerWidth > 0 ? containerWidth / renderWidth : 1;
  const isScaledDown = scale < 0.999;
  const scalePercent = Math.round(scale * 100);
  const stageHeight = fill ? containerHeight : Math.max(360, Math.round(0.625 * (containerWidth || 0)));
  const activePresetId = VIEWPORT_PRESETS.find((preset) => (viewportWidth ?? null) === preset.w)?.id;

  if (bare) {
    return (
      <div
        ref={stageContainerRef}
        className={`relative flex w-full justify-center overflow-hidden bg-background ${fill ? "h-full" : ""}`}
        style={fill ? undefined : { height: stageHeight }}
      >
        {!isPreviewLoading && renderWidth && stageHeight ? (
          <PreviewStage
            srcdoc={hasInlineCode ? srcdoc : undefined}
            src={iframeSrc}
            reloadKey={reloadKey}
            title={`${animation.title} preview`}
            renderWidth={renderWidth}
            scale={scale}
            stageHeight={stageHeight}
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-12">
      <div className="bg-foreground/[0.04] p-12">
        <div
          ref={stageContainerRef}
          className="relative flex w-full justify-center overflow-hidden bg-background"
          style={{ height: stageHeight }}
        >
          {isPreviewLoading || !renderWidth ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-body-sm text-foreground-muted">Loading preview...</p>
            </div>
          ) : (
            <PreviewStage
              srcdoc={hasInlineCode ? srcdoc : undefined}
              src={iframeSrc}
              reloadKey={reloadKey}
              title={`${animation.title} preview`}
              renderWidth={renderWidth}
              scale={scale}
              stageHeight={stageHeight}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="hidden lg:block">
          <Select
            value={activePresetId}
            onChange={(id) => {
              const found = VIEWPORT_PRESETS.find((preset) => preset.id === id);
              if (found) setViewportWidth(found.w);
            }}
            options={VIEWPORT_PRESETS.map((preset) => ({
              value: preset.id,
              label: preset.label,
              icon: preset.Icon
            }))}
            size="sm"
            labelSize="xs"
            ariaLabel="Viewport size"
          />
        </div>

        <div className="flex items-center gap-8">
          {isScaledDown && (
            <span
              className="text-accent-2xs flex h-32 items-center bg-foreground/[0.06] px-8 text-foreground-muted"
              title={`Rendering at ${renderWidth}px, scaled to fit ${containerWidth}px container`}
            >
              {scalePercent}% scale
            </span>
          )}

          {previewVideoUrl && (
            <button
              type="button"
              onClick={handleDownloadClip}
              disabled={isDownloading}
              aria-label="Download clip"
              title="Download a short clip of this component as an mp4"
              className="text-accent-2xs flex h-32 items-center gap-6 bg-foreground/[0.06] px-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.1] hover:text-foreground disabled:opacity-60"
            >
              <DownloadSimple size={14} />
              <span className="hidden lg:inline">{isDownloading ? "Downloading" : "Download clip"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReplay}
            aria-label="Replay"
            className="text-accent-2xs flex h-32 items-center gap-6 bg-foreground px-10 text-background transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) hover:opacity-90"
            title="Replay (R)"
          >
            <ArrowClockwise size={14} />
            <span className="hidden lg:inline">Replay</span>
            <kbd className="text-[9px] ml-4 hidden bg-background/15 px-4 py-1 font-mono text-background/80 lg:inline-block">
              R
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            aria-label="Fullscreen"
            className="text-accent-2xs flex h-32 items-center gap-6 border border-foreground/15 px-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground"
            title="Fullscreen (F)"
          >
            <ArrowsOut size={14} />
            <span className="hidden lg:inline">Fullscreen</span>
            <kbd className="text-[9px] ml-4 hidden border border-foreground/15 px-4 py-1 font-mono text-foreground-muted lg:inline-block">
              F
            </kbd>
          </button>
        </div>
      </div>

      {isFullscreen && isMounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${animation.title} fullscreen preview`}
          className="fixed inset-0 z-[400] bg-background"
        >
          <div className="absolute bottom-16 right-16 z-10 flex items-center gap-8">
            <button
              type="button"
              onClick={handleReplay}
              aria-label="Replay"
              title="Replay (R)"
              className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
            >
              <ArrowClockwise size={14} />
              <span>Replay</span>
              <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">
                R
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleExitFullscreen}
              aria-label="Exit fullscreen"
              title="Close (Esc)"
              className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
            >
              <X size={14} />
              <span>Close</span>
              <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">
                Esc
              </kbd>
            </button>
          </div>

          {!isPreviewLoading && (
            <iframe
              key={`fs-${reloadKey}`}
              {...(hasInlineCode ? { srcDoc: srcdoc } : { src: iframeSrc })}
              title={`${animation.title} fullscreen preview`}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                display: "block"
              }}
            />
          )}
        </div>,
        document.body
      )}
    </section>
  );
}
