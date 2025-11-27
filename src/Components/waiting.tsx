import { useEffect, useState } from "react";

const WaitingForData = () => {
  const dotsArray = [".", "..", "..."];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % dotsArray.length);
    }, 500); // changes every 0.5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <h2 style={{ marginTop: "30px", opacity: 0.7 }}>
      Waiting for signal{dotsArray[index]}
    </h2>
  );
};

export default WaitingForData;
