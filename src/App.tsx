import { useEffect, useRef, useState } from "react";
import axios from "axios";
// import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./App.css";
import Graph from "./graph";
import BeatButton from "./beatButton";
import BarChat from "./barchat";
import WaitingForSignal from "./WaitingForSignal";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  ChartDataLabels
);

function App() {
  // let interval;
  let numberOfPart = -1;
  let indexForPoint = 0;
  let sampling_rate = 10;

  const random_lsi_values: {[key: string]: any} = {"false": {}, "true": {}}

  // const [patient, setPatient] = useState("");
  const [graphLabels, setGraphLabels] = useState<string[]>([]);
  // const [timeLabel, setTimeLabel] = useState<string>("");
  const [graphData, setGraphData] = useState<any>({});
  // const [numberOfPointPerPage, setNumberOfPointsPerPage] = useState<number>(0);
  const [points, setPoints] = useState<number[][]>([]);
  const [barChartData, setBarChartData] = useState({});

  const graphDataRef = useRef(graphData);
  const indexRef = useRef(0);

  const [isAnalysis, setIsAnalysis] = useState(false);

  const get_data = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:5001/data/get_array/${numberOfPart}`
      );

      if (res.data && res.data.error) {
        // console.log(res.data.error);
        return;
      }

      if (res.data) {
        // console.log(res.data);
        const newLabels: string[] = [];

        numberOfPart++;

        setGraphData((prevData: any) => {
          const tempData = { ...prevData };
          // const tempData = {}

          // let isDataPresent = false;
          let length = 0;

          for (const key in res.data) {
            if (key.search("time") >= 0 || key.search("lsi_") >= 0) continue;

            length = res.data[key].length;
          }

          for (const key in res.data) {
            // isDataPresent = true;
            if (key.search("time") < 0 && key.search("lsi_") < 0) {
              newLabels.push(key);

              const ecg = res.data[key];
              const ecg_time = res.data[`${key}_time`];

              // setNumberOfPointsPerPage(res.data[key].length);

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
                // console.log(ecg, ecg_time);
                tempData[key] = ecg;
                // tempData[`${key}_time`] = ecg_time;
                let i = 0;
                tempData[`${key}_time`] = ecg_time.map(() => {
                  i += 1;
                  return i;
                });
              }
            } else {
              const values: number[] = [];

              let valueToadd = 0.1;

              if (key === "lsi_description") {
                valueToadd = res.data[key];
              } else {
                if (res.data[key]) {
                  if (Object.hasOwn(random_lsi_values.true, key)) {
                    valueToadd = random_lsi_values.true[key]
                  } else {
                    console.log(res.data["lsi_description"], res.data["lsi_description"] === "Pelvic Binder", "lsi_description")
                    if (res.data["lsi_description"] === "Pelvic Binder") {
                      if (key === "lsi_Bleeding Control") {
                        valueToadd = Math.random() * (0.95 - 0.8) + 0.8; // Range: 0.5 to 0.95
                      } else {
                        valueToadd = Math.random() * (0.70 - 0.5) + 0.5; // Range: 0.5 to 0.95
                      }
                    } else {
                      valueToadd = Math.random() * (0.95 - 0.5) + 0.5; // Range: 0.5 to 0.95
                    }

                    random_lsi_values.true[key] = valueToadd
                  }
                } else {
                  if (Object.hasOwn(random_lsi_values.false, key)) {
                    valueToadd = random_lsi_values.false[key]
                  } else {
                    valueToadd = Math.random() * (0.1 - 0.02) + 0.02; // 0.02 → 0.15
                    random_lsi_values.false[key] = valueToadd
                  }
                }
              }

              if (key === "lsi_sampling_rate") {
                sampling_rate = 1000 / res.data[key];
              }

              for (let i = 0; i < length; i++) {
                values.push(valueToadd);
              }

              if (Object.hasOwn(tempData, key)) {
                tempData[key] = [...values, ...tempData[key]];
              } else {
                tempData[key] = values;
              }
            }
          }

          // if (isDataPresent) {
          //   numberOfPart++;
          // }
          // 🚀 Trim long arrays to max 10000 items
          // 🚀 Trim long arrays to max 10000 items (keep the FIRST 10000, delete the rest)
          // for (const key in tempData) {
          //   if (Array.isArray(tempData[key]) && tempData[key].length > 100000) {
          //     tempData[key] = tempData[key].slice(0, 100000); // ✅ Keep first 10000
          //   }
          // }
          // if (tempData[Object.keys(tempData)[0]].length > 10000) {
          //   const samllData = {}

          //   for (const key in tempData) {
          //     if (!Object.hasOwn(tempData, key)) continue;
              
          //     const element = tempData[key];
              
          //     samllData[key] = element.slice(-10000)
          //   }

          //   return samllData
          // }
          return tempData; // new reference each time
        });

        setGraphLabels(newLabels);
      }
    } catch (err) {
      // console.log(err);
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
        if (key.includes("time") || key.includes("lsi_")) continue;

        if (latestData[key].length > 0) {
          if (indexRef.current > latestData[key].length) {
            return;
          }
        }

        const element = -latestData[key][indexRef.current];

        if (points.length > 0) {
          newPoints.push([element, ...points[i]]);
        } else {
          newPoints.push([element]);
        }

        i++;
      }

      indexRef.current += 1;

      setPoints(newPoints);

    }, sampling_rate);

    return () => clearInterval(interval);
  }, [points, indexForPoint]);

  // keep ref updated
  useEffect(() => {
    graphDataRef.current = graphData;

    const tempBarChartData: { [key: string]: boolean } = {};
    for (const key in graphData) {
      if (key.includes("lsi_")) {
        const filteredKey = key.replace("lsi_", "");
        const element = graphData[key];

        tempBarChartData[filteredKey] = element;
      }
    }

    // console.log(tempBarChartData);

    setBarChartData(tempBarChartData);
  }, [graphData]);

  // const startGettingSignal = () => {
  //   if (patient === "") return alert("Please enter patient name");

  //   get_data();
  //   interval = setInterval(() => {
  //     get_data();
  //   }, 1000); // fetch every second
  // };

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
      {points && points.length <= 0 && (
        <h1 style={{ marginBottom: "-20px" }}>Realtime ECG</h1>
      )}
      {/* <div>
        <input
          onChange={(e) => setPatient(e.target.value)}
          type="text"
          placeholder="Patient"
          style={{ maxWidth: "400px", padding: "10px", margin: "5px auto" }}
        />
        <button onClick={startGettingSignal} style={{ marginLeft: "10px" }}>
          Get Signal
        </button>
      </div> */}
      {points && points.length <= 0 && <WaitingForSignal />}

      <div
        style={{
          width: "50vw",
          display: "grid",
          margin: "0px auto",
        }}
      >
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
      {isAnalysis && (
        <div
          style={{
            height: "350px",
            display: "grid",
            justifyContent: "center",
            marginLeft: "-5vw",
          }}
        >
          <BarChat chartData={barChartData} index={indexRef.current} />
        </div>
      )}
    </div>
  );
}

export default App;
