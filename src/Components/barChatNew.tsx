import { Bar } from "react-chartjs-2";
import ChartDataLabels, { type Context } from "chartjs-plugin-datalabels";
import { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface Signals {
  [key: string]: number[];
}

interface Meta {
  [key: string]: any[];
}

interface DataState {
  signals: Signals;
  meta: Meta;
}

interface BarChartProps {
  signalKey: string;
  chartData: DataState;
  index: number;
}

const des: { [key: string]: string[] } = {
  "Airway & Respiration": [
    "Endotracheal Intubation/Intubation",
    "Mechanical Ventilation",
    "RSI meds",
    "intubation",
  ],
  "Bleeding Control": ["Pelvic Binder"],
  "Blood Products": ["0 < FF < 3", "0 < RBC < 3", "RBC >= 3"],
};

const SingleSignalChart = ({ signalKey, chartData, index }: BarChartProps) => {
  const metaKeys = Object.keys(chartData.meta).filter(
    (k) => k !== "lsi_description" && k !== "lsi_sampling_rate"
  );

  // Use meta values for the bars
  const dataset = metaKeys.map((key) => {
    const valuesArray = chartData.meta[key] || [];

    return valuesArray[index] ?? 0; // pick the value at current segment
  });

  const maxValue = Math.max(...dataset);
  const maxIndex = dataset.indexOf(maxValue);

  const data = {
    labels: metaKeys.map((k) => k.replace("lsi_", "")),
    datasets: [
      {
        label: "Meta Values",
        data: dataset,
        backgroundColor: dataset.map((val, i) =>
          i === maxIndex && val > 0.5 ? "red" : "cyan"
        ),
        borderWidth: 2,
        borderColor: dataset.map((val, i) =>
          i === maxIndex && val > 0.5 ? "red" : "cyan"
        ),
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: signalKey },
          datalabels: {
            display: true,
            color: "white",
            anchor: "end",
            align: "top",
            formatter: (value: number, context: Context) => {
              const label: any = context.chart.data.labels?.[context.dataIndex];

              if (value === maxValue && maxValue > 0.5) {
                if (Object.hasOwn(des, label)) {
                  return des[label][0]
                }
              }
              
              return "";
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "silver" },
            grid: { color: "rgba(100,100,100,0.7)" },
          },
          y: {
            min: 0,
            max: 1.2,
            ticks: { color: "silver" },
            grid: { color: "rgba(100,100,100,0.7)" },
          },
        },
      }}
    />
  );
};

const MultiSignalCharts = ({ chartData }: { chartData: DataState }) => {
  const [segmentIndex, setSegmentIndex] = useState(0);

  useEffect(() => {
    if (!chartData.meta.sampling_rate) return;

    const samplingRate = chartData.meta.sampling_rate[0]; // assuming constant
    const interval = setInterval(() => {
      setSegmentIndex((prev) => {
        // Loop around when reaching end of signals
        const anySignal = Object.values(chartData.signals)[0];
        if (!anySignal) return 0;
        return prev + 1 < anySignal.length ? prev + 1 : 0;
      });
    }, 1000 / samplingRate);

    return () => clearInterval(interval);
  }, [chartData]);

  const signalKeys = Object.keys(chartData.signals).filter(
    (k) => !k.endsWith("_time")
  );

  return (
    <div
      style={{
        height: "400px",
        margin: "20px auto",
        textAlign: "center",
        display: "grid",
        justifyContent: "center",
      }}
    >
      {signalKeys.map((signalKey, i) => {
        if (i == 0) {
          return (
            <SingleSignalChart
              key={signalKey}
              signalKey={signalKey}
              chartData={chartData}
              index={segmentIndex}
            />
          );
        }
      })}
    </div>
  );
};

export default MultiSignalCharts;
