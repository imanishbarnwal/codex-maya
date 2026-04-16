"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MayaCharacter } from "@/lib/maya-data";

type AvatarStageProps = {
  character: MayaCharacter;
  size?: "full" | "compact" | "hero";
};

export function AvatarStage({ character, size = "full" }: AvatarStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (event.clientX - cx) / (rect.width / 2 + 400);
      const ny = (event.clientY - cy) / (rect.height / 2 + 400);
      mouseRef.current.x = Math.max(-1, Math.min(1, nx));
      mouseRef.current.y = Math.max(-1, Math.min(1, ny));
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;

    const palette = character.avatar.palette;
    const primary = palette[0] ?? "#9fb07f";
    const accent = palette[1] ?? "#f5a45d";
    const dark = palette[2] ?? "#120f0b";
    const light = palette[3] ?? "#f7ead2";

    const traits = character.avatar.traits.join(" ").toLowerCase();
    const env = character.avatar.environment.toLowerCase();
    const roleLower = character.role.toLowerCase();
    const isGarden = roleLower.includes("architect") || env.includes("garden");
    const isStartup = roleLower.includes("startup") || roleLower.includes("operator");
    const isRainy =
      env.includes("rain") || env.includes("monsoon") || traits.includes("monsoon");

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(size === "hero" ? 30 : 34, 1, 0.1, 100);
    const camRadius = size === "hero" ? 9.8 : size === "compact" ? 8.2 : 8.6;
    const camHeight = size === "hero" ? 0.45 : 0.35;
    camera.position.set(0, camHeight, camRadius);
    camera.lookAt(0, -0.12, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const skinTone = isGarden
      ? "#d7a287"
      : isStartup
        ? "#c48866"
        : "#b57d58";

    const skin = new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.78,
      metalness: 0.02,
    });
    const blush = new THREE.MeshStandardMaterial({
      color: shadeHSL(skinTone, -0.08),
      roughness: 0.85,
      transparent: true,
      opacity: 0.5,
    });
    const hair = new THREE.MeshStandardMaterial({ color: "#1a100b", roughness: 0.94 });
    const hoodie = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.93 });
    const hoodieDark = new THREE.MeshStandardMaterial({
      color: shadeHSL(primary, -0.14),
      roughness: 0.95,
    });
    const jeans = new THREE.MeshStandardMaterial({ color: "#27221b", roughness: 0.9 });
    const shoes = new THREE.MeshStandardMaterial({ color: "#0f0b07", roughness: 0.7 });
    const ink = new THREE.MeshStandardMaterial({ color: "#0a0806", roughness: 0.55 });
    const white = new THREE.MeshStandardMaterial({ color: "#f7ead2", roughness: 0.4 });
    const ember = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.4,
      emissive: accent,
      emissiveIntensity: 0.65,
    });
    const paper = new THREE.MeshStandardMaterial({ color: light, roughness: 0.65 });
    const lens = new THREE.MeshPhysicalMaterial({
      color: "#e8d9b8",
      roughness: 0.12,
      transmission: 0.55,
      transparent: true,
      opacity: 0.3,
      clearcoat: 1,
    });

    const figure = new THREE.Group();
    figure.position.y = size === "hero" ? -0.05 : 0.02;
    figure.scale.setScalar(size === "hero" ? 0.9 : size === "compact" ? 0.86 : 0.92);
    scene.add(figure);

    const head = new THREE.Group();
    head.position.y = 1.32;
    figure.add(head);

    const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.06, 8, 16), jeans);
    hips.position.y = -0.3;
    hips.castShadow = true;
    figure.add(hips);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.46, 10, 20), hoodie);
    torso.position.y = 0.22;
    torso.scale.set(1.06, 1, 0.76);
    torso.castShadow = true;
    figure.add(torso);

    const hoodieTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.028, 10, 28),
      hoodieDark,
    );
    hoodieTrim.position.set(0, 0.58, 0.04);
    hoodieTrim.rotation.x = Math.PI / 2;
    hoodieTrim.scale.set(1.05, 1.05, 0.6);
    figure.add(hoodieTrim);

    const hoodBack = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hoodieDark,
    );
    hoodBack.position.set(0, 0.72, -0.06);
    hoodBack.scale.set(1, 1.05, 1);
    hoodBack.rotation.x = -0.2;
    hoodBack.castShadow = true;
    figure.add(hoodBack);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.16, 18), skin);
    neck.position.y = 0.76;
    figure.add(neck);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 28), skin);
    headMesh.scale.set(0.98, 1.05, 0.94);
    headMesh.castShadow = true;
    head.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), skin);
    jaw.position.set(0, -0.16, 0.08);
    jaw.scale.set(0.88, 0.6, 0.82);
    head.add(jaw);

    const leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), blush);
    const rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), blush);
    leftBlush.position.set(-0.18, -0.05, 0.38);
    rightBlush.position.set(0.18, -0.05, 0.38);
    head.add(leftBlush, rightBlush);

    const earGeom = new THREE.SphereGeometry(0.07, 14, 12);
    const leftEar = new THREE.Mesh(earGeom, skin);
    const rightEar = new THREE.Mesh(earGeom, skin);
    leftEar.position.set(-0.4, -0.02, 0.02);
    rightEar.position.set(0.4, -0.02, 0.02);
    leftEar.scale.set(0.55, 1, 0.4);
    rightEar.scale.set(0.55, 1, 0.4);
    head.add(leftEar, rightEar);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 42, 22, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hair,
    );
    hairCap.position.set(0, 0.05, 0);
    hairCap.scale.set(1, 0.88, 0.98);
    hairCap.rotation.x = -0.1;
    hairCap.castShadow = true;
    head.add(hairCap);

    const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 14), hair);
    fringe.position.set(0.08, 0.12, 0.34);
    fringe.scale.set(1.15, 0.42, 0.65);
    fringe.rotation.z = 0.4;
    head.add(fringe);

    const fringeTail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), hair);
    fringeTail.position.set(-0.22, 0.08, 0.3);
    fringeTail.scale.set(1, 0.32, 0.55);
    fringeTail.rotation.z = -0.25;
    head.add(fringeTail);

    const browGeom = new THREE.BoxGeometry(0.11, 0.017, 0.017);
    const leftBrow = new THREE.Mesh(browGeom, ink);
    const rightBrow = new THREE.Mesh(browGeom, ink);
    leftBrow.position.set(-0.13, 0.06, 0.39);
    rightBrow.position.set(0.13, 0.06, 0.39);
    leftBrow.rotation.z = 0.08;
    rightBrow.rotation.z = -0.08;
    head.add(leftBrow, rightBrow);

    const eyeGroup = new THREE.Group();
    const eyeWhiteGeom = new THREE.SphereGeometry(0.065, 22, 16);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, white);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, white);
    leftEyeWhite.position.set(-0.13, 0, 0.38);
    rightEyeWhite.position.set(0.13, 0, 0.38);
    leftEyeWhite.scale.set(1, 0.92, 0.6);
    rightEyeWhite.scale.set(1, 0.92, 0.6);

    const pupilGeom = new THREE.SphereGeometry(0.035, 18, 14);
    const leftPupil = new THREE.Mesh(pupilGeom, ink);
    const rightPupil = new THREE.Mesh(pupilGeom, ink);
    leftPupil.position.set(-0.13, 0, 0.42);
    rightPupil.position.set(0.13, 0, 0.42);

    const shineGeom = new THREE.SphereGeometry(0.012, 10, 8);
    const leftShine = new THREE.Mesh(shineGeom, white);
    const rightShine = new THREE.Mesh(shineGeom, white);
    leftShine.position.set(-0.12, 0.015, 0.445);
    rightShine.position.set(0.14, 0.015, 0.445);

    eyeGroup.add(leftEyeWhite, rightEyeWhite, leftPupil, rightPupil, leftShine, rightShine);
    head.add(eyeGroup);

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.012, 10, 24, Math.PI),
      ink,
    );
    mouth.position.set(0, -0.13, 0.4);
    mouth.rotation.z = Math.PI;
    head.add(mouth);

    const glassesGroup = new THREE.Group();
    const frameGeom = new THREE.TorusGeometry(0.11, 0.012, 10, 28);
    const fillGeom = new THREE.CircleGeometry(0.105, 28);
    const leftFrame = new THREE.Mesh(frameGeom, ink);
    const rightFrame = new THREE.Mesh(frameGeom, ink);
    const leftLens = new THREE.Mesh(fillGeom, lens);
    const rightLens = new THREE.Mesh(fillGeom, lens);
    leftFrame.position.set(-0.13, 0, 0.41);
    rightFrame.position.set(0.13, 0, 0.41);
    leftLens.position.set(-0.13, 0, 0.41);
    rightLens.position.set(0.13, 0, 0.41);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), ink);
    bridge.position.set(0, 0, 0.412);
    const leftTemple = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.14), ink);
    const rightTemple = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.14), ink);
    leftTemple.position.set(-0.24, 0, 0.33);
    rightTemple.position.set(0.24, 0, 0.33);
    glassesGroup.add(
      leftFrame,
      rightFrame,
      leftLens,
      rightLens,
      bridge,
      leftTemple,
      rightTemple,
    );
    head.add(glassesGroup);

    function makeArm(side: 1 | -1) {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 10, 16), hoodie);
      upper.position.y = -0.18;
      upper.castShadow = true;
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 10, 16), hoodie);
      fore.position.y = -0.54;
      fore.castShadow = true;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 22, 16), skin);
      hand.position.y = -0.76;
      hand.scale.set(1.05, 0.78, 1);
      hand.castShadow = true;
      arm.add(upper, fore, hand);
      arm.position.set(0.45 * side, 0.45, 0.05);
      arm.rotation.z = -0.14 * side;
      return arm;
    }
    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);
    figure.add(leftArm, rightArm);

    function makeLeg(side: 1 | -1) {
      const leg = new THREE.Group();
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.38, 10, 16), jeans);
      thigh.position.y = -0.24;
      thigh.castShadow = true;
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 10, 16), jeans);
      shin.position.y = -0.72;
      shin.castShadow = true;
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.36), shoes);
      shoe.position.set(0, -1.02, 0.08);
      shoe.castShadow = true;
      const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.38), white);
      shoeSole.position.set(0, -1.08, 0.08);
      leg.add(thigh, shin, shoe, shoeSole);
      leg.position.set(0.17 * side, -0.43, 0);
      return leg;
    }
    const leftLeg = makeLeg(-1);
    const rightLeg = makeLeg(1);
    figure.add(leftLeg, rightLeg);

    const prop = new THREE.Group();
    if (isGarden) {
      const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.94, 0.04), paper);
      tablet.position.set(0, 0.3, 0.58);
      tablet.rotation.x = -0.34;
      tablet.castShadow = true;
      const glow = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.012, 10, 48), ember);
      glow.position.set(0, 0.3, 0.6);
      glow.rotation.x = -0.34;
      prop.add(tablet, glow);
      for (let i = 0; i < 6; i += 1) {
        const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), ember);
        bloom.position.set(-1.1 + i * 0.45, -1.02, 0.9 + (i % 2) * 0.15);
        prop.add(bloom);
      }
    } else if (isStartup) {
      for (let i = 0; i < 3; i += 1) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.18, 0.36),
          i === 0 ? ember : hoodieDark,
        );
        block.position.set(0.95, -0.25 + i * 0.22, 0.32);
        block.rotation.y = 0.22 * i;
        block.castShadow = true;
        prop.add(block);
      }
    } else {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.58), ink);
      base.position.set(0, -0.12, 0.52);
      base.castShadow = true;
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.58, 0.03), ink);
      screen.position.set(0, 0.18, 0.28);
      screen.rotation.x = -0.34;
      const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.5), paper);
      screenFace.position.set(0, 0.18, 0.297);
      screenFace.rotation.x = -0.34;
      const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), ember);
      sticker.position.set(0.28, 0.23, 0.278);
      sticker.rotation.x = -0.34;
      prop.add(base, screen, screenFace, sticker);
    }
    figure.add(prop);

    const platformY = -1.16;
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.7, 0.1, 80),
      new THREE.MeshStandardMaterial({
        color: shadeHSL(dark, 0.06),
        roughness: 0.86,
        metalness: 0.1,
      }),
    );
    platform.position.y = platformY;
    platform.receiveShadow = true;
    scene.add(platform);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.62, 1.82, 120),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = platformY + 0.08;
    scene.add(innerRing);

    const outerOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.008, 8, 120),
      new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.35 }),
    );
    outerOrbit.rotation.x = Math.PI / 2;
    outerOrbit.position.y = platformY + 0.1;
    scene.add(outerOrbit);

    const midOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.005, 6, 96),
      new THREE.MeshBasicMaterial({ color: light, transparent: true, opacity: 0.28 }),
    );
    midOrbit.rotation.x = Math.PI / 2;
    midOrbit.position.y = platformY + 0.12;
    scene.add(midOrbit);

    const orbitSparks = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 10),
        new THREE.MeshBasicMaterial({ color: accent }),
      );
      spark.position.set(Math.cos(angle) * 2.3, platformY + 0.1, Math.sin(angle) * 2.3);
      orbitSparks.add(spark);
    }
    scene.add(orbitSparks);

    const dustCount = 220;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i += 1) {
      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 1] = Math.random() * 6 - 1.2;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      dustSpeed[i] = 0.001 + Math.random() * 0.004;
    }
    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeom,
      new THREE.PointsMaterial({
        color: light,
        size: 0.022,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    let rain: THREE.Group | null = null;
    if (isRainy) {
      rain = new THREE.Group();
      const rainMat = new THREE.LineBasicMaterial({
        color: "#c9d6ae",
        transparent: true,
        opacity: 0.28,
      });
      for (let i = 0; i < 90; i += 1) {
        const x = (Math.random() - 0.5) * 9;
        const y = Math.random() * 6;
        const z = -3.5 + Math.random() * 5.5;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, y, z),
          new THREE.Vector3(x + 0.05, y - 0.4, z),
        ]);
        rain.add(new THREE.Line(geo, rainMat));
      }
      scene.add(rain);
    }

    const bokehGroup = new THREE.Group();
    for (let i = 0; i < 8; i += 1) {
      const bokeh = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + Math.random() * 0.1, 12, 10),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? accent : primary,
          transparent: true,
          opacity: 0.22,
        }),
      );
      bokeh.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 3 - 0.5,
        -2.5 - Math.random() * 2,
      );
      bokehGroup.add(bokeh);
    }
    scene.add(bokehGroup);

    const hemi = new THREE.HemisphereLight(light, shadeHSL(dark, 0.02), 1.15);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(accent, 2.6);
    key.position.set(3.5, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    scene.add(key);

    const rim = new THREE.DirectionalLight(primary, 1.8);
    rim.position.set(-3.5, 3.5, -3);
    scene.add(rim);

    const fill = new THREE.PointLight(light, 1.4, 10);
    fill.position.set(0, 2.4, 3);
    scene.add(fill);

    const emberUp = new THREE.PointLight(accent, 1.6, 5);
    emberUp.position.set(0, -0.9, 0.4);
    scene.add(emberUp);

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      const safeH = Math.max(height, 320);
      renderer.setSize(width, safeH, false);
      camera.aspect = width / safeH;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let t = 0;
    let raf = 0;
    const posAttr = dust.geometry.attributes.position as THREE.BufferAttribute;
    let currentHeadRotX = 0;
    let currentHeadRotY = 0;

    function animate() {
      t += 0.012;

      figure.rotation.y = Math.sin(t * 0.3) * 0.1;
      figure.position.y = 0.05 + Math.sin(t * 1.4) * 0.022;

      const targetY = mouseRef.current.x * 0.45 + Math.sin(t * 0.4) * 0.04;
      const targetX = mouseRef.current.y * 0.18 + Math.sin(t * 0.6) * 0.015;
      currentHeadRotY += (targetY - currentHeadRotY) * 0.08;
      currentHeadRotX += (targetX - currentHeadRotX) * 0.08;
      head.rotation.y = currentHeadRotY;
      head.rotation.x = currentHeadRotX;

      const pupilOffset = 0.025;
      leftPupil.position.x = -0.13 + mouseRef.current.x * pupilOffset;
      rightPupil.position.x = 0.13 + mouseRef.current.x * pupilOffset;
      leftPupil.position.y = -mouseRef.current.y * pupilOffset * 0.6;
      rightPupil.position.y = -mouseRef.current.y * pupilOffset * 0.6;
      leftShine.position.x = -0.12 + mouseRef.current.x * pupilOffset;
      rightShine.position.x = 0.14 + mouseRef.current.x * pupilOffset;
      leftShine.position.y = 0.015 - mouseRef.current.y * pupilOffset * 0.6;
      rightShine.position.y = 0.015 - mouseRef.current.y * pupilOffset * 0.6;

      rightArm.rotation.x = -0.1 + Math.sin(t * 2.1) * 0.035;
      leftArm.rotation.x = -0.1 + Math.sin(t * 2.1 + 0.6) * 0.035;

      outerOrbit.rotation.z += 0.0028;
      midOrbit.rotation.z -= 0.0016;
      innerRing.rotation.z += 0.0009;
      orbitSparks.rotation.y += 0.006;

      for (let i = 0; i < dustCount; i += 1) {
        posAttr.array[i * 3 + 1] += dustSpeed[i];
        if (posAttr.array[i * 3 + 1] > 5) posAttr.array[i * 3 + 1] = -1.2;
      }
      posAttr.needsUpdate = true;

      bokehGroup.rotation.y += 0.0008;

      if (rain) {
        rain.position.y -= 0.06;
        if (rain.position.y < -1.5) rain.position.y = 0;
      }

      const camAngle = Math.sin(t * 0.2) * 0.08 + mouseRef.current.x * 0.035;
      camera.position.x = Math.sin(camAngle) * camRadius;
      camera.position.z = Math.cos(camAngle) * camRadius;
      camera.position.y = camHeight + Math.sin(t * 0.3) * 0.025 - mouseRef.current.y * 0.045;
      camera.lookAt(0, -0.12, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((obj) => {
        const maybeMesh = obj as THREE.Mesh;
        if (maybeMesh.geometry) maybeMesh.geometry.dispose?.();
      });
      [
        skin,
        blush,
        hair,
        hoodie,
        hoodieDark,
        jeans,
        shoes,
        ink,
        white,
        ember,
        paper,
        lens,
      ].forEach((m) => m.dispose());
    };
  }, [character, size]);

  const heightClass =
    size === "compact"
      ? "h-[300px] w-full"
      : size === "hero"
        ? "h-[420px] w-full md:h-[520px] xl:h-[560px]"
        : "h-[460px] w-full md:h-[540px]";

  return (
    <div className="relative isolate overflow-hidden rounded-2xl">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(245,164,93,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 30% 30%, rgba(159,176,127,0.12) 0%, transparent 70%)",
        }}
      />
      <div ref={mountRef} className={`relative ${heightClass}`} data-avatar-canvas />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0806] via-[#0a0806]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0806]/30 to-transparent" />
    </div>
  );
}

function shadeHSL(hex: string, lightnessDelta: number) {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + lightnessDelta));
  color.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${color.getHexString()}`;
}
