'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowsClockwise, Sparkle } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';

type SceneController = { turn: () => void };

/**
 * A progressive enhancement: useful illustrated fallback first; a small Three.js
 * sculpture only when visible and when the device can reasonably render it.
 * Nothing in the onboarding flow depends on WebGL.
 */
export function OnboardingScene({ step, compact = false }: { step: number; compact?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controllerRef = useRef<SceneController | null>(null);
  const stepRef = useRef(step);
  const [hasWebGL, setHasWebGL] = useState(false);
  const [turns, setTurns] = useState(0);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const mount = sceneRef.current;
    const button = buttonRef.current;
    if (!mount || !button || prefersReducedMotion) return;

    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (device.connection?.saveData || (device.deviceMemory !== undefined && device.deviceMemory <= 2)) return;
    if (typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined') return;

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let started = false;
    const boot = async () => {
      try {
        const THREE = await import('three');
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.domElement.className = 'absolute inset-0 h-full w-full pointer-events-none';
        renderer.domElement.setAttribute('aria-hidden', 'true');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
        const sculpture = new THREE.Group();
        scene.add(sculpture);
        scene.add(new THREE.AmbientLight(0xffffff, 2.1));
        const light = new THREE.DirectionalLight(0xffffff, 2.5);
        light.position.set(-3, 5, 7);
        scene.add(light);

        const resources: Array<{ dispose: () => void }> = [];
        const material = (colour: number, roughness = 0.52) => {
          const value = new THREE.MeshStandardMaterial({ color: colour, metalness: 0.04, roughness });
          resources.push(value);
          return value;
        };
        const paper = material(0xf8f6ef);
        const ink = material(0x101714);
        const teal = material(0x168b7a);
        const lime = material(0xddfb82, 0.36);
        const shadow = material(0x34483b);

        const block = (
          width: number, height: number, depth: number,
          surface: InstanceType<typeof THREE.MeshStandardMaterial>,
          x: number, y: number, z: number, angle = 0,
        ) => {
          const geometry = new THREE.BoxGeometry(width, height, depth);
          resources.push(geometry);
          const mesh = new THREE.Mesh(geometry, surface);
          mesh.position.set(x, y, z);
          mesh.rotation.z = angle;
          sculpture.add(mesh);
          return mesh;
        };

        // The layered documents evoke an opportunity moving through review,
        // rather than suggesting a guaranteed tender award or compliance score.
        block(2.2, 2.85, 0.13, shadow, -0.35, -0.08, -0.42, -0.14);
        block(2.2, 2.85, 0.13, teal, 0.29, 0.05, -0.2, 0.14);
        block(2.2, 2.85, 0.16, paper, 0, 0.05, 0.14, -0.045);
        block(1.2, 0.17, 0.035, ink, -0.29, 0.95, 0.25, -0.045);
        block(1.55, 0.075, 0.035, shadow, -0.19, 0.53, 0.25, -0.045);
        block(1.35, 0.075, 0.035, shadow, -0.26, 0.35, 0.25, -0.045);
        block(1.55, 0.075, 0.035, shadow, -0.19, 0.17, 0.25, -0.045);
        block(0.7, 0.72, 0.08, lime, 0.56, -0.8, 0.31, -0.045);
        block(0.2, 0.08, 0.065, ink, 0.46, -0.84, 0.385, -0.73);
        block(0.43, 0.08, 0.065, ink, 0.68, -0.77, 0.385, 0.63);

        let frame = 0;
        let running = false;
        let pointerX = 0;
        let pointerY = 0;
        let targetTurn = 0;

        const resize = () => {
          const width = Math.max(1, mount.clientWidth);
          const height = Math.max(1, mount.clientHeight);
          camera.aspect = width / height;
          camera.position.z = width / height > 1.8 ? 6.2 : 5.7;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        const onMove = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          const rect = button.getBoundingClientRect();
          pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        const onLeave = () => { pointerX = 0; pointerY = 0; };

        const draw = (time: number) => {
          if (!running) return;
          const targetY = targetTurn + stepRef.current * 0.15 + pointerX * 0.22;
          sculpture.rotation.y += (targetY - sculpture.rotation.y) * 0.065;
          sculpture.rotation.x += (-0.12 + pointerY * -0.12 - sculpture.rotation.x) * 0.065;
          sculpture.position.y = Math.sin(time / 1250) * 0.07;
          renderer.render(scene, camera);
          frame = requestAnimationFrame(draw);
        };
        const pause = () => { running = false; cancelAnimationFrame(frame); };
        const resume = () => {
          if (running || document.hidden) return;
          running = true;
          frame = requestAnimationFrame(draw);
        };
        const visibility = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) resume();
          else pause();
        }, { threshold: 0.05 });
        const onVisibility = () => {
          if (document.hidden) pause();
          else if (button.getBoundingClientRect().width > 0) resume();
        };
        const resizeObserver = new ResizeObserver(resize);
        mount.appendChild(renderer.domElement);
        resizeObserver.observe(mount);
        resize();
        button.addEventListener('pointermove', onMove);
        button.addEventListener('pointerleave', onLeave);
        document.addEventListener('visibilitychange', onVisibility);
        visibility.observe(button);
        controllerRef.current = { turn: () => { targetTurn += Math.PI * 0.5; } };
        setHasWebGL(true);

        cleanup = () => {
          pause();
          visibility.disconnect();
          resizeObserver.disconnect();
          button.removeEventListener('pointermove', onMove);
          button.removeEventListener('pointerleave', onLeave);
          document.removeEventListener('visibilitychange', onVisibility);
          controllerRef.current = null;
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
          renderer.dispose();
          resources.forEach((resource) => resource.dispose());
        };
        if (disposed) cleanup();
      } catch {
        // WebGL can be blocked by browsers, privacy settings or GPU limits.
        // Keep the branded CSS illustration rather than breaking onboarding.
      }
    };

    const entrance = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      entrance.disconnect();
      void boot();
    }, { threshold: 0.05 });
    entrance.observe(button);

    return () => {
      disposed = true;
      entrance.disconnect();
      cleanup?.();
    };
  }, [prefersReducedMotion]);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Turn the decorative bid documents"
      title="Turn the illustration"
      data-onboarding-scene={compact ? 'compact' : 'full'}
      data-scene-mode={hasWebGL && !prefersReducedMotion ? 'webgl' : 'fallback'}
      onClick={() => { controllerRef.current?.turn(); setTurns((value) => value + 1); }}
      className={`group relative isolate flex w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[#14241D] focus-visible:outline-[#DDFB82] ${compact ? 'h-[108px]' : 'h-[235px]'}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -left-12 -top-24 size-64 rounded-full bg-[#168B7A]/45 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-12 size-64 rounded-full bg-[#DDFB82]/20 blur-3xl" />
      <span ref={sceneRef} aria-hidden="true" className="absolute inset-0 block" />
      {(!hasWebGL || prefersReducedMotion) && (
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: turns % 2 === 0 ? -8 : 8, y: prefersReducedMotion ? 0 : turns % 2 ? -3 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 16 }}
          className="pointer-events-none relative grid h-[82%] max-h-44 aspect-[4/5] place-items-center rounded-[18px] border border-[#C9D2C5] bg-[#F8F6EF] shadow-[12px_14px_0_-4px_#168B7A,19px_22px_0_-7px_#31443A,0_20px_45px_#0006]"
        >
          <span className="absolute left-[18%] top-[22%] h-[8%] w-[56%] rounded-full bg-[#101714]" />
          <span className="absolute left-[18%] top-[37%] h-[4%] w-[64%] rounded-full bg-[#AFC3B6]" />
          <span className="absolute left-[18%] top-[47%] h-[4%] w-[48%] rounded-full bg-[#AFC3B6]" />
          <span className="absolute bottom-[14%] right-[12%] grid size-10 place-items-center rounded-xl bg-[#DDFB82] text-xl font-bold text-[#101714]">✓</span>
        </motion.span>
      )}
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#101714]/70 px-2.5 py-1.5 text-[10px] font-semibold text-white/90 transition-colors group-hover:bg-[#168B7A]">
        <ArrowsClockwise size={13} aria-hidden="true" />
        <span>{compact ? 'Tap to turn' : 'Interact to turn'}</span>
        <Sparkle size={12} weight="fill" className="text-[#DDFB82]" aria-hidden="true" />
      </span>
    </button>
  );
}
