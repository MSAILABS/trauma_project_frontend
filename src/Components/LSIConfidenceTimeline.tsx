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
	const [series, setSeries] = useState<Record<string, Point[]>>({})

	// Refs for buffering
	const queueRef = useRef<Record<string, number[]>>({})
	const lastProcessedLength = useRef<Record<string, number>>({})
	const renderTimeRef = useRef(0)

	// State to manage the dynamic interval
	const [playbackInterval, setPlaybackInterval] = useState(1000)

	const signalKeys = Object.keys(chartData.meta).filter(k => k.startsWith('lsi_') && !k.includes('sampling') && !k.includes('description'))

	// Initial setup
	useEffect(() => {
		const init: Record<string, any> = {}
		signalKeys.forEach(k => {
			init[k] = []
			lastProcessedLength.current[k] = 0
			queueRef.current[k] = []
		})
		setSeries({ ...init, __threshold__: [] })
	}, [signalKeys.join('|')])

	// 1. INGESTION: Identify NEW points and calculate the playback speed
	useEffect(() => {
		let detectedInterval = playbackInterval

		signalKeys.forEach(key => {
			const fullArray = chartData.meta[key] || []
			const prevLength = lastProcessedLength.current[key] || 0

			// Get only the points that were just added in this fetch
			const newPoints = fullArray.slice(prevLength)

			if (newPoints.length > 0) {
				queueRef.current[key].push(...newPoints)
				lastProcessedLength.current[key] = fullArray.length

				// Calculate interval based on second_of_chunks
				// Interval = (Total Seconds / Total Points in this chunk) * 1000ms
				const chunkSeconds = chartData.second_of_chunks || 1
				detectedInterval = chunkSeconds * 1000
			}
		})

		if (detectedInterval !== playbackInterval) {
			setPlaybackInterval(detectedInterval)
		}
	}, [chartData, signalKeys])

	// 2. PLAYBACK: Drip data based on the calculated interval
	useEffect(() => {
		const intervalId = setInterval(() => {
			const hasData = signalKeys.some(k => queueRef.current[k].length > 0)

			if (hasData) {
				setSeries(prev => {
					const updated = { ...prev }
					// const dt = (chartData.second_of_chunks || 1) / 10 // Approximation for X-axis spacing

					signalKeys.forEach(key => {
						const q = queueRef.current[key]
						if (q.length > 0) {
							const val = q.shift()!
							updated[key] = [...updated[key], { x: renderTimeRef.current, y: val }]
						}
					})

					updated.__threshold__ = [...updated.__threshold__, { x: renderTimeRef.current, y: THRESHOLD }]

					renderTimeRef.current += playbackInterval / 1000 // Keep X-axis in seconds
					return updated
				})
			}
		}, playbackInterval)

		return () => clearInterval(intervalId)
	}, [playbackInterval, signalKeys, chartData.second_of_chunks])

	// 3. STEP 2: PLAYBACK - Take oldest point from buffer and show it
	// useEffect(() => {
	// 	const playbackTimer = setInterval(() => {
	// 		// Check if there is at least one point in the queues to process
	// 		const hasData = signalKeys.some(k => queueRef.current[k]?.length > 0)

	// 		if (hasData) {
	// 			setSeries(prev => {
	// 				const updated = { ...prev }

	// 				signalKeys.forEach(key => {
	// 					const queue = queueRef.current[key]
	// 					if (queue && queue.length > 0) {
	// 						const oldestPoint = queue.shift()! // Remove from buffer
	// 						updated[key] = [...updated[key], { x: renderTimeRef.current, y: oldestPoint }]
	// 					}
	// 				})

	// 				// Handle Threshold line sync
	// 				updated.__threshold__ = [...updated.__threshold__, { x: renderTimeRef.current, y: THRESHOLD }]

	// 				return updated
	// 			})

	// 			// Increment time only when a point is actually rendered
	// 			renderTimeRef.current += dt
	// 		}
	// 	}, PLAYBACK_INTERVAL)

	// 	return () => clearInterval(playbackTimer)
	// }, [signalKeys.join('|'), dt])

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
