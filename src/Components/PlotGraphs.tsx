import React, { useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'

interface Signals {
	[key: string]: number[]
}

interface GraphProps {
	signals: Signals
	fftFreqs?: number[][]
	fftMag?: number[][]
	mfcc?: number[][][]
	spectrogramTime?: number[][]
	spectrogramFreq?: number[][]
	spectrogramPower?: number[][][]
}

const MAX_POINTS = 100 // how many frames to keep visible

const PlotGraphs: React.FC<GraphProps> = ({
	signals,
	fftFreqs = [[]],
	fftMag = [[]],
	mfcc = [[]],
	spectrogramTime = [[]],
	spectrogramFreq = [[]],
	spectrogramPower = [[]],
}) => {
	// --- Buffers ---
	const fftQueueRef = useRef<{ x: number[]; y: number[] }[]>([])
	const fftRenderRef = useRef<{ x: number[]; y: number[] }[]>([])

	const mfccQueueRef = useRef<number[][][]>([])
	const mfccRenderRef = useRef<number[][][]>([])

	const specQueueRef = useRef<{ x: number[]; y: number[]; z: number[][] }[]>([])
	const specRenderRef = useRef<{ x: number[]; y: number[]; z: number[][] }[]>([])

	// const [fftFrame, setFftFrame] = useState<{ x: number[]; y: number[] } | null>(null)
	const [mfccFrame, setMfccFrame] = useState<number[][] | null>(null)
	const [specFrame, setSpecFrame] = useState<{ x: number[]; y: number[]; z: number[][] } | null>(null)

	// --- Step 1: push new props into queues ---
	useEffect(() => {
		if (fftFreqs.length > 0 && fftMag.length > 0) {
			fftQueueRef.current.push({ x: fftFreqs[0], y: fftMag[0] })
		}
		if (mfcc.length > 0) {
			mfccQueueRef.current.push(mfcc[0])
		}
		if (spectrogramTime.length > 0 && spectrogramFreq.length > 0 && spectrogramPower.length > 0) {
			specQueueRef.current.push({
				x: spectrogramTime[0],
				y: spectrogramFreq[0],
				z: spectrogramPower[0],
			})
		}
	}, [fftFreqs, fftMag, mfcc, spectrogramTime, spectrogramFreq, spectrogramPower])

	// --- Step 2: consume from queue on interval ---
	useEffect(() => {
		const interval = setInterval(() => {
			// FFT
			if (fftQueueRef.current.length > 0) {
				const frame = fftQueueRef.current.shift()!
				fftRenderRef.current.push(frame)
				if (fftRenderRef.current.length > MAX_POINTS) fftRenderRef.current.shift()
				// setFftFrame(frame)
			}
			// MFCC
			if (mfccQueueRef.current.length > 0) {
				const frame = mfccQueueRef.current.shift()!
				mfccRenderRef.current.push(frame)
				if (mfccRenderRef.current.length > MAX_POINTS) mfccRenderRef.current.shift()
				setMfccFrame(frame)
			}
			// Spectrogram
			if (specQueueRef.current.length > 0) {
				const frame = specQueueRef.current.shift()!
				specRenderRef.current.push(frame)
				if (specRenderRef.current.length > MAX_POINTS) specRenderRef.current.shift()
				setSpecFrame(frame)
			}
		}, 1000) // consume one frame per second
		return () => clearInterval(interval)
	}, [])

	if (!signals || Object.keys(signals).length === 0) {
		return <p>No signal data available</p>
	}

	return (
		<div>
			{/* Spectrogram Heatmap */}
			{specFrame && (
				<Plot
					data={[
						{
							x: specFrame.x,
							y: specFrame.y,
							z: specFrame.z,
							type: 'heatmap',
							colorscale: 'Viridis',
						},
					]}
					layout={{
						title: { text: 'Spectrogram' },
						xaxis: { title: { text: 'Time (s)' } },
						yaxis: { title: { text: 'Frequency (Hz)' }, range: [0, 100] },
						plot_bgcolor: '#242424',
						paper_bgcolor: '#242424',
						font: { color: 'white' },
						width: 800,
						height: 600,
					}}
				/>
			)}

			{/* FFT Spectrum */}
			{/* {fftFrame && (
				<Plot
					data={[
						{
							x: fftFrame.x,
							y: fftFrame.y,
							type: 'scatter',
							mode: 'lines',
							line: { color: 'red' },
						},
					]}
					layout={{
						title: { text: 'FFT Spectrum' },
						xaxis: { title: { text: 'Frequency (Hz)' } },
						yaxis: { title: { text: 'Magnitude' } },
						plot_bgcolor: '#242424',
						paper_bgcolor: '#242424',
						font: { color: 'white' },
						width: 800,
						height: 600,
					}}
				/>
			)} */}

			{/* MFCC Heatmap */}
			{mfccFrame && (
				<Plot
					data={[
						{
							z: mfccFrame,
							type: 'heatmap',
							colorscale: 'Jet',
						},
					]}
					layout={{
						title: { text: 'MFCC Coefficients' },
						xaxis: { title: { text: 'Time Frames' } },
						yaxis: { title: { text: 'MFCC Index' } },
						plot_bgcolor: '#242424',
						paper_bgcolor: '#242424',
						font: { color: 'white' },
						width: 800,
						height: 600,
					}}
				/>
			)}
		</div>
	)
}

export default PlotGraphs
