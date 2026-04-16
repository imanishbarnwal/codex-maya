"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MayaCharacter } from "@/lib/maya-data";

type AvatarStageProps = {
  character: MayaCharacter;
};

export function AvatarStage({ character }: AvatarStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#151a12");
    scene.fog = new THREE.Fog("#151a12", 7, 14);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.7, 6.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const skin = new THREE.MeshStandardMaterial({
      color: "#9a6241",
      roughness: 0.74,
      metalness: 0.02,
    });
    const hair = new THREE.MeshStandardMaterial({
      color: "#17120f",
      roughness: 0.86,
    });
    const hoodie = new THREE.MeshStandardMaterial({
      color: character.essence.toLowerCase().includes("ghibli") ? "#9fb07f" : "#f5a45d",
      roughness: 0.9,
    });
    const ink = new THREE.MeshStandardMaterial({
      color: "#120f0b",
      roughness: 0.6,
    });
    const ember = new THREE.MeshStandardMaterial({
      color: "#f5a45d",
      roughness: 0.5,
      emissive: "#5d2b08",
      emissiveIntensity: 0.25,
    });
    const paper = new THREE.MeshStandardMaterial({
      color: "#f7ead2",
      roughness: 0.7,
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 1.15, 8, 20), hoodie);
    torso.position.y = 0.05;
    torso.scale.set(1, 1.08, 0.66);
    torso.castShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 36, 24), skin);
    head.position.y = 1.35;
    head.scale.set(0.9, 1.04, 0.86);
    head.castShadow = true;
    root.add(head);

    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hairCap.position.set(0, 1.54, 0);
    hairCap.scale.set(0.96, 0.62, 0.9);
    hairCap.rotation.x = -0.06;
    hairCap.castShadow = true;
    root.add(hairCap);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.3, 24), skin);
    neck.position.y = 0.82;
    root.add(neck);

    const glasses = new THREE.Group();
    const lensGeometry = new THREE.TorusGeometry(0.15, 0.012, 8, 28);
    const leftLens = new THREE.Mesh(lensGeometry, ink);
    const rightLens = new THREE.Mesh(lensGeometry, ink);
    leftLens.position.set(-0.19, 1.38, 0.49);
    rightLens.position.set(0.19, 1.38, 0.49);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.018), ink);
    bridge.position.set(0, 1.38, 0.49);
    glasses.add(leftLens, rightLens, bridge);
    root.add(glasses);

    const laptop = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.95), ink);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.92, 0.06), paper);
    base.position.set(0, -0.58, 0.76);
    screen.position.set(0, -0.18, 0.36);
    screen.rotation.x = -0.28;
    const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), ember);
    sticker.position.set(0.45, -0.13, 0.32);
    sticker.rotation.x = -0.28;
    laptop.add(base, screen, sticker);
    root.add(laptop);

    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.82, 8, 16), hoodie);
    const rightArm = leftArm.clone();
    leftArm.position.set(-0.72, 0.05, 0.16);
    rightArm.position.set(0.72, 0.05, 0.16);
    leftArm.rotation.z = -0.44;
    rightArm.rotation.z = 0.44;
    leftArm.rotation.x = 0.38;
    rightArm.rotation.x = 0.38;
    root.add(leftArm, rightArm);

    const city = new THREE.Group();
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: "#2c2117", roughness: 0.88 });
    for (let index = 0; index < 9; index += 1) {
      const width = 0.32 + (index % 3) * 0.12;
      const height = 0.75 + (index % 4) * 0.28;
      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.28), buildingMaterial);
      building.position.set(-3.2 + index * 0.8, -0.75 + height / 2, -1.3);
      city.add(building);
    }
    scene.add(city);

    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 64),
      new THREE.MeshStandardMaterial({
        color: "#46523c",
        roughness: 0.28,
        metalness: 0.12,
        transparent: true,
        opacity: 0.72,
      }),
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = -0.96;
    puddle.receiveShadow = true;
    scene.add(puddle);

    const rainMaterial = new THREE.LineBasicMaterial({ color: "#c9d6ae", transparent: true, opacity: 0.48 });
    const rain = new THREE.Group();
    for (let index = 0; index < 72; index += 1) {
      const x = (Math.random() - 0.5) * 7.5;
      const y = Math.random() * 4.8;
      const z = -2.6 + Math.random() * 4.2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x + 0.08, y - 0.42, z),
      ]);
      rain.add(new THREE.Line(geometry, rainMaterial));
    }
    scene.add(rain);

    const ambient = new THREE.HemisphereLight("#f7ead2", "#1f271d", 2.5);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#f5a45d", 2.4);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.PointLight("#9fb07f", 2.8, 8);
    fill.position.set(-2.4, 1.6, 2.8);
    scene.add(fill);

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      const safeHeight = Math.max(height, 320);
      renderer.setSize(width, safeHeight, false);
      camera.aspect = width / safeHeight;
      camera.updateProjectionMatrix();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    let animationId = 0;
    function animate() {
      frame += 0.016;
      root.rotation.y = Math.sin(frame * 0.7) * 0.18;
      root.position.y = Math.sin(frame * 1.6) * 0.035;
      laptop.rotation.y = Math.sin(frame * 1.2) * 0.04;
      rain.position.y -= 0.055;
      if (rain.position.y < -1.2) rain.position.y = 0;
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
        }
      });
      [skin, hair, hoodie, ink, ember, paper, buildingMaterial, rainMaterial].forEach((material) => {
        material.dispose();
      });
    };
  }, [character]);

  return (
    <div className="min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#151a12]">
      <div ref={mountRef} className="h-[360px] w-full md:h-[440px]" data-avatar-canvas />
    </div>
  );
}
