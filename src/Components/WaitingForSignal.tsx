import { useState, useEffect } from "react";

const WaitingForSignal = () => {
  const [dots, setDots] = useState(1); // Number of dots (1 to 3)

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev < 3 ? prev + 1 : 1)); // Cycle 1 → 2 → 3 → 1
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        color: "white",
        fontSize: "18px",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      Waiting for signal{".".repeat(dots)}
    </div>
  );
};

export default WaitingForSignal;
