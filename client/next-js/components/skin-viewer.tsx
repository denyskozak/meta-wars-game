"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { assetUrl } from "@/utilities/assets";

export interface SkinViewerProps {
  skin: string | null;
}

export function SkinViewer({ skin }: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !skin) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 2.5);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    scene.add(hemi);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;

    const draco = new DRACOLoader();
    draco.setDecoderPath("/libs/draco/");

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.setPath(assetUrl("/models/skins/"));

    let model: THREE.Object3D | null = null;

    loader.load(`${skin}.glb`, (gltf) => {
      model = gltf.scene;
      model.rotation.y = Math.PI;
      scene.add(model);
    });

    const handleResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      draco.dispose();
      renderer.dispose();
    };
  }, [skin]);

  return <canvas ref={canvasRef} className="w-full h-48" />;
}

export default SkinViewer;

