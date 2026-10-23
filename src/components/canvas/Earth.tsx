/* eslint-disable react/no-unknown-property */
import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";

import CanvasLoader from "../Loader";
import { cdnUrl } from "../../content";
import { useOnScreen } from "./useOnScreen";

const Earth = () => {
  // planet-v2：同一个模型，贴图 PNG→JPEG、顶点坐标量化成 16 位整数（three.js 原生支持），
  // 打包成一个 .glb：原来 4 个文件约 2.9MB，现在 1 个文件 1.3MB，样子不变
  const earth = useGLTF(cdnUrl("models/planet-v2/scene.glb"));

  return (
    <primitive object={earth.scene} scale={2.5} position-y={0} rotation-y={0} />
  );
};

const EarthCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrapperRef);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <Canvas
        shadows
        // 看得见时和原来一样按需绘制（demand），滚出屏幕就整个停掉
        frameloop={onScreen ? "demand" : "never"}
        dpr={typeof window !== "undefined" && window.innerWidth < 768 ? [1, 1] : [1, 2]}
        gl={{ preserveDrawingBuffer: true }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [-4, 3, 6],
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            autoRotate
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          <Earth />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EarthCanvas;
