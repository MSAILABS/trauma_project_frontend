import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, type ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface ECGChartProps {
	signals: { [key: string]: number[] }
	duration?: number // Time in seconds for the full width of the graph
}

const ECGChartJS: React.FC<ECGChartProps> = ({ signals, duration = 2 }) => {
	const commonOptions: ChartOptions<'line'> = {
		responsive: true,
		maintainAspectRatio: false,
		// Enabling animation for the "sliding" effect
		animation: {
			duration: 300, // Smooth transition when data shifts
			easing: 'linear',
		},
		elements: {
			point: {
				radius: 0,
				hoverRadius: 0,
			},
			line: {
				tension: 0, // Smooth organic waveform
				borderWidth: 2,
			},
		},
		scales: {
			x: {
				display: true,
				grid: { color: 'rgba(200, 200, 200, 0.2)' },
				ticks: { display: false }, // Hide labels for smoother look
			},
			y: {
				// Fixed range ensures the graph doesn't "jump" vertically
				suggestedMin: -1,
				suggestedMax: 1,
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
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '15px',
				padding: '20px',
			}}>
			{Object.entries(signals).map(([leadName, dataPoints]) => {
				// To make it look like it's moving right to left,
				// we only show the last 'N' points based on duration.
				// Assuming 500Hz sampling rate, points = duration * 500
				const pointsToShow = duration * 500
				const displayedData = dataPoints.slice(-pointsToShow)

				const chartData = {
					labels: new Array(displayedData.length).fill(''),
					datasets: [
						{
							label: `Lead ${leadName}`,
							data: displayedData,
							borderColor: '#00f2ff',
							backgroundColor: 'transparent',
							fill: false,
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
