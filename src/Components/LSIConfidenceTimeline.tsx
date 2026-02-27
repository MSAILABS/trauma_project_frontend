import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useEffect, useRef, useState } from 'react'

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Meta {
	[key: string]: number[]
}

interface DataState {
	meta: Meta
	second_of_chunks: number
}

interface Props {
	chartData: DataState
}

const THRESHOLD = 0.7

function lsiColor(label: string) {
	let hash = 0
	for (let i = 0; i < label.length; i++) {
		hash = label.charCodeAt(i) + ((hash << 5) - hash)
	}

	const hue = Math.abs(hash) % 360
	return `hsl(${hue}, 70%, 60%)`
}

// const LSI_COLORS: Record<string, string> = {
// 	'Blood Products': 'white',
// 	'Airway & Respiration': 'cyan',
// 	'Bleeding Control': 'red',
// 	'Chest Decompression': 'orange',
// }

type Point = { x: number; y: number }

const LSIConfidenceTimeline = ({ chartData }: Props) => {
	console.log(chartData)
	// const MAX_POINTS = 20

	const [series, setSeries] = useState<Record<string, Point[]>>({})
	const timeRef = useRef(0)

	const signalKeys = Object.keys(chartData.meta).filter(k => k.startsWith('lsi_') && !k.includes('sampling') && !k.includes('description'))

	// --- THE FIX: Create a waiting room for incoming data ---
	const queueRef = useRef<Record<string, number>[]>([])

	// const samplingRate = chartData.meta.sampling_rate?.[0] ?? 1
	// const dt = 1 / samplingRate

	// Initialize buffers once (or when LSI set changes)
	useEffect(() => {
		const init: Record<string, Point[]> = {}
		signalKeys.forEach(k => (init[k] = []))
		init.__threshold__ = []
		setSeries(init)
		timeRef.current = 0
		queueRef.current = [] // Reset the waiting room on init
	}, [signalKeys.join('|')])

	// --- STEP 1: INGESTION ---
	// When Axios gets new data, put it in the queue. DO NOT update the chart yet.
	useEffect(() => {
		const newDataPoint: Record<string, number> = {}
		let hasData = false

		signalKeys.forEach(key => {
			const arr = chartData.meta[key]
			if (arr && arr.length > 0) {
				newDataPoint[key] = arr[arr.length - 1]
				hasData = true
			}
		})

		if (hasData) {
			queueRef.current.push(newDataPoint)
		}
	}, [chartData])

	// --- STEP 2: PACING ---
	// Drain the queue at the exact speed of your chunks (e.g., every 5 seconds)
	useEffect(() => {
		// Use the backend chunk duration, fallback to 5 seconds if undefined
		const chunkDurationMs = (chartData.second_of_chunks || 5) * 1000

		const intervalId = setInterval(() => {
			if (queueRef.current.length > 0) {
				// Pop the oldest point waiting in line
				const pointToDraw = queueRef.current.shift()!

				setSeries(prev => {
					const updated = { ...prev }
					signalKeys.forEach(key => {
						if (pointToDraw[key] !== undefined) {
							updated[key] = [...(updated[key] || []), { x: timeRef.current, y: pointToDraw[key] }]
						}
					})
					updated.__threshold__ = [...(updated.__threshold__ || []), { x: timeRef.current, y: THRESHOLD }]
					return updated
				})

				// Move the X-axis forward by the chunk duration
				timeRef.current += chartData.second_of_chunks || 5
			}
		}, chunkDurationMs)

		return () => clearInterval(intervalId)
	}, [chartData.second_of_chunks, signalKeys.join('|')])

	// Append ONLY the latest value when data updates
	// useEffect(() => {
	// 	setSeries(prev => {
	// 		const updated = { ...prev }

	// 		signalKeys.forEach(key => {
	// 			const arr = chartData.meta[key]
	// 			if (!arr || arr.length === 0) return

	// 			const lastValue = arr[arr.length - 1]

	// 			const next = [...(updated[key] || []), { x: timeRef.current, y: lastValue }]
	// 			updated[key] = next
	// 			// updated[key] = next.length > MAX_POINTS ? next.slice(1) : next
	// 		})

	// 		const tNext = [...(updated.__threshold__ || []), { x: timeRef.current, y: THRESHOLD }]
	// 		updated.__threshold__ = tNext
	// 		// updated.__threshold__ = tNext.length > MAX_POINTS ? tNext.slice(1) : tNext

	// 		return updated
	// 	})

	// 	timeRef.current += dt
	// }, [chartData])

	const datasets = [
		...signalKeys.map(key => {
			const label = key.replace('lsi_', '').replaceAll('_', ' ')
			return {
				label,
				data: series[key] || [],
				borderColor: lsiColor(label),
				backgroundColor: 'transparent',
				tension: 0.4,
				borderWidth: 2,
				pointRadius: 0,
			}
		}),
		{
			label: 'Decision Threshold',
			data: series.__threshold__ || [],
			borderColor: 'green',
			borderDash: [6, 6],
			borderWidth: 2,
			pointRadius: 0,
			tension: 0,
		},
	]

	return (
		<div style={{ height: '400px', margin: '20px auto' }}>
			<Line
				data={{ datasets }}
				options={{
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							labels: { color: 'silver' },
						},
						title: {
							display: true,
							text: 'LSI Confidence Over Time',
							color: 'silver',
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
					scales: {
						x: {
							type: 'linear',
							title: {
								display: true,
								text: 'Time',
								color: 'silver',
							},
							ticks: { color: 'silver' },
							grid: { color: 'rgba(100,100,100,0.7)' },
						},
						y: {
							min: 0,
							max: 1.2,
							title: {
								display: true,
								text: 'Confidence',
								color: 'silver',
							},
							ticks: { color: 'silver' },
							grid: { color: 'rgba(100,100,100,0.7)' },
						},
					},
					elements: {
						point: {
							radius: 0, // No dots on lines
							hoverRadius: 0, // No dots on hover
							hitRadius: 10, // Maintain interaction
						},
					},
				}}
			/>
		</div>
	)
}

export default LSIConfidenceTimeline
