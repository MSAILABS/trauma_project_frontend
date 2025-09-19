import { useEffect, useRef } from "react";

interface GraphParams {
  title: string;
  data: number[];
}

const Graph = ({ title, data }: GraphParams) => {
  const gridRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef<HTMLCanvasElement | null>(null);

  // ✅ Draw grid once
  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context?.scale(dpr, dpr);

    if (!context) return;

    const { width, height } = rect;
    context.clearRect(0, 0, width, height);

    context.strokeStyle = "rgba(200,200,200,0.3)";
    context.lineWidth = 1;

    const gridSize = 20;

    // vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    // horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }, []);

  // ✅ Graph drawing (your original logic untouched)
  const draw = (
    context: CanvasRenderingContext2D | null | undefined,
    xSlider: number
  ) => {
    if (!context) return;

    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);

    // --- White horizontal line at middle ---
    context.beginPath();
    context.strokeStyle = "rgba(255,255,255,0.5)";
    context.lineWidth = 2;
    const midY = height / 2;
    context.moveTo(0, midY);
    context.lineTo(width, midY);
    context.stroke();

    // ✅ scale factor for horizontal spacing
    const xStep = width / 1000; // each point fits inside canvas width

    const delta = xSlider % width; // keep scrolling
    const color = "rgba(0, 255, 255, 1)";

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 2;

    if (data.length > 0) {
      let prevX = delta;
      let prevY = data[0] * 100 + height / 3;
      context.moveTo(prevX, prevY);

      for (let i = 1; i < data.length; i++) {
        const currX = delta + i * xStep;
        const currY = data[i] * 100 + height / 2.5;

        const midX = (prevX + currX) / 2;
        const midY = (prevY + currY) / 2;

        context.quadraticCurveTo(prevX, prevY, midX, midY);

        prevX = currX;
        prevY = currY;
      }
      context.lineTo(prevX, prevY);
    }

    context.stroke();
  };

  // ✅ animate graph
  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context?.scale(dpr, dpr);

    let xSlider = 0.1;
    let animationId = 0;

    const renderer = () => {
      draw(context, xSlider);
      animationId = window.requestAnimationFrame(renderer);
    };
    renderer();

    return () => window.cancelAnimationFrame(animationId);
  }, [data]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "340px", // a bit taller for title
        margin: "50px auto",
      }}
    >
      {/* ✅ Title outside of canvas */}
      <div
        style={{
          textAlign: "center",
          fontSize: "18px",
          fontWeight: "bold",
          color: "white",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      {/* Grid canvas (bottom layer) */}
      <canvas
        ref={gridRef}
        style={{
          width: "100%",
          height: "300px",
          position: "absolute",
          top: 30, // leave space for title
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Graph canvas (top layer) */}
      <canvas
        ref={graphRef}
        id="graph_canvas"
        style={{
          width: "100%",
          height: "300px",
          position: "absolute",
          top: 30, // same offset
          left: 0,
          zIndex: 2,
          transform: "scaleX(-1)",
        }}
      />
    </div>
  );
};

export default Graph;
