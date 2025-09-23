import { Bar } from "react-chartjs-2";

const labels = ["January", "February", "March", "April", "May", "June", "July"];

const dataset = labels.map(() => Math.random() * 255);

// Find max value
const maxValue = Math.max(...dataset);

const data = {
  labels,
  datasets: [
    {
      label: "",
      data: dataset, // 0 to 1000
      backgroundColor: "#242424",
      borderWidth: 2,
      borderColor: dataset.map((val) => (val === maxValue ? "red" : "cyan")),
    },
  ],
};

const BarChat = () => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Results after Analyzing data",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "silver", // ✅ rgba(100, 100, 100, 0.7) x-axis labels
        },
        grid: {
          color: "rgba(100, 100, 100, 0.7)", // ✅ rgba(100, 100, 100, 0.7) vertical grid lines
        },
      },
      y: {
        ticks: {
          color: "silver", // ✅ rgba(100, 100, 100, 0.7) y-axis labels
        },
        grid: {
          color: "rgba(100, 100, 100, 0.7)", // ✅ rgba(100, 100, 100, 0.7) horizontal grid lines
        },
      },
    },
  };

  return <Bar options={options} data={data} />;
};

export default BarChat;
