import React, { useEffect, useRef } from "react";

interface BeatButtonProps {
  label?: string;
  width?: number;
  height?: number;
  color1?: string;
  color2?: string;
  beats?: number;
  speed?: number; // ✅ new prop
}

const BeatButton: React.FC<BeatButtonProps> = ({
  label = "Analyzing with AI",
  width = 40,
  height = 20,
  color1 = "lime",
  color2 = "orange",
  beats = 10,
  speed = 200, // ✅ default speed
}) => {
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initAnimation = (
    canvas: HTMLCanvasElement | null,
    color1: string,
    color2: string,
    beats: number
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < beats; i++) {
        const barWidth = width / (beats * 2);
        const x = i * (barWidth * 2) + barWidth / 2;

        // ✅ speed now controls animation frequency
        const amplitude =
          Math.sin(Date.now() / speed + i * 0.7) * (height / 2) + height / 2;

        let barHeight = amplitude;

        if (i % 2 === 1) {
          barHeight = height - amplitude;
          ctx.fillStyle = color2;
          ctx.fillRect(x, 0, barWidth, barHeight);
        } else {
          ctx.fillStyle = color1;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  };

  useEffect(() => {
    const cleanupLeft = initAnimation(
      leftCanvasRef.current,
      color1,
      color2,
      beats
    );
    const cleanupRight = initAnimation(
      rightCanvasRef.current,
      color1,
      color2,
      beats
    );

    return () => {
      cleanupLeft && cleanupLeft();
      cleanupRight && cleanupRight();
    };
  }, [width, height, color1, color2, beats, speed]);

  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "8px 16px",
        borderRadius: "6px",
        background:
          "linear-gradient(90deg, #242424, #242424, #002629ff, #242424, #242424)",
        color: "white",
        cursor: "wait",
        border: "none",
        outline: "none",
        transition: "background 0.2s",
      }}
    >
      <canvas ref={leftCanvasRef} style={{ display: "inline-block" }} />
      <span style={{ textAlign: "center", fontWeight: 500 }}>{label}</span>
      <canvas ref={rightCanvasRef} style={{ display: "inline-block" }} />
    </button>
  );
};

export default BeatButton;
