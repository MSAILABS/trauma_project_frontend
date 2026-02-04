import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, type ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface ECGChartProps {
	signals: { [key: string]: number[] }
	title?: string
}

const ECGChartJS: React.FC<ECGChartProps> = ({ signals }) => {
	// Common options for high-performance ECG rendering
	const commonOptions: ChartOptions<'line'> = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false, // Set to false for real-time performance
		elements: {
			point: {
				radius: 0, // No dots on lines
				hoverRadius: 0, // No dots on hover
				hitRadius: 10, // Maintain interaction \
			}, // Hide points for a clean line
			line: { tension: 0.1, borderWidth: 1.5 },
		},
		scales: {
			x: {
				display: true,
				grid: { color: 'rgba(200, 200, 200, 0.2)' },
				ticks: { display: false }, // Hide labels for smoother look
			},
			y: {
				beginAtZero: false,
				grid: { color: 'rgba(255, 0, 0, 0.1)' }, // Mimic ECG paper grid
			},
		},
		plugins: {
			legend: {
				position: 'right',
				align: 'center', // Aligns to the left
				labels: {
					color: 'white', // Sets text color to white
					boxWidth: 0, // Removes the colored rectangle
					font: {
						size: 20, // Sets font size to 20px
						weight: 'bold',
					},
					padding: 10, // Adds space around the text
				},
			},
			tooltip: {
				enabled: true, // Keep for context
				displayColors: false, // Clean up the box
				callbacks: {
					// Redact the X-axis coordinate from title
					title: () => '',
					// Redact the Y-axis coordinate from label
					label: context => context.dataset.label,
				},
			},
			// Explicitly handle datalabels if the plugin is registered
			datalabels: {
				display: false,
			},
		},
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
			{Object.entries(signals).map(([leadName, dataPoints]) => {
				const chartData = {
					labels: new Array(dataPoints.length).fill(''), // X-axis labels (empty for performance)
					datasets: [
						{
							label: `Lead ${leadName}`,
							data: dataPoints,
							borderColor: '#00f2ff', // ECG Pink/Red
							backgroundColor: 'rgba(30, 118, 233, 0.5)',
						},
					],
				}

				return (
					<div
						key={leadName}
						style={{
							height: '200px',
							backgroundColor: 'transparent',
							borderRadius: '8px',
							padding: '10px',
							boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
						}}>
						<Line
							data={chartData}
							options={commonOptions}
						/>
					</div>
				)
			})}
		</div>
	)
}

export default ECGChartJS
