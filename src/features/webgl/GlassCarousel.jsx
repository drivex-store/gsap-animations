'use client';

// NOTE: module id: 184422 (GlassCarousel / GLASS_GLSL)
// Variable Mapping:
// a -> gsap, r -> fiber (react-three-fiber), l -> drei/fiber, n -> useThree
// o -> THREE, i -> loadSharedImage, c -> useBreakpoint, u -> RouterContext, d -> Link, m -> Carousel3D
// j -> vertexShader, A -> fragmentShader, L -> postVertexShader, V -> glassFunctions, Z -> postFragmentShader
// N -> getSansFamily, P -> CarouselRing, H -> BRAND_COLOR

import React, { useRef, useState, useEffect, useMemo, useContext } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import Link from 'next/link';

// You might need to adjust these imports based on your actual project structure
import { gsap } from '@/libs/utils/vendor';
import { useBreakpoint } from '@/hooks/useBreakpoint'; // Assume exists based on module c
import RouterContext from '@/providers/contexts/RouterContext';
import Carousel3D from '@/components/animations/Carousel3D'; // Assume module m is a fallback
import { loadSharedImage } from '@/libs/utils/loadSharedImage'; // Assume module i

// --- CONSTANTS & MATH ---
const ASPECT_RATIO = 1280 / 804;
const VISIBLE_ANGLE = 86 * (Math.PI / 180);
const BEND_REACH = 115 * (Math.PI / 180);
const CYLINDER_RADIUS = 2.28;
const CAMERA_Z = 3.72;
const BRAND_COLOR = new THREE.Color("#fb460d");

// Helper to calculate slide density and positioning
let layoutCache = [];
function generateLayout(gapFunc) {
  const layout = [{ x: 0, z: -CYLINDER_RADIUS, psi: 0 }];
  let currentAngle = 0;
  let currentX = 0;
  let currentZ = -CYLINDER_RADIUS;
  
  const stepFactor = VISIBLE_ANGLE / Math.pow(2.28 * VISIBLE_ANGLE, 1);
  const getModPsi = (a) => stepFactor * Math.pow(Math.abs(a), 1);
  const getScale = (a) => 1 + 0.35 * Math.min(1, Math.abs(a) / VISIBLE_ANGLE);

  const getDelta = (t) => {
    let a = getModPsi(t);
    return getScale(a) + gapFunc(a);
  };

  for (let i = 1; i <= 512; i++) {
    let delta = getDelta(currentAngle + 0.5 * getDelta(currentAngle) / 64) / 64;
    let psi = getModPsi(currentAngle + delta / 2);
    currentX += Math.cos(psi) * delta;
    currentZ += Math.sin(psi) * delta;
    currentAngle += delta;
    layout.push({ x: currentX, z: currentZ, psi: getModPsi(currentAngle) });
  }
  layoutCache = layout;
}
generateLayout(() => 0.04);

const tempPos = { x: 0, z: 0, psi: 0 };
function getPositionAt(index) {
  const maxIdx = Math.min(64 * Math.abs(index), layoutCache.length - 1.001);
  const floorIdx = Math.floor(maxIdx);
  const remainder = maxIdx - floorIdx;
  const p1 = layoutCache[floorIdx];
  const p2 = layoutCache[floorIdx + 1];
  const sign = index < 0 ? -1 : 1;
  
  tempPos.x = sign * (p1.x + (p2.x - p1.x) * remainder);
  tempPos.z = p1.z + (p2.z - p1.z) * remainder;
  tempPos.psi = sign * (p1.psi + (p2.psi - p1.psi) * remainder);
  return tempPos;
}

// --- SHADERS ---
const vertexShader = `
  uniform float uPsi;
  uniform float uScale;
  uniform float uR;
  uniform float uEdgeScale;
  uniform float uVisible;
  uniform float uBendReach;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float t = position.x * uScale;
    float psi = uPsi + t / uR;
    vec3 bent = vec3(uR * sin(psi), 0.0, -uR * cos(psi));
    vec3 planar = vec3(uR * sin(uPsi) + t * cos(uPsi), 0.0, -uR * cos(uPsi) + t * sin(uPsi));
    float bend = smoothstep(0.0, 1.0, abs(uPsi) / uBendReach);
    vec3 p = mix(planar, bent, bend);
    float h = 1.0 + uEdgeScale * min(1.0, abs(atan(p.x, -p.z)) / uVisible);
    p.y = position.y * h;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform sampler2D uOverlay;
  uniform float uHasMap;
  uniform float uHasOverlay;
  uniform float uAlpha;
  uniform float uAspect;
  uniform float uRadius;
  uniform vec3 uBrand;
  varying vec2 vUv;

  void main() {
    vec3 c = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(0.08);
    if (uHasOverlay > 0.5) {
      vec4 ov = texture2D(uOverlay, vUv);
      c = mix(c, ov.rgb, ov.a);
    }
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 q = abs(p) - (vec2(uAspect, 1.0) * 0.5 - uRadius);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float a = 1.0 - smoothstep(-0.003, 0.003, sd);
    gl_FragColor = vec4(c, a * uAlpha);
  }
`;

const postVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const GLASS_GLSL_FUNCTIONS = `
  vec4 smear(vec2 uv, vec2 dir, float spread) {
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 12; i++) {
      float k = float(i) / 11.0 - 0.5;
      acc += texture2D(tScene, uv + dir * k * spread);
    }
    return acc / 12.0;
  }

  vec4 frost(vec2 uv, float radiusPx) {
    vec4 acc = texture2D(tScene, uv);
    float wsum = 1.0;
    for (int i = 1; i < 32; i++) {
      float fi = float(i);
      float rr = sqrt(fi / 31.0);
      float a = fi * 2.39996;
      vec2 o = vec2(cos(a), sin(a)) * rr * radiusPx / uRes;
      float w = 1.0 - 0.6 * rr;
      acc += texture2D(tScene, uv + o) * w;
      wsum += w;
    }
    return acc / wsum;
  }

  float glassH(vec2 p) {
    return sin(p.x * 7.0 + sin(p.y * 4.0) * 1.5) * 0.5 + sin(p.y * 9.0 - p.x * 3.0) * 0.5;
  }
`;

const postFragmentShader = `
  uniform sampler2D tScene;
  uniform vec2 uRes;
  uniform float uGlass;
  varying vec2 vUv;
  ${GLASS_GLSL_FUNCTIONS}

  void main() {
    float aspect = uRes.x / uRes.y;
    float side = sign(vUv.x - 0.5);
    float dx = abs(vUv.x - 0.5);

    float dE = (0.5 - dx) * aspect;
    float r = 1.0 - clamp(dE / 0.2, 0.0, 1.0); 
    float g = r * uGlass;
    float g2 = r * r * r * uGlass;

    vec4 col = texture2D(tScene, vUv);
    if (g > 0.001) {
      vec2 uv = vUv;
      uv.x -= side * 0.035 * g2; 
      uv.y = 0.5 + (vUv.y - 0.5) / (1.0 + 0.14 * g2); 
      vec2 q = vUv * vec2(aspect, 1.0);
      float e = 0.002;
      vec2 slope = vec2(glassH(q + vec2(e, 0.0)) - glassH(q - vec2(e, 0.0)), glassH(q + vec2(0.0, e)) - glassH(q - vec2(0.0, e))) / (2.0 * e);
      uv += slope * 0.004 * g;
      vec4 frosted = 0.7 * frost(uv, 42.0 * g) + 0.3 * smear(uv, vec2(side, 0.0), 0.06 * g2);
      frosted.rgb = mix(frosted.rgb, frosted.rgb * 0.88 + 0.07 * frosted.a, 0.6 * g);
      col = mix(col, frosted, smoothstep(0.0, 0.1, g));
    }
    gl_FragColor = col;
  }
`;

const PLANE_GEO = new THREE.PlaneGeometry(1, 1 / ASPECT_RATIO, 48, 1);

export function getSansFamily() {
  if (typeof document === 'undefined') return "system-ui, sans-serif";
  const el = document.createElement("span");
  el.style.fontFamily = "var(--font-sans)";
  document.body.appendChild(el);
  const ff = getComputedStyle(el).fontFamily;
  document.body.removeChild(el);
  return ff || "system-ui, sans-serif";
}

// --- SUB COMPONENT: CarouselRing ---
function CarouselRing({ ring, state, glass, pickRef, active }) {
  const { gl, camera, size } = useThree();
  const meshesRef = useRef([]);
  const activeSlidesRef = useRef([]);
  
  const materials = useMemo(() => 
    ring.map(() => new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      uniforms: {
        uMap: { value: null },
        uOverlay: { value: null },
        uHasMap: { value: 0 },
        uHasOverlay: { value: 0 },
        uAlpha: { value: 1 },
        uAspect: { value: ASPECT_RATIO },
        uPsi: { value: 0 },
        uScale: { value: 1 },
        uR: { value: CYLINDER_RADIUS },
        uEdgeScale: { value: 0.35 },
        uVisible: { value: VISIBLE_ANGLE },
        uBendReach: { value: 0.45614 }, // approx 1/CYLINDER_RADIUS
        uRadius: { value: 0 },
        uBrand: { value: BRAND_COLOR }
      }
    })
  ), [ring]);

  const texturesRef = useRef([]);
  const videosRef = useRef([]);
  const hasVideoLoaded = useRef([]);

  const postProcess = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const mat = new THREE.ShaderMaterial({
      vertexShader: postVertexShader,
      fragmentShader: postFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: rt.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uGlass: { value: 1 }
      }
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { rt, mat, scene, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  // Update layout and camera based on window size
  useEffect(() => {
    const calcZ = (a, b) => b * (CAMERA_Z * Math.cos(a) + CYLINDER_RADIUS) / Math.pow(CAMERA_Z + CYLINDER_RADIUS * Math.cos(a), 2);
    let gapFunc = () => 0.04;
    let fov = 1;
    let edgePsi = 0;
    
    for (let i = 0; i < 4; i++) {
      generateLayout(gapFunc);
      const psi = getPositionAt(2).psi;
      edgePsi = psi - gapFunc(psi) / 2 / CYLINDER_RADIUS;
      fov = CYLINDER_RADIUS * Math.sin(edgePsi) / (CAMERA_Z - -CYLINDER_RADIUS * Math.cos(edgePsi)) / 1.33;
      const hw = size.width / 2 / fov;
      gapFunc = (t) => 8 / calcZ(t, hw);
    }
    generateLayout(gapFunc);
    
    state.current.edgePsi = edgePsi;
    state.current.gap0 = gapFunc(0);
    state.current.gapAt = gapFunc;
    
    camera.fov = 2 * Math.atan(fov / (size.width / size.height)) * 180 / Math.PI;
    camera.position.set(0, 0, CAMERA_Z);
    camera.updateProjectionMatrix();
    
    state.current.wpx = size.width / 2 * (0.16666666666666666 / fov);
    
    const dpr = gl.getPixelRatio();
    postProcess.rt.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr));
    postProcess.mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
  }, [size, camera, gl, postProcess, materials, state]);

  // Load Overlays & Images
  useEffect(() => {
    let isMounted = true;
    document.fonts.ready.then(() => {
      if (!isMounted) return;
      const font = getSansFamily();
      ring.forEach((item, i) => {
        const height = Math.round(640 / ASPECT_RATIO);
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0.62 * height, 0, height);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0.62 * height, 640, 0.38 * height);
        ctx.fillStyle = "#ffffff";
        ctx.font = `500 22px ${font}`;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(item.title, 22, height - 20);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.NoColorSpace;
        materials[i].uniforms.uOverlay.value = tex;
        materials[i].uniforms.uHasOverlay.value = 1;
      });
    });

    ring.forEach((item, i) => {
      if(item.image) {
          loadSharedImage(item.image, { maxWidth: 720 }).then(img => {
            if (!isMounted) return;
            const tex = new THREE.Texture(img);
            tex.flipY = false;
            tex.colorSpace = THREE.NoColorSpace;
            tex.needsUpdate = true;
            texturesRef.current[i] = tex;
            if (!hasVideoLoaded.current[i]) {
              materials[i].uniforms.uMap.value = tex;
              materials[i].uniforms.uHasMap.value = 1;
            }
          }).catch(() => {});
      }
    });

    return () => { isMounted = false; };
  }, [ring, materials]);

  // Load Videos
  useEffect(() => {
    const vids = ring.map((item, i) => {
      if (!item.video) return null;
      const vid = document.createElement("video");
      vid.crossOrigin = "anonymous";
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "none";
      vid.src = item.video;
      
      const tex = new THREE.VideoTexture(vid);
      tex.colorSpace = THREE.NoColorSpace;
      
      vid.addEventListener("loadeddata", () => {
        hasVideoLoaded.current[i] = true;
        materials[i].uniforms.uMap.value = tex;
        materials[i].uniforms.uHasMap.value = 1;
      }, { once: true });
      
      return { v: vid, tex };
    });
    
    videosRef.current = vids;
    
    return () => {
      vids.forEach(v => {
        if (v) {
          v.v.pause();
          v.v.removeAttribute("src");
          v.v.load();
          v.tex.dispose();
        }
      });
      videosRef.current = [];
      hasVideoLoaded.current = [];
    };
  }, [ring, materials]);

  // Handle active state
  useEffect(() => {
    if (!active) {
      videosRef.current.forEach(v => v?.v.pause());
    }
  }, [active]);

  // Render Loop
  useFrame((stateObj, delta) => {
    const s = state.current;
    const d = 60 * Math.min(delta, 0.1);
    
    if (s.autoplay && !s.reduce) {
      s.offset += s.speed * d / 60;
    }
    
    if (s.intro && s.introT != null) {
      s.introT += Math.min(delta, 0.1);
      if (s.introT > 7 + 2 * 3 * 0.08) {
        s.intro = false;
      }
    }
    
    if (!s.dragging && Math.abs(s.velocity) > 0.00002) {
      s.offset += s.velocity * d;
      s.velocity *= Math.pow(0.94, d);
    }

    const count = ring.length;
    meshesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pos = THREE.MathUtils.euclideanModulo(i + s.offset + count / 2, count) - count / 2;
      let introOffset = 0;
      
      if (s.intro) {
        introOffset = s.introT == null ? 7 : 7 * (1 - gsap.parseEase("expo.out")(THREE.MathUtils.clamp((s.introT - (3 - pos) * 0.08) / 1.6, 0, 1)));
      }
      
      const adjPos = pos - introOffset;
      const p1 = getPositionAt(adjPos - 0.5).psi;
      const p2 = getPositionAt(adjPos + 0.5).psi;
      const psi = (p1 + p2) / 2;
      const absPsi = Math.abs(psi);
      
      let isVis = true;
      if (s.intro) {
        const p1Vis = Math.abs(getPositionAt(pos - 0.5).psi);
        const p2Vis = Math.abs(getPositionAt(pos + 0.5).psi);
        isVis = pos * (pos + 1) <= 0 || Math.min(p1Vis, p2Vis) < (s.edgePsi || 1.2);
      }
      
      const alpha = absPsi > BEND_REACH || adjPos < -count / 2 || !isVis ? 0 : 1;
      mesh.visible = alpha > 0;
      
      const scale = Math.max(0.2, CYLINDER_RADIUS * (p2 - p1) - (s.gapAt ? s.gapAt(psi) : 0.04));
      const half = 0.5 * scale / CYLINDER_RADIUS;
      
      activeSlidesRef.current[i] = { psi, half, on: alpha > 0 };
      
      const uni = materials[i].uniforms;
      uni.uAlpha.value = alpha;
      uni.uPsi.value = psi;
      uni.uScale.value = scale;
      
      const vid = videosRef.current[i];
      if (vid) {
        const shouldPlay = alpha > 0 && absPsi - half < (s.edgePsi || 1.2) + 0.15 && !s.reduce;
        if (shouldPlay && vid.v.paused) {
          vid.v.play().catch(() => {});
        } else if (!shouldPlay && !vid.v.paused) {
          vid.v.pause();
        }
      }
    });

    postProcess.mat.uniforms.uGlass.value = glass ? 1 : 0;
    
    gl.setRenderTarget(postProcess.rt);
    gl.clear();
    gl.render(stateObj.scene, camera);
    
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(postProcess.scene, postProcess.cam);
  }, 1);

  // Raycaster for clicks
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    
    pickRef.current = (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(2 * ((clientY - rect.top) / rect.height)) + 1);
      raycaster.setFromCamera(pointer, camera);
      
      const origin = raycaster.ray.origin;
      const dir = raycaster.ray.direction;
      const a = dir.x * dir.x + dir.z * dir.z;
      const b = 2 * (origin.x * dir.x + origin.z * dir.z);
      const c = origin.x * origin.x + origin.z * origin.z - CYLINDER_RADIUS * CYLINDER_RADIUS;
      const discriminant = b * b - 4 * a * c;
      
      if (discriminant < 0 || a === 0) return null;
      
      for (const t of [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)]) {
        if (t <= 0) continue;
        const ix = origin.x + dir.x * t;
        const iy = origin.y + dir.y * t;
        const iz = origin.z + dir.z * t;
        const angle = Math.atan2(ix, -iz);
        
        if (Math.abs(iy) > 0.5 * (1 + 0.35 * Math.min(1, Math.abs(angle) / VISIBLE_ANGLE)) / ASPECT_RATIO) continue;
        
        const hitIdx = activeSlidesRef.current.findIndex(s => s?.on && Math.abs(angle - s.psi) <= s.half);
        if (hitIdx >= 0) return ring[hitIdx].slug;
      }
      return null;
    };
    
    return () => { pickRef.current = null; };
  }, [gl, camera, ring, pickRef]);

  return (
    <>
      {ring.map((item, i) => (
        <mesh
          key={`${item.slug}-${i}`}
          ref={el => meshesRef.current[i] = el}
          geometry={PLANE_GEO}
          material={materials[i]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

// --- MAIN COMPONENT ---
export default function GlassCarousel({ items = [], autoplay = true, speed = 0.22, className = "", onIntro }) {
  const containerRef = useRef(null);
  const router = useContext(RouterContext);
  const isLg = useBreakpoint("lg"); // Glass effect only on desktop
  
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  const pickRef = useRef(null);
  const stateRef = useRef({
    offset: 0,
    velocity: 0,
    dragging: false,
    autoplay: autoplay,
    speed: speed,
    reduce: false,
    intro: !!onIntro,
    introT: null
  });
  
  stateRef.current.autoplay = autoplay;
  stateRef.current.speed = speed;

  const ringItems = useMemo(() => {
    const list = [];
    while (items.length && list.length < 12) {
      list.push(...items);
    }
    return list;
  }, [items]);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
    stateRef.current.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!onIntro) return;
    const s = stateRef.current;
    onIntro(() => {
      s.reduce ? s.intro = false : s.introT = 0;
    });
  }, [onIntro]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    let startX = 0, lastX = 0, lastTime = 0;
    
    const getDelta = (dx) => dx / (stateRef.current.wpx || 300) / (1 + (stateRef.current.gap0 ?? 0.04));
    
    const onPointerDown = (e) => {
      const s = stateRef.current;
      s.dragging = true;
      s.velocity = 0;
      startX = e.clientX;
      lastX = e.clientX;
      lastTime = performance.now();
    };
    
    const onPointerMove = (e) => {
      const s = stateRef.current;
      if (!s.dragging) {
        if (el.contains(e.target)) {
          setIsHovered(!!pickRef.current?.(e.clientX, e.clientY));
        }
        return;
      }
      const now = performance.now();
      const dx = getDelta(e.clientX - startX);
      s.offset += dx;
      s.velocity = dx / Math.max(1, now - lastTime) * (1000 / 60);
      startX = e.clientX;
      lastTime = now;
    };
    
    const onPointerUp = () => stateRef.current.dragging = false;
    
    const onClick = (e) => {
      if (Math.abs(e.clientX - lastX) > 6) return;
      const slug = pickRef.current?.(e.clientX, e.clientY);
      if (slug) navigateRef.current(slug);
    };
    
    const onPointerLeave = () => setIsHovered(false);
    
    let lastScroll = window.scrollY;
    const onScroll = () => {
      const sy = window.scrollY;
      stateRef.current.offset += 0.6 * getDelta(sy - lastScroll);
      lastScroll = sy;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("click", onClick);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    
    const observer = new IntersectionObserver(([entry]) => setIsActive(entry.isIntersecting), { rootMargin: "200px 0px" });
    observer.observe(el);
    
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClick);
      el.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      observer.disconnect();
    };
  }, [hasWebGL]);

  const navigateRef = useRef(null);
  navigateRef.current = (slug) => {
    const url = `/animations/${slug}`;
    router?.push ? router.push(url) : window.location.assign(url);
  };

  if (!hasWebGL) {
    return <Carousel3D items={items} autoplay={autoplay} speed={speed} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[320px] w-full touch-pan-y select-none ${isHovered ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${className}`}
    >
      <Canvas
        style={{
          position: "absolute",
          left: 0,
          top: "-35%",
          width: "100%",
          height: "170%",
          pointerEvents: "none"
        }}
        frameloop={isActive ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ fov: 40, near: 0.01, far: 20, position: [0, 0, CAMERA_Z] }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
        }}
      >
        <CarouselRing ring={ringItems} state={stateRef} glass={isLg} pickRef={pickRef} active={isActive} />
      </Canvas>
      <ul className="sr-only">
        {items.map(item => (
          <li key={item.slug}>
            <Link href={`/animations/${item.slug}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
