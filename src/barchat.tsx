import { Bar } from "react-chartjs-2";
import ChartDataLabels, { type Context } from "chartjs-plugin-datalabels";
import { Chart as ChartJS } from "chart.js";

ChartJS.register(ChartDataLabels);

interface BarChartParms {
  chartData: { [key: string]: number[] };
  index: number;
}

const BarChat = ({ chartData, index }: BarChartParms) => {
  const labels = Object.keys(chartData).filter(
    (k) => k !== "description" && k !== "sampling_rate"
  );
  const dataset = labels.map((label) => chartData[label][index]);

  const description = chartData["description"][index] ?? "None";

  const maxValue = Math.max(...dataset);
  const maxIndex = dataset.indexOf(maxValue);

  const data = {
    labels,
    datasets: [
      {
        label: "",
        data: dataset,
        backgroundColor: dataset.map((val) =>
          val === maxValue && val > 0.5 ? "red" : "cyan"
        ),
        borderWidth: 2,
        borderColor: dataset.map((val) =>
          val === maxValue && val > 0.5 ? "red" : "cyan"
        ),
      },
    ],
  };

  // const options = {
  //   responsive: true,
  //   plugins: {
  //     legend: { display: false },
  //     title: { display: true, text: "Results after Analyzing data" },
  //     datalabels: {
  //       display: (context: any) => context.dataIndex === maxIndex, // ❗only show on max bar
  //       color: "white",
  //       anchor: "end",
  //       align: "top",
  //       formatter: () => description, // ❗single description, not an array
  //     },
  //   },
  //   scales: {
  //     x: {
  //       ticks: { color: "silver" },
  //       grid: { color: "rgba(100, 100, 100, 0.7)" },
  //     },
  //     y: {
  //       ticks: { color: "silver" },
  //       grid: { color: "rgba(100, 100, 100, 0.7)" },
  //     },
  //   },
  // };

  const des: {[key: string]: string[]} = {
    "Airway & Respiration": [
      "Endotracheal Intubation/Intubation",
      "Mechanical Ventilation",
      "RSI meds",
      "intubation",
    ],
    "Bleeding Control": ["Pelvic Binder"],
    "Blood Products": ["0 < FF < 3", "0 < RBC < 3", "RBC >= 3"],
  };

  return (
    <Bar
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Results after Analyzing data" },
          datalabels: {
            display:
              maxValue > 0.5
                ? (context: Context) => {
                    let l = false;

                    for (const key in des) {
                      if (key === labels[maxIndex])
                        if (des[key].includes(`${description}`)) {
                          l = true;
                        }
                    }

                    return l && context.dataIndex === maxIndex;
                  }
                : false,
            color: "white",
            anchor: "end",
            align: "top",
            formatter: () => `${description}` === "None" ? "" : description,
          },
        },
        scales: {
          x: {
            ticks: { color: "silver" },
            grid: { color: "rgba(100, 100, 100, 0.7)" },
          },
          y: {
            min: 0,
            max: 1,
            ticks: { color: "silver" },
            grid: { color: "rgba(100, 100, 100, 0.7)" },
          },
        },
      }}
      data={data}
    />
  );
};

export default BarChat;
