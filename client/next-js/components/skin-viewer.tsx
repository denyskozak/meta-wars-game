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

  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const loaderRef = useRef<GLTFLoader>();
  const currentModelRef = useRef<THREE.Object3D | null>(null);

  // set up renderer and scene once
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();

    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );

    camera.position.set(0, 1.2, 2.5);
    cameraRef.current = camera;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);

    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1);

    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enablePan = false;
    controls.enableZoom = true;
    controlsRef.current = controls;

    const draco = new DRACOLoader();

    draco.setDecoderPath("/libs/draco/");

    const loader = new GLTFLoader();

    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.setPath(assetUrl("/models/skins/"));
    loaderRef.current = loader;

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
  }, []);

  // load model whenever skin changes
  useEffect(() => {
    if (!skin) return;
    const loader = loaderRef.current;
    const scene = sceneRef.current;

    if (!loader || !scene) return;

    loader.load(`${skin}.glb`, (gltf) => {
      if (currentModelRef.current) {
        scene.remove(currentModelRef.current);
      }
      const model = gltf.scene;

      model.rotation.y = 0;
      currentModelRef.current = model;
      scene.add(model);
    });
  }, [skin]);

  return <canvas ref={canvasRef} className="w-full h-48" />;
}

export default SkinViewer;
