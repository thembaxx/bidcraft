"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Pause, Play, ArrowsOutSimple } from "@phosphor-icons/react";

export function VectorCore3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef(0);
  const playingRef = useRef(true);
  const [has3D, setHas3D] = useState(false);
  const [spread, setSpread] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
    if (!context) return; // The brand image beneath the canvas remains visible.
    const debug = context.getExtension("WEBGL_debug_renderer_info");
    const gpu = String(
      context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER),
    );
    if (/SwiftShader|llvmpipe|softpipe|Software/i.test(gpu)) {
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return; // Prefer the static mark over a CPU-heavy software animation.
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x101714, 1);
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(0, 0.25, 8);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmrem.fromScene(environment, 0.04);
    scene.environment = environmentTarget.texture;
    environment.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xf8f6ef, 0x168b7a, 2.5));
    const key = new THREE.DirectionalLight(0xfff6dd, 4);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x47e8c7, 3);
    rim.position.set(3, -1, -2);
    scene.add(rim);

    // Two tactile document ribbons form a dimensional B, matching the brand mark.
    const root = new THREE.Group();
    root.rotation.set(-0.13, -0.3, -0.08);
    scene.add(root);
    function ribbonShape() {
      const shape = new THREE.Shape();
      shape.moveTo(-0.88, -0.48);
      shape.lineTo(-0.88, 0.54);
      shape.quadraticCurveTo(-0.88, 0.7, -0.7, 0.7);
      shape.lineTo(0.28, 0.7);
      shape.bezierCurveTo(1.15, 0.7, 1.15, -0.63, 0.22, -0.63);
      shape.lineTo(-0.68, -0.63);
      shape.quadraticCurveTo(-0.88, -0.63, -0.88, -0.48);
      const hole = new THREE.Path();
      hole.moveTo(-0.51, -0.28);
      hole.lineTo(0.17, -0.28);
      hole.bezierCurveTo(0.62, -0.28, 0.62, 0.33, 0.17, 0.33);
      hole.lineTo(-0.51, 0.33);
      hole.closePath();
      shape.holes.push(hole);
      return shape;
    }
    const ribbonGeometry = new THREE.ExtrudeGeometry(ribbonShape(), {
      depth: 0.27,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.09,
      bevelThickness: 0.09,
      curveSegments: 32,
    });
    const ivory = new THREE.MeshPhysicalMaterial({
      color: 0xf8f6ef,
      metalness: 0.22,
      roughness: 0.25,
      clearcoat: 0.6,
    });
    const lime = new THREE.MeshPhysicalMaterial({
      color: 0xddfb82,
      metalness: 0.35,
      roughness: 0.23,
      clearcoat: 0.7,
    });
    const teal = new THREE.MeshStandardMaterial({
      color: 0x168b7a,
      metalness: 0.55,
      roughness: 0.3,
    });
    const upper = new THREE.Mesh(ribbonGeometry, [ivory, teal]);
    upper.position.y = 0.63;
    root.add(upper);
    const lower = new THREE.Mesh(ribbonGeometry, [lime, teal]);
    lower.position.y = -0.66;
    lower.scale.x = 1.06;
    root.add(lower);

    const orbit = new THREE.Group();
    scene.add(orbit);
    const orbitGeometry = new THREE.TorusGeometry(2.02, 0.008, 8, 100);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x309f92,
      transparent: true,
      opacity: 0.36,
    });
    const ring = new THREE.Mesh(orbitGeometry, orbitMaterial);
    ring.rotation.set(0.7, 0.3, 0.3);
    orbit.add(ring);
    const nodeGeometry = new THREE.SphereGeometry(0.045, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xddfb82 });
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(Math.cos(angle) * 2.02, Math.sin(angle) * 1.65, Math.sin(angle) * 0.9);
      orbit.add(node);
    }
    let pointerX = 0,
      pointerY = 0,
      visible = true,
      disposed = false,
      frame = 0,
      lastTime = 0,
      elapsed = 0;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = preference.matches;
    const onMotionChange = () => {
      reducedMotion = preference.matches;
      draw();
    };
    preference.addEventListener("change", onMotionChange);
    const resize = () => {
      const width = container.clientWidth,
        height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(container);
    const pointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const bounds = container.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.45;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.25;
    };
    const pointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    container.addEventListener("pointermove", pointerMove);
    container.addEventListener("pointerleave", pointerLeave);
    function draw() {
      if (!disposed) renderer.render(scene, camera);
    }
    function animate(time: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      if (time - lastTime < 1000 / 30) return;
      lastTime = time;
      if (!visible || document.hidden) return;
      if (reducedMotion) return;
      if (playingRef.current) elapsed += delta;
      root.rotation.y = THREE.MathUtils.damp(
        root.rotation.y,
        -0.3 + Math.sin(elapsed * 0.45) * 0.18 + pointerX,
        4,
        delta,
      );
      root.rotation.x = THREE.MathUtils.damp(root.rotation.x, -0.13 + pointerY, 4, delta);
      root.position.y = Math.sin(elapsed * 0.8) * 0.09;
      upper.position.y = THREE.MathUtils.damp(
        upper.position.y,
        0.63 + spreadRef.current * 0.32,
        5,
        delta,
      );
      lower.position.y = THREE.MathUtils.damp(
        lower.position.y,
        -0.66 - spreadRef.current * 0.32,
        5,
        delta,
      );
      orbit.rotation.y = elapsed * 0.07;
      draw();
    }
    resize();
    frame = requestAnimationFrame(animate);
    const readyFrame = requestAnimationFrame(() => setHas3D(true));
    return () => {
      disposed = true;
      cancelAnimationFrame(readyFrame);
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      preference.removeEventListener("change", onMotionChange);
      container.removeEventListener("pointermove", pointerMove);
      container.removeEventListener("pointerleave", pointerLeave);
      ribbonGeometry.dispose();
      ivory.dispose();
      lime.dispose();
      teal.dispose();
      orbitGeometry.dispose();
      orbitMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      environmentTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return (
    <div className="relative isolate h-[330px] overflow-hidden rounded-[32px] border border-white/10 bg-[#101714] text-white shadow-[0_22px_70px_-35px_#168B7A80] sm:h-[390px]">
      <Image
        src="/brand/bidcraft-icon.webp"
        width={240}
        height={240}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={mountRef}
        className="absolute inset-0"
        role="img"
        aria-label="Dimensional Bidcraft B made from ivory and chartreuse document ribbons"
      />
      <div className="pointer-events-none absolute inset-x-6 top-6 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
        <span>The art of a better bid</span>
        <span>Est. 2026</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3">
        <div className="text-[11px] text-white/50">
          <span className="mr-2 inline-block h-1 w-1 rounded-full bg-[#DDFB82]" /> Crafted around
          your evidence
        </div>
        {has3D && (
          <div className="flex gap-1.5 motion-reduce:hidden">
            <button
              type="button"
              aria-label={spread ? "Assemble brand mark" : "Expand brand mark"}
              aria-pressed={spread}
              onClick={() => {
                setSpread(!spread);
                spreadRef.current = spread ? 0 : 1;
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-[#DDFB82] hover:bg-white/10"
            >
              <ArrowsOutSimple size={15} />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause 3D animation" : "Play 3D animation"}
              aria-pressed={!playing}
              onClick={() => {
                playingRef.current = !playing;
                setPlaying(!playing);
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-[#DDFB82] hover:bg-white/10"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
