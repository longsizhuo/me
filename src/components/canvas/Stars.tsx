/* eslint-disable react/no-unknown-property */
import { PointMaterial, Points, Preload } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as random from "maath/random/dist/maath-random.esm";
import { Suspense, useRef, useState, type ComponentRef } from "react";
import { useOnScreen } from "./useOnScreen";
import type { StarsProps } from "./TYPE";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const Stars = (props: StarsProps) => {
  // Derived from drei's <Points> rather than importing THREE.Points directly:
  // "three" ships no types of its own and @types/three is only reachable
  // through drei's/fiber's own dependency tree, not this project's root
  // node_modules — ComponentRef sidesteps needing to resolve it ourselves.
  const ref = useRef<ComponentRef<typeof Points>>(null);
  const [sphere] = useState(() => {
    const count = isMobile ? 3000 : 15000;
    const positions = random.inSphere(new Float32Array(count), { radius: 1.2 });
    // 验证并清理所有非有限值
    for (let i = 0; i < positions.length; i++) {
      if (!Number.isFinite(positions[i])) {
        positions[i] = 0;
      }
    }
    return positions;
  });

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color="#f272c8"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrapperRef);

  return (
    <div ref={wrapperRef} className="w-full h-auto absolute inset-0 z-[-1]">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        // 滚出屏幕就停止渲染；高分屏最多按 1.5 倍像素画，星点这么小看不出区别
        frameloop={onScreen ? "always" : "never"}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Stars />
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default StarsCanvas;
