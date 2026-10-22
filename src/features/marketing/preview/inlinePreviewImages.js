'use client';

import { useState, useEffect, useMemo } from 'react';
import { buildRunnerScript, SHORTCUT_FORWARDER_SCRIPT } from '@/features/marketing/preview/sandboxScripts';

const VALID_TEMPLATES = new Set([
  "instant",
  "compact",
  "scroll-text",
  "scroll-cover",
  "menu",
  "shader",
  "shader-scroll",
  "full-page"
]);

const FALLBACK_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Animation Preview</title>
  <style>
    body { background:#0a0a0a; color:#fafafa; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:3rem; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    {{ANIMATION_CSS}}
  </style>
</head>
<body>
  {{ANIMATION_HTML}}
  {{ANIMATION_SCRIPTS}}
</body>
</html>`;

export async function inlinePreviewImages(html) {
  if (!html) return html;
  const matches = [...html.matchAll(/(?:src|data-anm-image(?:-\d+)?)="(\/preview-assets\/[^"]+)"/g)];
  let result = html;

  for (const match of matches) {
    const assetUrl = match[1];
    const fullAttr = match[0];
    const attrName = fullAttr.split("=")[0];
    try {
      const response = await fetch(assetUrl);
      if (!response.ok) continue;
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      result = result.replace(fullAttr, `${attrName}="${dataUrl}"`);
    } catch (err) {
      console.warn(`Failed to convert image ${assetUrl} to base64:`, err);
    }
  }
  return result;
}

export function parseDependencies(deps) {
  if (!deps) return [];
  if (Array.isArray(deps)) return deps;
  if (typeof deps === "object" && deps !== null) {
    const keys = Object.keys(deps);
    return keys.length > 0 ? keys : [];
  }
  if (typeof deps === "string") {
    try {
      const parsed = JSON.parse(deps);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) {
        const keys = Object.keys(parsed);
        return keys.length > 0 ? keys : [];
      }
    } catch {
      return deps.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function resolveTemplateName({ metadata, category, animationName = "", compact = false } = {}) {
  const customTemplate = metadata?.previewTemplate || metadata?.sandbox_template;
  if (customTemplate && VALID_TEMPLATES.has(customTemplate)) {
    return customTemplate;
  }
  const lowerName = (animationName || "").toLowerCase();
  if (category === "shader") {
    return lowerName.includes("scroll") ? "shader-scroll" : "shader";
  }
  if (category === "scroll") {
    return lowerName.includes("text") ? "scroll-text" : "scroll-cover";
  }
  if (lowerName.includes("menu") || metadata?.type === "menu") {
    return "menu";
  }
  return compact ? "compact" : "instant";
}

function isPreviewFullWidth({ metadata, category } = {}) {
  if (typeof metadata?.previewFullWidth === "boolean") {
    return metadata.previewFullWidth;
  }
  return category !== "button";
}

function assembleSrcdoc({
  templateHtml,
  processedHtmlCode,
  cssCode,
  jsCode,
  dependencies,
  animationName,
  animationDescription,
  category,
  metadata
}) {
  const fullWidth = isPreviewFullWidth({ metadata, category });
  let doc = templateHtml;

  if (fullWidth) {
    doc = doc
      .replace('class="preview-container"', 'class="preview-container is-fullwidth"')
      .replace('class="animation-container"', 'class="animation-container is-fullwidth"')
      .replace('class="preview-animation"', 'class="preview-animation is-fullwidth"');
  }

  const scriptsBlock = jsCode && jsCode.trim() !== ""
    ? buildRunnerScript({
        jsCode,
        dependencies,
        category,
        forwardKeysScript: SHORTCUT_FORWARDER_SCRIPT
      })
    : `<script>console.log('[preview] CSS-only animation loaded');</script>${SHORTCUT_FORWARDER_SCRIPT}`;

  return doc
    .replace(/\{\{ANIMATION_NAME\}\}/g, () => animationName)
    .replace(/\{\{ANIMATION_DESCRIPTION\}\}/g, () => animationDescription)
    .replace(/\{\{ANIMATION_HTML\}\}/g, () => processedHtmlCode || '<div class="demo-text">No preview available</div>')
    .replace(/\{\{ANIMATION_CSS\}\}/g, () => cssCode || "")
    .replace(/\{\{ANIMATION_SCRIPTS\}\}/g, () => scriptsBlock);
}

export function useSandboxSrcdoc({
  animationName = "Animation Preview",
  animationDescription = "",
  category = "instant",
  layout,
  htmlCode = "",
  cssCode = "",
  jsCode = "",
  dependencies = [],
  compact = false,
  metadata = null
}) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [processedHtmlCode, setProcessedHtmlCode] = useState("");
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [isHtmlLoading, setIsHtmlLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTemplate() {
      try {
        let templateName = resolveTemplateName({
          metadata,
          category,
          animationName,
          compact
        });

        if (
          !metadata?.previewTemplate &&
          !metadata?.sandbox_template &&
          layout === "full-viewport" &&
          (templateName === "instant" || templateName === "compact")
        ) {
          templateName = "menu";
        }

        const response = await fetch(`/animations/templates/${templateName}.html`);
        const text = await response.text();
        if (!isCancelled) {
          setTemplateHtml(text);
        }
      } catch (err) {
        console.error("Failed to load template:", err);
        if (!isCancelled) {
          setTemplateHtml(FALLBACK_TEMPLATE);
        }
      } finally {
        if (!isCancelled) {
          setIsTemplateLoading(false);
        }
      }
    }

    fetchTemplate();
    return () => {
      isCancelled = true;
    };
  }, [category, animationName, compact, layout, metadata?.previewTemplate, metadata?.sandbox_template, metadata?.type]);

  useEffect(() => {
    let isCancelled = false;

    async function processHtml() {
      setIsHtmlLoading(true);
      const inlined = await inlinePreviewImages(htmlCode);
      if (!isCancelled) {
        setProcessedHtmlCode(inlined);
        setIsHtmlLoading(false);
      }
    }

    if (htmlCode) {
      processHtml();
    } else {
      setProcessedHtmlCode("");
      setIsHtmlLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [htmlCode]);

  const srcdoc = useMemo(() => {
    if (!templateHtml) return "";
    return assembleSrcdoc({
      templateHtml,
      processedHtmlCode,
      cssCode,
      jsCode,
      dependencies,
      animationName,
      animationDescription,
      category,
      metadata
    });
  }, [templateHtml, processedHtmlCode, cssCode, jsCode, animationName, animationDescription, dependencies, category, metadata]);

  return {
    srcdoc,
    isLoading: isTemplateLoading || isHtmlLoading
  };
}
