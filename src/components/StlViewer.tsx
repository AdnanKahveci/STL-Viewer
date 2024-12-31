'use client'

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

interface StlViewerProps {
  file: string;
  onGeometryLoad?: (geometry: BufferGeometry) => void;
}

export default function StlViewer({ file, onGeometryLoad }: StlViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const loader = new STLLoader();
    loader.load(file, (geometry) => {
      // Geometriyi normalize et
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      
      // Boyutları logla
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      console.log('Model boyutları (mm):', {
        width: size.x,
        height: size.y,
        depth: size.z,
        volume: size.x * size.y * size.z / 1000 // Yaklaşık hacim (cm³)
      });

      // Geometri verilerini kontrol et
      console.log('Geometri verileri:', {
        vertices: geometry.attributes.position.count,
        triangles: geometry.attributes.position.count / 3,
        boundingBox: geometry.boundingBox
      });

      // Modeli görüntüleme için ölçeklendir
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      geometry.scale(scale, scale, scale);
      geometry.center();

      const material = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        shininess: 50,
        specular: 0x111111,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Orijinal (ölçeklendirilmemiş) geometriyi gönder
      if (onGeometryLoad) {
        const originalGeometry = geometry.clone();
        originalGeometry.scale(1/scale, 1/scale, 1/scale);
        console.log('STL yüklendi, geometri gönderiliyor');
        onGeometryLoad(originalGeometry);
      }

      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
    });

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Otomatik döndürme
    let rotation = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y = rotation;
      rotation += 0.005;
      renderer.render(scene, camera);
    };

    animate();

    // Pencere boyutu değiştiğinde güncelle
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [file, onGeometryLoad]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-[400px] rounded-lg overflow-hidden"
    />
  );
} 