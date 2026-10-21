'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowsOutSimple, CaretDown, CaretUp, Cube, Sparkle } from '@phosphor-icons/react';

interface VectorCore3DProps {
  complianceScore: number;
  clauseCount: number;
  vaultCount: number;
  onSelectPreset?: (preset: 'overview' | 'exploded' | 'core') => void;
}

export function VectorCore3D({
  complianceScore,
  clauseCount,
  vaultCount,
}: VectorCore3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<'overview' | 'exploded' | 'core'>('overview');
  const [explodeFactor, setExplodeFactor] = useState<number>(0.18);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  // Store mutable animation targets in refs so React UI updates never recreate WebGL context
  const targetExplodeRef = useRef<number>(0.18);
  const targetCamZRef = useRef<number>(5.4);
  const targetCamYRef = useRef<number>(0.8);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (cameraMode === 'overview') {
      targetCamZRef.current = 5.4;
      targetCamYRef.current = 0.8;
      targetExplodeRef.current = 0.18;
      setExplodeFactor(0.18);
    } else if (cameraMode === 'exploded') {
      targetCamZRef.current = 6.2;
      targetCamYRef.current = 1.2;
      targetExplodeRef.current = 0.85;
      setExplodeFactor(0.85);
    } else {
      targetCamZRef.current = 3.7;
      targetCamYRef.current = 0.25;
      targetExplodeRef.current = 0.05;
      setExplodeFactor(0.05);
    }
    requestRenderRef.current?.();
  }, [cameraMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL Guard per Three.js Skill Directive
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 250;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0f0e);
    scene.fog = new THREE.FogExp2(0x0d0f0e, 0.085);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 5.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 3. Balanced 3-Point Studio Lighting Rig (Warm Key + Cool Hemisphere + Lime Rim)
    const hemiLight = new THREE.HemisphereLight(0xedff8c, 0x162421, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff8e7, 2.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x309f92, 1.8);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // 4. Composite 6-Part Procedural Geodesic Vector Core Group (THREE.Group)
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Part 1: Primary Silhouette — Inner Brushed Gold/Lime Icosahedron Core
    const coreGeo = new THREE.IcosahedronGeometry(0.78, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xedff8c,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.8,
      emissive: 0x309f92,
      emissiveIntensity: 0.18,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = !isSoftwareGl;
    rootGroup.add(coreMesh);

    // Part 2: Secondary Read — Faceted Wireframe Geodesic Cage (Inspired by IMG_5047_c312454a.jpeg)
    const cageGeo = new THREE.IcosahedronGeometry(1.18, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x309f92,
      metalness: 0.92,
      roughness: 0.45,
      wireframe: true,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    rootGroup.add(cageMesh);

    // Part 3: Secondary Read — Outer Precision Gyroscopic Seal Ring 1
    const ring1Geo = new THREE.TorusGeometry(1.52, 0.035, 16, 64);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xedff8c,
      metalness: 0.75,
      roughness: 0.25,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 2.6;
    rootGroup.add(ring1Mesh);

    // Part 4: Secondary Read — Outer Precision Gyroscopic Seal Ring 2
    const ring2Geo = new THREE.TorusGeometry(1.74, 0.024, 16, 64);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x309f92,
      metalness: 0.65,
      roughness: 0.52,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 3.2;
    ring2Mesh.rotation.x = -Math.PI / 4;
    rootGroup.add(ring2Mesh);

    // Part 5: Accent Detail — InstancedMesh of 27 Vector Embedding Nodes in 3D Lattice
    const nodeCount = 27;
    const nodeGeo = new THREE.OctahedronGeometry(0.085, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.2,
    });
    const nodesInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);

    const baseOffsets: THREE.Vector3[] = [];
    const dummyMatrix = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3(1, 1, 1);
    const tintColor = new THREE.Color();

    let idx = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const offset = new THREE.Vector3(x * 0.62, y * 0.62, z * 0.62);
          baseOffsets.push(offset);
          dummyPos.copy(offset);
          const s = 0.85 + ((idx % 3) * 0.12);
          dummyScale.set(s, s, s);
          dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
          nodesInstanced.setMatrixAt(idx, dummyMatrix);

          if (idx % 4 === 0) {
            tintColor.setHex(0xedff8c);
          } else if (idx % 2 === 0) {
            tintColor.setHex(0x309f92);
          } else {
            tintColor.setHex(0xffffff);
          }
          nodesInstanced.setColorAt(idx, tintColor);
          idx++;
        }
      }
    }
    nodesInstanced.instanceMatrix.needsUpdate = true;
    if (nodesInstanced.instanceColor) nodesInstanced.instanceColor.needsUpdate = true;
    nodesInstanced.computeBoundingSphere();
    nodesInstanced.frustumCulled = false;
    rootGroup.add(nodesInstanced);

    // Part 6: Ground Contact Shadow & Pedestal Ring
    const pedestalGeo = new THREE.RingGeometry(0.9, 1.95, 48);
    const pedestalMat = new THREE.MeshBasicMaterial({
      color: 0x309f92,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    pedestalMat.polygonOffset = true;
    pedestalMat.polygonOffsetFactor = -1;
    pedestalMat.polygonOffsetUnits = -1;
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.rotation.x = -Math.PI / 2;
    pedestalMesh.position.y = -1.65;
    scene.add(pedestalMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5. Paced Loop with Software-WebGL Fence Sync & Zero GC Allocations
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();
    let currentExplode = targetExplodeRef.current;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Exponential damping for camera and exploded-view separation
      currentExplode = THREE.MathUtils.damp(
        currentExplode,
        targetExplodeRef.current,
        6,
        dt
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetCamZRef.current,
        5,
        dt
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        targetCamYRef.current,
        5,
        dt
      );
      camera.lookAt(0, 0, 0);

      // Smooth orbital rotation of the geodesic core
      rootGroup.rotation.y = elapsed * 0.35;
      coreMesh.rotation.x = elapsed * 0.45;
      cageMesh.rotation.z = -elapsed * 0.25;
      const cageScale = 1 + currentExplode * 0.42;
      cageMesh.scale.set(cageScale, cageScale, cageScale);

      ring1Mesh.rotation.z = elapsed * 0.5;
      ring2Mesh.rotation.x = -Math.PI / 4 + elapsed * 0.35;

      // Update InstancedMesh node positions based on explode factor without allocating
      const spread = 1 + currentExplode * 1.15;
      for (let i = 0; i < nodeCount; i++) {
        const base = baseOffsets[i];
        dummyPos.set(base.x * spread, base.y * spread, base.z * spread);
        const s = 0.85 + ((i % 3) * 0.12);
        dummyScale.set(s, s, s);
        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        nodesInstanced.setMatrixAt(i, dummyMatrix);
      }
      nodesInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    requestRenderRef.current = () => {
      // Used to wake or nudge state changes
    };

    tick();

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 250;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      coreGeo.dispose();
      coreMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, []);

  const handleExplodeSlider = (val: number) => {
    setExplodeFactor(val);
    targetExplodeRef.current = val;
  };

  return (
    <div className="relative rounded-3xl bg-[#0D0F0E] border border-neutral-800 overflow-hidden h-[290px] flex flex-col justify-between select-none">
      {/* Top-Left Minimal Spec Header (Outside WebGL Canvas DOM) */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <Cube size={16} weight="fill" className="text-[#EDFF8C]" />
          <span className="text-xs font-bold text-white tracking-tight">
            3D Geodesic Vector Core
          </span>
          <span className="text-[11px] font-mono text-[#309F92]">
            · {vaultCount} Vault Embeddings · {clauseCount} Clauses
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-[#EDFF8C] tabular-nums">
          Alignment {complianceScore}%
        </span>
      </div>

      {/* Dedicated Isolated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0"
        aria-label="Interactive 3D Geodesic Vector Vault and Compliance Core"
      />

      {/* Unified Collapsible Bottom Control Dock (Zero Backdrop-Filter over WebGL) */}
      <div className="relative z-10 mx-auto mb-3 w-[94%] max-w-[460px] flex flex-col items-center">
        <button
          onClick={() => setDockCollapsed(!dockCollapsed)}
          className="px-3 py-1 rounded-t-xl bg-[#161A18] text-neutral-300 hover:text-white border border-b-0 border-neutral-800 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <CaretUp size={11} weight="bold" />
              <span>Show 3D Controls</span>
            </>
          ) : (
            <>
              <CaretDown size={11} weight="bold" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full rounded-2xl bg-[#161A18] border border-neutral-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
            {/* Camera View Presets */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'overview', label: 'Orbit' },
                  { id: 'exploded', label: 'Explode' },
                  { id: 'core', label: 'Core' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setCameraMode(preset.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                    cameraMode === preset.id
                      ? 'bg-[#EDFF8C] text-[#0D0F0E]'
                      : 'bg-[#0D0F0E] text-neutral-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Exploded-View Separation Slider */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-300">
              <ArrowsOutSimple size={13} className="text-[#309F92]" />
              <span className="font-mono text-[10px]">Vector Spread</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={explodeFactor}
                onChange={(e) => handleExplodeSlider(parseFloat(e.target.value))}
                className="w-20 accent-[#EDFF8C] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
