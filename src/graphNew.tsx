import { useEffect, useRef } from "react";

// Helper function to find *only* the new data points
// This is necessary because NewApp sends the *entire* rolling buffer
const findNewPoints = (
  prev: number[],
  next: number[]
): number[] => {
  if (!prev || prev.length === 0) {
    return next; // First time, all data is new
  }

  const lastPrevPoint = prev[prev.length - 1];
  const lastPrevTime = prev[prev.length - 2] || lastPrevPoint; // Look at last 2 for more uniqueness

  // Find where the old data ends in the new data array
  let splitIndex = -1;
  for (let i = next.length - 2; i >= 0; i--) {
    if (next[i] === lastPrevTime && next[i + 1] === lastPrevPoint) {
      splitIndex = i + 2; // index *after* the last old point
      break;
    }
  }

  if (splitIndex === -1) {
    // Couldn't find a match, maybe a total desync or just one point
    // Try finding just the last point
    const lastIndex = next.lastIndexOf(lastPrevPoint);
    if (lastIndex !== -1) {
      splitIndex = lastIndex + 1;
    } else {
      // Total desync, just return the last few points to avoid huge jump
      return next.slice(-100); // Return last 100 points as "new"
    }
  }

  if (splitIndex >= next.length) {
    return []; // No new points found
  }

  return next.slice(splitIndex); // Return only the truly new part
};


interface GraphProps {
  signalKey: string;
  signals: { [key: string]: number[] };
  maxPoints: number;
}

const SignalGraph = ({ signalKey, signals, maxPoints }: GraphProps) => {
  const height = 200;
  const gridRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef<HTMLCanvasElement | null>(null);
  
  // --- Animation Buffers ---
  // Stores data that has *arrived* but not been *rendered* yet
  const dataQueueRef = useRef<number[]>([]);
  // Stores data that is *visible* on the canvas (maxPoints long)
  const renderBufferRef = useRef<number[]>([]);
  // Stores the *previous* signals prop to compare against
  const prevDataRef = useRef<number[]>([]);
  
  // --- Animation Loop Refs ---
  const rAFRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  // How fast to "consume" data from the queue. 16ms = ~60fps
  const animationInterval = 16; 

  // Draw static grid once (No changes)
  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // ... (rest of grid drawing logic is identical) ...
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = rect;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(200,200,200,0.2)";
    const gridSize = 20;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // STEP 1: Add new data to the queue when props change
  useEffect(() => {
    const newData = signals[signalKey] || [];
    const prevData = prevDataRef.current;

    const newPoints = findNewPoints(prevData, newData);
    
    if (newPoints.length > 0) {
      dataQueueRef.current.push(...newPoints);
    }
    
    prevDataRef.current = newData;
  }, [signals, signalKey]);

  // STEP 2: Main animation loop (rAF)
  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const midY = height / 2;

    const draw = (timestamp: number) => {
      rAFRef.current = requestAnimationFrame(draw);
      
      const elapsed = timestamp - lastUpdateTimeRef.current;
      
      // Only update and draw at our fixed interval (e.g., 60fps)
      if (elapsed > animationInterval) {
        lastUpdateTimeRef.current = timestamp - (elapsed % animationInterval);
        
        // Consume one point from the queue
        if (dataQueueRef.current.length > 0) {
          const newPoint = dataQueueRef.current.shift()!;
          renderBufferRef.current.push(newPoint);
          
          // Maintain the render buffer size
          while (renderBufferRef.current.length > maxPoints) {
            renderBufferRef.current.shift();
          }
        }
        
        // --- Start Drawing ---
        ctx.clearRect(0, 0, width, height);
        
        // Middle line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();

        const data = renderBufferRef.current;
        if (data.length < 2) return; // Not enough data to draw

        // --- Draw the line ---
        const xStep = width / (maxPoints - 1);

        // Pad the start if buffer isn't full
        const pointsToPad = maxPoints - data.length;
        const startX = pointsToPad * xStep;

        ctx.beginPath();
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;

        let prevX = startX;
        let prevY = midY - data[0] * (height / 2);
        ctx.moveTo(prevX, prevY);

        for (let i = 1; i < data.length; i++) {
          const currX = startX + i * xStep;
          const currY = midY - data[i] * (height / 2);

          const midX = (prevX + currX) / 2;
          const midYPoint = (prevY + currY) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midYPoint);

          prevX = currX;
          prevY = currY;
        }
        
        ctx.lineTo(prevX, prevY);
        ctx.stroke();
      }
    };

    // Start the loop
    rAFRef.current = requestAnimationFrame(draw);

    // Clean up
    return () => {
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
      }
    };
  }, [maxPoints, height]); // Re-run if canvas geometry changes

  // --- JSX (No changes) ---
  const yTicks = [1, 0.5, 0, -0.5, -1];
  return (
    <div style={{ position: "relative", width: "90%", height: `${height}px`, margin: "30px auto" }}>
      <div style={{
        position: "absolute",
        top: "-2em",
        left: "46%",
        textAlign: "center",
        fontSize: "1.5em",
        fontWeight: "bold",
        color: "white",
      }}>
        {signalKey}
      </div>
      <div style={{
        position: "absolute",
        top: "0px",
        left: "-25px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: `${height}px`,
        color: "white",
        fontSize: "10px",
      }}>
        {yTicks.map((val) => <div key={val}>{val}</div>)}
      </div>
      <canvas ref={gridRef} style={{ width: "100%", height: `${height}px`, position: "absolute", top: 0, left: 0, zIndex: 1 }} />
      <canvas ref={graphRef} style={{ width: "100%", height: `${height}px`, position: "absolute", top: 0, left: 0, zIndex: 2 }} />
    </div>
  );
};


// --- MultiSignalGraph component (No changes needed) ---

interface MultiSignalGraphProps {
  signals: { [key: string]: number[] };
  maxPoints?: number;
}

const MultiSignalGraph = ({
  signals,
  maxPoints = 1000,
}: MultiSignalGraphProps) => {
  const signalKeys = Object.keys(signals).filter((k) => !k.endsWith("_time"));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        margin: "20px auto",
        width: "95%",
      }}
    >
      {signalKeys.map((key) => (
        <SignalGraph
          key={key}
          signalKey={key}
          signals={signals}
          maxPoints={maxPoints}
        />
      ))}
    </div>
  );
};

export default MultiSignalGraph;