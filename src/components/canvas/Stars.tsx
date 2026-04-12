/* eslint-disable react/no-unknown-property */
import { PointMaterial, Points, Preload } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as random from "maath/random/dist/maath-random.esm";
import { Suspense, useRef, useState } from "react";
import type { StarsProps } from "./TYPE";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const Stars = (props: StarsProps) => {
  const ref = useRef();
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
  return (
    <div className="w-full h-auto absolute inset-0 z-[-1]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <Stars />
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default StarsCanvas;
