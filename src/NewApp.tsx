import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MultiSignalCharts from './Components/barChatNew'
// import MultiSignalGraph from './Components/graphNew'
import MultiSignalGraph from './Components/syncGraphs'
import WaitingForData from './Components/waiting'
import PlotGraphs from './Components/PlotGraphs'
import LSIConfidenceTimeline from './Components/LSIConfidenceTimeline'
// import ECGChartJS from './Components/ECGChartJS' // Adjust path accordingly

// Define types
interface Signals {
	[key: string]: number[]
}

interface Meta {
	[key: string]: any[]
}

interface DataState {
	signals: Signals
	raw_signals: Signals
	meta: Meta
	fft_frequencies: number[][]
	fft_magnitude: number[][]
	mfcc: number[][][]
	spectrogram_time_bins: number[][]
	spectrogram_freq_bins: number[][]
	spectrogram_power: number[][][]
	second_of_chunks: number
}

let MAX_POINTS = 1000 // keep last N points per signal

const NewApp = () => {
	const navigate = useNavigate()
	const [dataState, setDataState] = useState<DataState>({
		signals: {},
		raw_signals: {},
		meta: {},
		fft_frequencies: [],
		fft_magnitude: [],
		mfcc: [],
		spectrogram_time_bins: [],
		spectrogram_freq_bins: [],
		spectrogram_power: [],
		second_of_chunks: 2,
	})
	// We use a ref to keep track of the timer so we can clean it up properly
	const timerRef = useRef<any>(null)
	const [processingModel, setProcessingModel] = useState<string | null>(null)
	const [showModelButtons, setShowModelButtons] = useState(true)
	const [activeModelType, setActiveModelType] = useState<'rf' | 'poting' | null>(null)
	const [isPaused, setIsPaused] = useState(false)
	// const [showAllLineCharts, setShowAllLinesCharts] = useState(true)

	const resetState = () => {
		// Clear polling timer
		if (timerRef.current) {
			clearTimeout(timerRef.current)
		}

		// Reset data
		setDataState({
			signals: {},
			raw_signals: {},
			meta: {},
			fft_frequencies: [],
			fft_magnitude: [],
			mfcc: [],
			spectrogram_time_bins: [],
			spectrogram_freq_bins: [],
			spectrogram_power: [],
			second_of_chunks: 2,
		})
	}

	const handleResetEr3 = async () => {
		try {
			const token = localStorage.getItem('token')

			if (!token) {
				alert('Please login to continue.')
				navigate('/login')
				return
			}

			await axios.post(`${import.meta.env.VITE_API_URL}data/reset_er3`, null, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)
				alert('Failed to reset. Please try again.')
			}
		} finally {
			// Full page refresh after reset
			window.location.reload()
		}
	}

	const handlePauseEr3 = async () => {
		try {
			const token = localStorage.getItem('token')
			if (!token) {
				alert('Please login to continue.')
				navigate('/login')
				return
			}
			await axios.post(`${import.meta.env.VITE_API_URL}data/pause_er3`, null, { headers: { Authorization: `Bearer ${token}` } })
			setIsPaused(true)
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)
				alert('Failed to pause. Please try again.')
			}
		}
	}

	const handleUnpauseEr3 = async () => {
		try {
			const token = localStorage.getItem('token')
			if (!token) {
				alert('Please login to continue.')
				navigate('/login')
				return
			}
			await axios.post(`${import.meta.env.VITE_API_URL}data/unpause_er3`, null, { headers: { Authorization: `Bearer ${token}` } })
			setIsPaused(false)
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)
				alert('Failed to unpause. Please try again.')
			}
		}
	}

	const handleProcessEr3 = async (modelType: 'rf' | 'poting') => {
		try {
			// Reset / refresh component before calling API
			resetState()

			// Hide RF / poting buttons after first click
			setShowModelButtons(false)
			setActiveModelType(modelType)
			setIsPaused(false)

			setProcessingModel(modelType)
			const token = localStorage.getItem('token')

			if (!token) {
				alert('Please login to continue.')
				navigate('/login')
				return
			}

			await axios.post(`${import.meta.env.VITE_API_URL}data/process_er3`, null, {
				params: { model_type: modelType },
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			// After processing, restart polling for fresh data
			getData()
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)
				alert('Failed to trigger processing. Please try again.')
			}
		} finally {
			setProcessingModel(null)
		}
	}

	const getData = async () => {
		try {
			const token = localStorage.getItem('token')
			const res = await axios.get(`${import.meta.env.VITE_API_URL}data/get_array`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (res.data.message) {
				scheduleNext(1)
				return
			}

			const newSignals: Signals = res.data.data.signals || {}
			const newMetaRaw: { [key: string]: any } = res.data.data.meta || {}
			const newRawSignals: Signals = res.data.data.raw_signals || {}

			if (MAX_POINTS === 1000) {
				Object.keys(newSignals).forEach(key => {
					if (key.endsWith('_time')) return

					MAX_POINTS = newSignals[key].length
				})
			}

			// 1. Get the chunk duration from the backend
			const backendChunkSeconds = res.data.data.chunk_seconds || 2
			// console.log(newSignals, 'newSignals')

			setDataState(prev => {
				const updatedSignals: Signals = { ...prev.signals }
				const updatedRawSignals: Signals = { ...prev.raw_signals }
				const updatedMeta: Meta = { ...prev.meta }

				// Update normalized signals
				Object.keys(newSignals).forEach(key => {
					if (key.endsWith('_time')) return
					const prevArray = updatedSignals[key] || []
					const combined = [...prevArray, ...newSignals[key]]
					updatedSignals[key] = combined.length > MAX_POINTS ? combined.slice(combined.length - MAX_POINTS) : combined
				})

				// Update raw signals
				Object.keys(newRawSignals).forEach(key => {
					if (key.endsWith('_time')) return
					const prevArray = updatedRawSignals[key] || []
					const combined = [...prevArray, ...newRawSignals[key]]
					updatedRawSignals[key] = combined.length > MAX_POINTS ? combined.slice(combined.length - MAX_POINTS) : combined
				})

				// Update meta
				Object.keys(newMetaRaw).forEach(metaKey => {
					if (metaKey === 'sampling_rate') {
						updatedMeta[metaKey] = [newMetaRaw[metaKey]]
						return
					}
					if (metaKey === 'description') {
						const prevArray = updatedMeta[metaKey] || []
						updatedMeta[metaKey] = [...prevArray, newMetaRaw[metaKey]].slice(-MAX_POINTS)
						return
					}
					const prevArray = updatedMeta[metaKey] || []
					const value = newMetaRaw[metaKey]
					const repeated = Array(Object.values(newSignals)[0]?.length || 1).fill(value)
					updatedMeta[metaKey] = [...prevArray, ...repeated].slice(-MAX_POINTS)
				})

				let fft_frequencies = []
				let fft_magnitude = []
				let mfcc = []
				let spectrogram_time_bins = []
				let spectrogram_freq_bins = []
				let spectrogram_power = []

				try {
					const repeatLength = updatedMeta[Object.keys(updatedMeta)[0]].length

					fft_frequencies = Array(repeatLength).fill(res.data.data.fft_frequencies || [])
					fft_magnitude = Array(repeatLength).fill(res.data.data.fft_magnitude || [])
					mfcc = Array(repeatLength).fill(res.data.data.mfcc || [])
					spectrogram_time_bins = Array(repeatLength).fill(res.data.data.spectrogram_time_bins || [])
					spectrogram_freq_bins = Array(repeatLength).fill(res.data.data.spectrogram_freq_bins || [])
					spectrogram_power = Array(repeatLength).fill(res.data.data.spectrogram_power || [])
				} catch (err) {
					fft_frequencies = [res.data.data.fft_frequencies || []]
					fft_magnitude = [res.data.data.fft_magnitude || []]
					mfcc = [res.data.data.mfcc || []]
					spectrogram_time_bins = [res.data.data.spectrogram_time_bins || []]
					spectrogram_freq_bins = [res.data.data.spectrogram_freq_bins || []]
					spectrogram_power = [res.data.data.spectrogram_power || []]
				}

				// console.log('new check', spectrogram_power, res.data.data.spectrogram_power)

				return {
					signals: updatedSignals,
					raw_signals: updatedRawSignals,
					meta: updatedMeta,
					fft_frequencies,
					fft_magnitude,
					mfcc,
					spectrogram_time_bins,
					spectrogram_freq_bins,
					spectrogram_power,
					second_of_chunks: backendChunkSeconds,
				}
			})

			// 2. Schedule the next call based on the NEW chunk duration
			scheduleNext(1)
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)

				scheduleNext(1)
			}
		}
	}

	const scheduleNext = (seconds: number) => {
		// Clear any existing timer to prevent multiple polling loops
		if (timerRef.current) clearTimeout(timerRef.current)

		// Schedule next call
		timerRef.current = setTimeout(() => {
			getData()
		}, seconds * 1000)
	}

	useEffect(() => {
		// Start the first call
		getData()

		// Cleanup: stop polling if the user leaves the page
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, []) // Only runs once on mount

	const hasData = Object.keys(dataState.signals).length > 0 && Object.values(dataState.signals)[0].length > 0

	return (
		<div style={{ textAlign: 'center' }}>
			<h1>
				ECG Signals & Meta
				{!showModelButtons && (
					<div
						style={{
							float: 'right',
							display: 'flex',
							justifyContent: 'center',
							gap: '12px',
							fontSize: '20px',
							position: 'absolute',
							top: '40px',
							right: '10px',
						}}>
						{(activeModelType === 'rf' || activeModelType === 'poting') && (
							<>
								{isPaused ? <button onClick={handleUnpauseEr3}>Unpause</button> : <button onClick={handlePauseEr3}>Pause</button>}
								<button onClick={handleResetEr3}>Reset</button>
							</>
						)}
					</div>
				)}
			</h1>

			{showModelButtons && (
				<div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
					<button
						onClick={() => handleProcessEr3('rf')}
						disabled={processingModel !== null}>
						Old Model
					</button>
					<button
						onClick={() => handleProcessEr3('poting')}
						disabled={processingModel !== null}>
						New Model
					</button>
					<button
						onClick={() => {
							setShowModelButtons(false)
						}}
						disabled={processingModel !== null}>
						Streaming
					</button>
				</div>
			)}
			{/* <button onClick={() => setShowAllLinesCharts(!showAllLineCharts)}>Show All Line Charts</button> */}
			{/* <pre>{JSON.stringify(dataState, null, 2)}</pre> */}
			{/* Render all signal graphs */}
			{!hasData ? (
				!showModelButtons && <WaitingForData />
			) : (
				<>
					{/* <MultiSignalGraph
						signals={dataState.signals}
						numberOfSignalsToShow={Object.keys(dataState.signals).length}
					/> */}

					{/* <div style={{ maxWidth: '95vw', margin: '0 auto' }}>
						<ECGChartJS
							signals={dataState.raw_signals}
							duration={dataState.second_of_chunks}
						/>
					</div> */}

					<MultiSignalGraph
						signals={dataState.signals}
						numberOfSignalsToShow={Object.keys(dataState.signals).length}
						chunkSeconds={dataState.second_of_chunks}
						maxPoints={Object.values(dataState.signals)[0]?.length || 2500}
					/>
					<LSIConfidenceTimeline chartData={dataState} />
					<PlotGraphs
						signals={dataState.raw_signals}
						fftFreqs={dataState.fft_frequencies}
						fftMag={dataState.fft_magnitude}
						mfcc={dataState.mfcc}
						spectrogramTime={dataState.spectrogram_time_bins}
						spectrogramFreq={dataState.spectrogram_freq_bins}
						spectrogramPower={dataState.spectrogram_power}
						chunkSeconds={dataState.second_of_chunks}
					/>
					<MultiSignalCharts chartData={dataState} />
				</>
			)}
		</div>
	)
}

export default NewApp
