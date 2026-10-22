'use client';

// NOTE: Extracted from module id: 758001
// Variable Mappings:
// E, j, L, A, V, Z -> Constants & math for the grid layout and lens effect
// N, P, R -> Vertex and Fragment Shaders (GLSL)
// S -> getHoveredCell, k -> checkHoverBounds, F -> moduloHelper
// T -> GridCanvas (WebGL rendering), I -> GridFallback (CSS grid), $ -> HeroGrid (Main wrapper)

import React, { useRef, useState, useEffect, useContext, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { gsap } from '@/libs/utils/vendor';
import RouterContext from '@/providers/contexts/RouterContext';
import { loadSharedImage } from '@/libs/utils/loadSharedImage'; // Assuming this utility exists
import { getSansFamily, GLASS_GLSL_FUNCTIONS } from '@/features/webgl/GlassCarousel'; // Reusing from the GlassCarousel

// --- CONSTANTS ---
const ITEM_HEIGHT = Math.round(538 / (1280 / 804));
const Y_OFFSET = (444 - ITEM_HEIGHT) / 2;
const CELL_RATIO = 640 / 444;
const LENS_PARAMS = [0.12, 0.07, 0.035, 0.03];
const EXPO_OUT = gsap.parseEase('expo.out');
const EMPTY_HOVER = { x: 1e6, y: 1e6, t: 0, on: false, item: -1 };

// --- SHADERS ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const gridFragmentShader = `
  uniform sampler2D uAtlas;
  uniform sampler2D uVideo;
  uniform float uHasAtlas;
  uniform float uVideoOn;
  uniform vec2 uRes;
  uniform vec2 uCell;   
  uniform vec2 uPan;    
  uniform vec4 uLens;   
  uniform vec4 uHoverA; 
  uniform vec4 uHoverB; 
  uniform vec4 uMedia;  
  uniform vec3 uBg;
  uniform vec2 uSlots;  
  uniform float uCount;
  uniform float uStride;
  varying vec2 vUv;

  vec2 lens(vec2 s) {
    vec2 s2 = s * s;
    return vec2(
      s.x * (1.0 + uLens.z * s2.x) / (1.0 + uLens.y * s2.y),
      s.y * (1.0 + uLens.w * s2.y) / (1.0 + uLens.x * s2.x)
    );
  }

  float hoverAt(vec2 ci, vec4 h) {
    vec2 d = abs(ci - h.xy);
    return (d.x < 0.5 && d.y < 0.5) ? h.z : 0.0;
  }

  void main() {
    vec2 s = (vUv - 0.5) * 2.0 * vec2(uRes.x / uRes.y, 1.0);
    vec2 cell = lens(s) / uCell - uPan;
    vec2 ci = floor(cell);
    vec2 lc = cell - ci; 
    float ha = hoverAt(ci, uHoverA);
    float h = max(ha, hoverAt(ci, uHoverB));

    vec2 m = (lc - uMedia.xy) / (uMedia.zw - uMedia.xy);
    float inMedia = step(0.0, m.x) * step(m.x, 1.0) * step(0.0, m.y) * step(m.y, 1.0);
    vec2 mz = 0.5 + (m - 0.5) / (1.0 + 0.04 * h);

    vec3 c = uBg;
    if (uHasAtlas > 0.5) {
      float idx = mod(ci.x + uStride * ci.y, uCount);
      vec2 slot = vec2(mod(idx, uSlots.x), floor(idx / uSlots.x));
      vec2 lu = inMedia > 0.5 ? uMedia.xy + mz * (uMedia.zw - uMedia.xy) : lc;
      lu = clamp(lu, 0.002, 0.998);
      c = texture2D(uAtlas, vec2((slot.x + lu.x) / uSlots.x, 1.0 - (slot.y + 1.0 - lu.y) / uSlots.y)).rgb;
    }
    if (ha > 0.0 && uVideoOn > 0.5 && inMedia > 0.5) c = texture2D(uVideo, mz).rgb;

    c += (1.0 - inMedia) * h * (0.08 + 0.1 * (1.0 - lc.y));

    vec2 fw = max(fwidth(cell), vec2(1e-5));
    vec2 edge = min(lc, 1.0 - lc) / fw;
    float line = 1.0 - smoothstep(0.0, 1.0, min(edge.x, edge.y));
    c = mix(c, vec3(1.0), 0.07 * line);

    gl_FragColor = vec4(c, 1.0);
  }
`;

const postFragmentShader = `
  #define FALL_FROM 0.12
  #define GLASS_FALL 0.18
  #define GRAD_START 0.80
  #define GRAD_END 0.10
  
  uniform sampler2D tScene;
  uniform vec2 uRes;
  uniform float uCopyEnd;
  uniform float uFade;
  uniform vec3 uBg;
  varying vec2 vUv;
  
  ${GLASS_GLSL_FUNCTIONS}

  void main() {
    vec4 col = texture2D(tScene, vUv);
    float y = 1.0 - vUv.y; 
    float t = clamp((y - uCopyEnd + FALL_FROM) / (FALL_FROM + GLASS_FALL), 0.0, 1.0);
    float r = 1.0 - smoothstep(0.0, 1.0, pow(t, 1.5));
    
    if (r > 0.001) {
      vec4 frosted = frost(vUv, 14.0 * r);
      frosted.rgb = mix(frosted.rgb, frosted.rgb * 0.92 + 0.04 * frosted.a, 0.5 * r);
      col = mix(col, frosted, smoothstep(0.0, 0.1, r));
    }
    
    float gt = clamp((GRAD_START - y) / (GRAD_START - GRAD_END), 0.0, 1.0);
    col.rgb = mix(col.rgb, uBg, 1.0 - (1.0 - gt) * (1.0 - gt));
    col.rgb = mix(col.rgb, uBg, 0.55 * smoothstep(0.6, 1.4, length((vUv - 0.5) * 2.0)));
    
    gl_FragColor = vec4(mix(uBg, col.rgb, uFade), 1.0);
  }
`;

// --- MATH HELPERS ---
function getHoveredCell(state, pointerU, pointerV) {
  const r = (pointerU - 0.5) * 2 * (state.w / state.h);
  const l = (pointerV - 0.5) * 2;
  const r2 = r * r;
  const l2 = l * l;
  const lens = state.lens;
  const ix = (r * (1 + lens[2] * r2)) / (1 + lens[1] * l2);
  const iy = (l * (1 + lens[3] * l2)) / (1 + lens[0] * r2);
  return {
    x: Math.floor(ix / state.cell.x - state.panU.x),
    y: Math.floor(iy / state.cell.y - state.panU.y),
  };
}

const checkHoverBounds = (state, pointerV) => {
  const t = Math.min(1, Math.max(0, (1 - pointerV - state.copyEnd + 0.12) / 0.3)) ** 1.5;
  return 1 - t * t * (3 - 2 * t);
};

const moduloHelper = (cell, count) => (((cell.x + 3 * cell.y) % count) + count) % count;

// --- SUB-COMPONENT: GridCanvas (WebGL) ---
function GridCanvas({ items, state, active }) {
  const { gl, size } = useThree();
  const count = items.length;
  const rows = Math.ceil(count / 4);
  const videosRef = useRef([]);

  const sceneObjects = useMemo(() => {
    const computedStyle = getComputedStyle(gl.domElement);
    const getVar = (name, fallback) => computedStyle.getPropertyValue(name).trim() || fallback;
    const colors = { bg: getVar('--background', '#141314'), fg: getVar('--foreground', '#eeeeee') };

    const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    const quad = new THREE.PlaneGeometry(2, 2);

    const bgColorHex = parseInt((/^#([0-9a-f]{6})$/i.exec(colors.bg) || [null, '141314'])[1], 16);
    const bgVec = new THREE.Vector3(((bgColorHex >> 16) & 255) / 255, ((bgColorHex >> 8) & 255) / 255, (255 & bgColorHex) / 255);

    const gridMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: gridFragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uAtlas: { value: null },
        uVideo: { value: null },
        uHasAtlas: { value: 0 },
        uVideoOn: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uCell: { value: new THREE.Vector2(1, 1) },
        uPan: { value: new THREE.Vector2() },
        uLens: { value: new THREE.Vector4(...LENS_PARAMS) },
        uHoverA: { value: new THREE.Vector4(EMPTY_HOVER.x, EMPTY_HOVER.y, 0, 0) },
        uHoverB: { value: new THREE.Vector4(EMPTY_HOVER.x, EMPTY_HOVER.y, 0, 0) },
        uMedia: { value: new THREE.Vector4(0.0796875, Y_OFFSET / 444, 0.9203125, (Y_OFFSET + ITEM_HEIGHT) / 444) },
        uBg: { value: bgVec },
        uSlots: { value: new THREE.Vector2(4, rows) },
        uCount: { value: count },
        uStride: { value: 3 },
      },
    });

    const postMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: postFragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: rt.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uCopyEnd: { value: 0.5 },
        uFade: { value: 0 },
        uBg: { value: bgVec },
      },
    });

    const createMesh = (mat) => {
      const mesh = new THREE.Mesh(quad, mat);
      mesh.frustumCulled = false;
      return mesh;
    };

    const gridScene = new THREE.Scene();
    gridScene.add(createMesh(gridMat));

    const postScene = new THREE.Scene();
    postScene.add(createMesh(postMat));

    return { rt, quad, grid: gridMat, post: postMat, gridScene, postScene, colors, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, [gl, count, rows]);

  useEffect(() => {
    return () => {
      sceneObjects.rt.dispose();
      sceneObjects.quad.dispose();
      sceneObjects.grid.dispose();
      sceneObjects.post.dispose();
    };
  }, [sceneObjects]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    sceneObjects.rt.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr));
    sceneObjects.grid.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
    sceneObjects.post.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);

    const s = state.current;
    s.w = size.width;
    s.h = size.height;

    const ratio = size.width / size.height;
    s.cellPx = size.width * (ratio < 1 ? 0.62 : ratio < 1.3 ? 0.36 : 0.26);
  }, [size, gl, sceneObjects, state]);

  useEffect(() => {
    let isMounted = true;
    let texture = null;

    const imagePromises = items.map((item) => loadSharedImage(item.image, { maxWidth: 720 }).catch(() => null));

    Promise.all([document.fonts.ready, ...imagePromises]).then(([, ...loadedImages]) => {
      if (!isMounted) return;

      const canvas = document.createElement('canvas');
      canvas.width = 2560;
      canvas.height = 444 * rows;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = sceneObjects.colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `500 19px ${getSansFamily()}`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = sceneObjects.colors.fg;

      items.forEach((item, i) => {
        const x = (i % 4) * 640;
        const y = 444 * Math.floor(i / 4);
        const img = loadedImages[i];

        if (img) {
          const scaleX = Math.max(538 / img.width, ITEM_HEIGHT / img.height);
          const dw = 538 / scaleX;
          const dh = ITEM_HEIGHT / scaleX;
          ctx.save();
          ctx.translate(x + 51, y + Y_OFFSET + ITEM_HEIGHT);
          ctx.scale(1, -1);
          ctx.drawImage(img, (img.width - dw) / 2, (img.height - dh) / 2, dw, dh, 0, 0, 538, ITEM_HEIGHT);
          ctx.restore();
        }
        ctx.fillText(item.title, x + 51, y + Y_OFFSET + ITEM_HEIGHT + Y_OFFSET / 2);
      });

      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.NoColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;

      sceneObjects.grid.uniforms.uAtlas.value = texture;
      sceneObjects.grid.uniforms.uHasAtlas.value = 1;
    });

    return () => {
      isMounted = false;
      texture?.dispose();
    };
  }, [items, sceneObjects, rows]);

  useEffect(() => {
    return () => {
      videosRef.current.forEach((v) => {
        if (v) {
          v.v.pause();
          v.v.removeAttribute('src');
          v.v.load();
          v.tex.dispose();
        }
      });
      videosRef.current = [];
    };
  }, [items]);

  useFrame((time, delta) => {
    const s = state.current;
    const d = Math.min(delta, 0.1);
    const frameRateFactor = 60 * d;

    if (!s.reduce) {
      s.pan.x += 0.05 * d;
    }

    if (!s.dragging) {
      s.pan.x += s.vel.x * frameRateFactor;
      s.pan.y += s.vel.y * frameRateFactor;
      const friction = Math.pow(0.94, frameRateFactor);
      s.vel.x *= friction;
      s.vel.y *= friction;
    }

    const velocityHypot = Math.hypot(s.vel.x, s.vel.y);
    s.bend += (1 + Math.min(0.6, 6 * velocityHypot) - s.bend) * (1 - Math.pow(0.9, frameRateFactor));

    const leanFriction = 1 - Math.pow(0.95, frameRateFactor);
    s.lean.x += (s.leanTo.x - s.lean.x) * leanFriction;
    s.lean.y += (s.leanTo.y - s.lean.y) * leanFriction;

    let lensFactor = 1,
      lensX = 0,
      lensY = 0,
      fade = 1;

    if (s.intro) {
      if (s.introT == null) {
        fade = 0;
      } else {
        s.introT += d;
        const introEase = EXPO_OUT(Math.min(1, s.introT / 1.6));
        lensFactor = 0.7 + 0.3 * introEase;
        lensX = 1.6 * (1 - introEase);
        lensY = -0.6 * (1 - introEase);
        fade = EXPO_OUT(Math.min(1, s.introT / 0.6));
        if (s.introT >= 1.6) s.intro = false;
      }
    }

    const scrollFactor = s.reduce ? 1 : 1 - s.scrollP;
    fade *= 1 - 0.5 * Math.min(1, s.scrollP / 0.35);

    for (let i = 0; i < 4; i++) {
      s.lens[i] = LENS_PARAMS[i] * (s.bend + lensX) * scrollFactor;
    }

    s.cell.x = (s.cellPx * lensFactor) / (s.h / 2);
    s.cell.y = s.cell.x / CELL_RATIO;
    s.panU.x = s.pan.x + s.lean.x;
    s.panU.y = s.pan.y + s.lean.y + lensY;

    let hoveredCell = null;
    if (!s.dragging && !s.intro) {
      if (s.touch) {
        if (velocityHypot < 0.004) {
          hoveredCell = getHoveredCell(s, 0.5, (1 - s.copyEnd - 0.18) / 2);
        }
      } else if (s.pointer && checkHoverBounds(s, s.pointer.v) < 0.3) {
        hoveredCell = getHoveredCell(s, s.pointer.u, s.pointer.v);
      }
    }

    const currentHoverA = s.hoverA;
    if (hoveredCell ? !currentHoverA.on || hoveredCell.x !== currentHoverA.x || hoveredCell.y !== currentHoverA.y : currentHoverA.on) {
      s.hoverB = currentHoverA;
      s.hoverA = hoveredCell
        ? { x: hoveredCell.x, y: hoveredCell.y, t: 0, on: true, item: moduloHelper(hoveredCell, count) }
        : { ...EMPTY_HOVER };
      if (s.setCursor) s.setCursor(!!hoveredCell && !s.touch);
    }

    const hoverFriction = 1 - Math.pow(0.82, frameRateFactor);
    s.hoverA.t += (!!s.hoverA.on - s.hoverA.t) * hoverFriction;
    s.hoverB.t -= s.hoverB.t * hoverFriction;

    const activeItem = s.hoverA.on && active && !s.reduce ? s.hoverA.item : -1;

    if (activeItem !== s.playing) {
      if (s.playing >= 0 && videosRef.current[s.playing]) {
        videosRef.current[s.playing].v.pause();
      }
      s.playing = -1;

      let newVideo = null;
      if (activeItem >= 0) {
        let vObj = videosRef.current[activeItem];
        if (!vObj && items[activeItem]?.video) {
          const vid = document.createElement('video');
          vid.crossOrigin = 'anonymous';
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.preload = 'auto';
          vid.src = items[activeItem].video;
          const tex = new THREE.VideoTexture(vid);
          tex.colorSpace = THREE.NoColorSpace;
          vObj = { v: vid, tex, ready: false };
          vid.addEventListener('loadeddata', () => (vObj.ready = true), { once: true });
          videosRef.current[activeItem] = vObj;
        }
        newVideo = vObj;
      }

      if (newVideo) {
        newVideo.v.currentTime = 0;
        newVideo.v.play().catch(() => {});
        s.playing = activeItem;
      }
    }

    const activeVideoObj = s.playing >= 0 ? videosRef.current[s.playing] : null;
    const gridUniforms = sceneObjects.grid.uniforms;
    gridUniforms.uVideoOn.value = activeVideoObj?.ready ? 1 : 0;
    if (activeVideoObj?.ready) {
      gridUniforms.uVideo.value = activeVideoObj.tex;
    }

    gridUniforms.uLens.value.fromArray(s.lens);
    gridUniforms.uCell.value.set(s.cell.x, s.cell.y);
    gridUniforms.uPan.value.set(s.panU.x, s.panU.y);
    gridUniforms.uHoverA.value.set(s.hoverA.x, s.hoverA.y, s.hoverA.t, 0);
    gridUniforms.uHoverB.value.set(s.hoverB.x, s.hoverB.y, s.hoverB.t, 0);

    const postUniforms = sceneObjects.post.uniforms;
    postUniforms.uCopyEnd.value = s.copyEnd;
    postUniforms.uFade.value = fade;

    gl.setRenderTarget(sceneObjects.rt);
    gl.render(sceneObjects.gridScene, sceneObjects.cam);
    gl.setRenderTarget(null);
    gl.render(sceneObjects.postScene, sceneObjects.cam);
  }, 1);

  return null;
}

// --- SUB-COMPONENT: GridFallback (CSS Grid for non-WebGL) ---
function GridFallback({ items, copyEnd }) {
  return (
    <>
      <div className="absolute inset-0 grid grid-cols-2 content-center gap-px overflow-hidden lg:grid-cols-4">
        {items.map((item) => (
          <img
            key={item.slug}
            src={item.image}
            alt=""
            className="block aspect-[1280/804] object-cover"
            style={{ width: '100%', height: '100%' }}
          />
        ))}
      </div>
      <div
        className="absolute inset-x-0 top-0 bg-linear-to-b from-background via-background/90 to-transparent"
        style={{ height: `${(copyEnd + 0.18) * 100}%` }}
      />
    </>
  );
}

// --- MAIN COMPONENT: HeroGrid ---
export default function HeroGrid({ items = [], onIntro, glassRef, className = '' }) {
  const containerRef = useRef(null);
  const router = useContext(RouterContext);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [copyEndMargin, setCopyEndMargin] = useState(0.45);

  const stateRef = useRef({
    pan: { x: -0.5, y: -0.5 },
    panU: { x: -0.5, y: -0.5 },
    vel: { x: 0, y: 0 },
    lean: { x: 0, y: 0 },
    leanTo: { x: 0, y: 0 },
    cell: { x: 1, y: 1 },
    lens: [...LENS_PARAMS],
    bend: 1,
    w: 1,
    h: 1,
    cellPx: 300,
    copyEnd: 0.45,
    scrollP: 0,
    dragging: false,
    pointer: null,
    touch: false,
    reduce: false,
    intro: !!onIntro,
    introT: null,
    hoverA: { ...EMPTY_HOVER },
    hoverB: { ...EMPTY_HOVER },
    playing: -1,
  });

  stateRef.current.copyEnd = copyEndMargin;

  useEffect(() => {
    try {
      if (!document.createElement('canvas').getContext('webgl2')) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
    stateRef.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stateRef.current.touch = window.matchMedia('(hover: none)').matches;
    stateRef.current.setCursor = (cursor) => {
      if (containerRef.current) {
        containerRef.current.style.cursor = cursor ? 'pointer' : '';
      }
    };
  }, []);

  useEffect(() => {
    if (!onIntro) return;
    const s = stateRef.current;
    onIntro(() => {
      if (s.reduce) s.intro = false;
      else s.introT = 0;
    });
  }, [onIntro]);

  useEffect(() => {
    const container = containerRef.current;
    const glassEl = glassRef?.current;
    if (!container || !glassEl) return;

    const observer = new ResizeObserver(() => {
      const h = container.offsetHeight || 1;
      setCopyEndMargin(Math.min(0.8, (glassEl.offsetTop + glassEl.offsetHeight) / h));
    });

    observer.observe(container);
    observer.observe(glassEl);
    return () => observer.disconnect();
  }, [glassRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasWebGL) return;

    const s = stateRef.current;
    let startX = 0,
      startY = 0,
      lastTime = 0,
      lastX = 0,
      lastY = 0,
      elLeft = 0,
      elTop = 0;

    const updateBounds = () => {
      const rect = el.getBoundingClientRect();
      elLeft = rect.left;
      elTop = rect.top + window.scrollY;
    };
    updateBounds();

    const getPointerUV = (e) => ({
      u: (e.clientX - elLeft) / s.w,
      v: 1 - (e.clientY - (elTop - window.scrollY)) / s.h,
    });

    const onPointerDown = (e) => {
      s.dragging = true;
      s.vel.x = 0;
      s.vel.y = 0;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      lastTime = performance.now();
    };

    const onPointerMove = (e) => {
      if (!s.dragging) {
        if (e.pointerType === 'mouse' && el.contains(e.target)) {
          s.pointer = getPointerUV(e);
          s.leanTo.x = -0.06 * (2 * (s.pointer.u - 0.5));
          s.leanTo.y = -0.06 * (2 * (s.pointer.v - 0.5));
        }
        return;
      }

      const now = performance.now();
      const dx = (e.clientX - startX) / s.cellPx;
      const dy = s.touch ? 0 : -(e.clientY - startY) / (s.cellPx / CELL_RATIO);

      s.pan.x += dx;
      s.pan.y += dy;

      const frameRateFactor = 1000 / 60 / Math.max(1, now - lastTime);
      s.vel.x = dx * frameRateFactor;
      s.vel.y = dy * frameRateFactor;

      startX = e.clientX;
      startY = e.clientY;
      lastTime = now;
    };

    const onPointerUp = () => (s.dragging = false);
    const onPointerLeave = () => {
      s.pointer = null;
      s.leanTo.x = 0;
      s.leanTo.y = 0;
    };

    const onClick = (e) => {
      if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 6) return;
      const uv = getPointerUV(e);
      if (checkHoverBounds(s, uv.v) >= 0.3 || !items.length) return;

      const clickedItem = items[moduloHelper(getHoveredCell(s, uv.u, uv.v), items.length)];
      const url = `/animations/${clickedItem.slug}`;
      router?.push ? router.push(url) : window.location.assign(url);
    };

    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const sy = window.scrollY;
      s.pan.y -= ((sy - lastScrollY) / (s.cellPx / CELL_RATIO)) * 0.4;
      s.scrollP = Math.min(1, Math.max(0, (sy - elTop) / s.h));
      lastScrollY = sy;
    };

    s.scrollP = Math.min(1, Math.max(0, (lastScrollY - elTop) / el.offsetHeight));

    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(el);

    const io = new IntersectionObserver(([entry]) => setIsActive(entry.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(el);

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('click', onClick);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      io.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hasWebGL, items, router]);

  return (
    <div ref={containerRef} className={`absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing ${className}`}>
      {hasWebGL ? (
        <Canvas
          frameloop={isActive ? 'always' : 'never'}
          dpr={[1, 1.5]}
          gl={{ alpha: false, antialias: false, powerPreference: 'low-power' }}
          onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())}>
          <GridCanvas items={items} state={stateRef} active={isActive} />
        </Canvas>
      ) : (
        <GridFallback items={items} copyEnd={copyEndMargin} />
      )}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.slug}>
            <a href={`/animations/${item.slug}`}>{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
