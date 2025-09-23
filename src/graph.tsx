import { useEffect, useRef } from "react";

interface GraphParams {
  title: string;
  data: number[];
}

const Graph = ({ title, data }: GraphParams) => {
  const height = 250;
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

  // ✅ Graph drawing
  const draw = (
    context: CanvasRenderingContext2D | null | undefined,
    xSlider: number
  ) => {
    if (!context) return;

    const { width } = context.canvas;
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
    const xStep = width / 1000; // adjust number of points shown
    const delta = xSlider % width;
    const color = "rgba(0, 255, 255, 1)";

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 2;

    if (data.length > 0) {
      // 🔄 Start at the RIGHT side instead of left
      let prevX = width - delta;
      let prevY = ((data[0] + 1) / 2) * height; // ✅ flipped (inverse Y)
      context.moveTo(prevX, prevY);

      for (let i = 1; i < data.length; i++) {
        // 🔄 Move to the left as i increases
        const currX = width - (delta + i * xStep);
        const currY = ((data[i] + 1) / 2) * height; // ✅ flipped (inverse Y)

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

  // ✅ Y axis ticks [-1, -0.5, 0, 0.5, 1]
  const yTicks = [1, 0.5, 0, -0.5, -1];

  return (
    <div
      style={{
        position: "relative",
        width: "90%",
        height: `${height}px`, // taller for labels
        margin: "50px auto",
      }}
    >
      {/* ✅ Title */}
      <div
        style={{
          position: "absolute",
          top: "-1em",
          left: "46%",
          textAlign: "center",
          fontSize: "2em",
          fontWeight: "bold",
          color: "white",
          marginBottom: "1em",
        }}
      >
        {title}
      </div>

      {/* ✅ Y-axis label (outside, left) */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "-25px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          marginRight: "8px",
          height: `${height}px`,
          color: "white",
          fontSize: "10px",
          fontWeight: "bold",
        }}
      >
        {yTicks.map((val) => (
          <div key={val} style={{}}>
            {val}
          </div>
        ))}
      </div>

      {/* ✅ X-axis label (outside, bottom) */}
      {/* <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "14px",
          fontWeight: "bold",
          color: "white",
        }}
      >
        X Axis
      </div> */}

      {/* Grid canvas */}
      <canvas
        ref={gridRef}
        style={{
          width: "100%",
          height: `${height}px`,
          position: "absolute",
          top: 30,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Graph canvas */}
      <canvas
        ref={graphRef}
        id="graph_canvas"
        style={{
          width: "100%",
          height: `${height}px`,
          position: "absolute",
          top: 30,
          left: 0,
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default Graph;
