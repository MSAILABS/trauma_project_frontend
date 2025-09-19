import { useEffect, useRef, useState } from "react";
import axios from "axios";
// import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "./App.css";
import Graph from "./graph";
import BeatButton from "./beatButton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

function App() {
  let numberOfPart = -1;
  let indexForPoint = 0;
  const [graphLabels, setGraphLabels] = useState<string[]>([]);
  const [timeLabel, setTimeLabel] = useState<string>("");
  const [graphData, setGraphData] = useState<any>({});
  const [numberOfPointPerPage, setNumberOfPointsPerPage] = useState<number>(0);
  const [points, setPoints] = useState<number[][]>([]);
  const graphDataRef = useRef(graphData);
  const indexRef = useRef(0);

  const [isAnalysis, setIsAnalysis] = useState(false);

  const get_data = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/get_array/${numberOfPart}`
      );

      if (res.data) {
        const newLabels: string[] = [];

        setGraphData((prevData: any) => {
          const tempData = { ...prevData };

          let isDataPresent = false;

          for (const key in res.data) {
            isDataPresent = true;
            if (key.search("time") < 0) {
              newLabels.push(key);

              const ecg = res.data[key];
              const ecg_time = res.data[`${key}_time`];

              setNumberOfPointsPerPage(res.data[key].length);

              if (Object.hasOwn(tempData, key)) {
                tempData[key] = [...tempData[key], ...ecg];
                // tempData[`${key}_time`] = [
                //   ...tempData[`${key}_time`],
                //   ...ecg_time,
                // ];

                let i = tempData[`${key}_time`].length;
                tempData[`${key}_time`] = [
                  ...tempData[`${key}_time`],
                  ...ecg_time.map(() => {
                    i += 1;
                    return i;
                  }),
                ];
              } else {
                tempData[key] = ecg;
                // tempData[`${key}_time`] = ecg_time;
                let i = 0;
                tempData[`${key}_time`] = ecg_time.map(() => {
                  i += 1;
                  return i;
                });
              }
            } else {
              setTimeLabel(key);
            }
          }

          if (isDataPresent) {
            numberOfPart++;
          }

          return tempData; // new reference each time
        });

        setGraphLabels(newLabels);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    get_data();
    const interval = setInterval(() => {
      get_data();
    }, 1000); // fetch every second
    return () => clearInterval(interval);
  }, []);

  const get_canvases = () => {
    return points.map((row, idx) => (
      <Graph key={idx} title={graphLabels[idx]} data={row} />
    ));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const latestData = graphDataRef.current; // ✅ always latest

      const newPoints: number[][] = [];
      let i = 0;

      for (const key in latestData) {
        if (key.includes("time")) continue;

        if (latestData[key].length > 0) {
          if (indexRef.current > latestData[key].length) {
            return;
          }
        }

        console.log(indexRef.current);

        const element = -latestData[key][indexRef.current];

        console.log(key, element);

        if (points.length > 0) {
          newPoints.push([element, ...points[i]]);
        } else {
          newPoints.push([element]);
        }

        i++;
      }

      indexRef.current += 1;

      setPoints(newPoints);
    }, 10);

    return () => clearInterval(interval);
  }, [points, indexForPoint]);

  // keep ref updated
  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  return (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: "50px",
        margin: "0px auto",
        width: "95vw",
      }}
    >
      <h1 style={{ marginBottom: "-20px" }}>Realtime ECG</h1>
      <div style={{ width: "90vw", display: "grid" }}>
        {/* <Line style={{ width: "100%" }} data={data} options={options} /> */}
        {/* <Graph data={tempData} /> */}
        {get_canvases()}
      </div>
      {points.length > 0 &&
        (isAnalysis ? (
          <BeatButton
            width={300}
            color1="rgba(0, 187, 187, 1)"
            color2="rgba(0, 139, 106, 1)"
            beats={100}
            label="Analysing Data"
            speed={300}
          />
        ) : (
          <button onClick={() => setIsAnalysis(!isAnalysis)}>Analyze</button>
        ))}
    </div>
  );
}

export default App;
