import { useEffect, useRef, useMemo } from 'react'

// --- Helper: Data Logic ---
// (Kept exactly as provided)
// const findNewPoints = (prev: number[], next: number[]): number[] => {
// 	if (!prev || prev.length === 0) return next

// 	const lastPrevPoint = prev[prev.length - 1]
// 	const lastPrevTime = prev[prev.length - 2] || lastPrevPoint

// 	let splitIndex = -1
// 	for (let i = next.length - 2; i >= 0; i--) {
// 		if (next[i] === lastPrevTime && next[i + 1] === lastPrevPoint) {
// 			splitIndex = i + 2
// 			break
// 		}
// 	}

// 	if (splitIndex === -1) {
// 		const lastIndex = next.lastIndexOf(lastPrevPoint)
// 		if (lastIndex !== -1) {
// 			splitIndex = lastIndex + 1
// 		} else {
// 			return next.slice(-100)
// 		}
// 	}

// 	if (splitIndex >= next.length) return []
// 	return next.slice(splitIndex)
// }

// --- Props ---
interface MultiSignalGraphProps {
	signals: { [key: string]: number[] }
	maxPoints?: number
	rowHeight?: number
	numberOfSignalsToShow?: number
	chunkSeconds?: number
}

const MultiSignalGraph = ({ signals, maxPoints = 1000, rowHeight = 100, numberOfSignalsToShow = 3, chunkSeconds = 5 }: MultiSignalGraphProps) => {
	
	console.log("max point", Object.values(signals)[0]?.length)
	// 1. Determine which signals to show
	const signalKeys = useMemo(() => {
		console.log(signals)
		return Object.keys(signals)
			.filter(k => !k.endsWith('_time'))
			.slice(0, numberOfSignalsToShow)
	}, [signals, numberOfSignalsToShow])

	const totalHeight = rowHeight * signalKeys.length

	// 2. Refs for Canvas and Buffers
	const gridRef = useRef<HTMLCanvasElement | null>(null)
	const graphRef = useRef<HTMLCanvasElement | null>(null)

	// Data structures are now Objects mapped by signalKey
	const dataQueueRef = useRef<{ [key: string]: number[] }>({})
	const renderBufferRef = useRef<{ [key: string]: number[] }>({})
	const prevDataRef = useRef<{ [key: string]: number[] }>({})

	// Initialize buffers for keys if they don't exist
	useEffect(() => {
		signalKeys.forEach(key => {
			if (!dataQueueRef.current[key]) dataQueueRef.current[key] = []
			if (!renderBufferRef.current[key]) renderBufferRef.current[key] = []
			if (!prevDataRef.current[key]) prevDataRef.current[key] = []
		})
	}, [signalKeys])

	// Animation Loop Refs
	// const rAFRef = useRef<number | null>(null)
	// const lastUpdateTimeRef = useRef<number>(0)
	// const animationInterval = 16

	// Animation Loop Refs
	const rAFRef = useRef<number | null>(null)
	const lastFrameTimeRef = useRef<number>(performance.now())
	const fractionalPointsRef = useRef<{ [key: string]: number }>({}) // Tracks decimal points

	// -------------------------
	// STEP 1: Draw Static Background Grid (Runs once per layout change)
	// -------------------------
	useEffect(() => {
		const canvas = gridRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const dpr = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()
		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

		const width = rect.width

		ctx.clearRect(0, 0, width, totalHeight)

		// Draw grid for each "row"
		signalKeys.forEach((_, index) => {
			const yOffset = index * rowHeight

			// Draw Separator Line
			if (index > 0) {
				ctx.beginPath()
				ctx.strokeStyle = 'white'
				ctx.lineWidth = 2
				ctx.moveTo(0, yOffset)
				ctx.lineTo(width, yOffset)
				ctx.stroke()
			}

			// Grid Logic
			const minorDivisions = 5
			const majorDivisions = 25
			const minorGrid = rowHeight / minorDivisions
			const majorGrid = rowHeight / majorDivisions

			// Minor Grid
			ctx.strokeStyle = 'rgba(255,255,255,0.05)'
			ctx.lineWidth = 1
			for (let y = 0; y <= rowHeight; y += minorGrid) {
				ctx.beginPath()
				ctx.moveTo(0, yOffset + y)
				ctx.lineTo(width, yOffset + y)
				ctx.stroke()
			}
			for (let x = 0; x <= width; x += minorGrid) {
				ctx.beginPath()
				ctx.moveTo(x, yOffset)
				ctx.lineTo(x, yOffset + rowHeight)
				ctx.stroke()
			}

			// Major Grid
			ctx.strokeStyle = 'rgba(255,255,255,0.12)'
			ctx.lineWidth = 1.5
			for (let y = 0; y <= rowHeight; y += majorGrid) {
				ctx.beginPath()
				ctx.moveTo(0, yOffset + y)
				ctx.lineTo(width, yOffset + y)
				ctx.stroke()
			}
			for (let x = 0; x <= width; x += majorGrid) {
				ctx.beginPath()
				ctx.moveTo(x, yOffset)
				ctx.lineTo(x, yOffset + rowHeight)
				ctx.stroke()
			}
		})
	}, [totalHeight, rowHeight, signalKeys.length])

	// -------------------------
	// STEP 2: Ingest Data
	// -------------------------
	useEffect(() => {
		signalKeys.forEach(key => {
			const newData = signals[key] || []

			if (newData.length > 0) {
				dataQueueRef.current[key].push(...newData)
			}

			prevDataRef.current[key] = newData
		})
	}, [signals, signalKeys])

	// -------------------------
	// STEP 3: Unified Animation Loop
	// -------------------------
	useEffect(() => {
		const canvas = graphRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const dpr = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()
		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr
		ctx.scale(dpr, dpr)

		const width = rect.width

		const draw = (timestamp: number) => {
			rAFRef.current = requestAnimationFrame(draw)

			// 1. Calculate exactly how many milliseconds passed since the last frame
			const deltaTime = timestamp - lastFrameTimeRef.current
			lastFrameTimeRef.current = timestamp

			// 2. Clear the canvas
			ctx.clearRect(0, 0, width, totalHeight)

			signalKeys.forEach((key, index) => {
				const yOffset = index * rowHeight
				const midY = yOffset + rowHeight / 2

				const queue = dataQueueRef.current[key]
				const buffer = renderBufferRef.current[key]

				// --- YOUR MATH FIX GOES HERE ---
				// Get the total points from the last received chunk (fallback to 2500)
				const pointsInLastChunk = prevDataRef.current[key]?.length || 2500

				// Calculate points per millisecond based on the backend's required time
				const pointsPerMs = pointsInLastChunk / (chunkSeconds * 1000)

				// Calculate exactly how many points to draw this frame + any leftovers from last frame
				const currentFraction = fractionalPointsRef.current[key] || 0
				const exactPoints = (deltaTime * pointsPerMs) + currentFraction

				// We can only pop whole numbers from an array
				let pointsToProcess = Math.floor(exactPoints)

				// Save the decimal remainder for the next frame so we never lose data
				fractionalPointsRef.current[key] = exactPoints - pointsToProcess

				// Safety net: Don't pop more than we have in the queue
				if (pointsToProcess > queue.length) {
					pointsToProcess = queue.length
				}

				// Pop the exact mathematical amount!
				for (let p = 0; p < pointsToProcess; p++) {
					if (queue.length > 0) {
						buffer.push(queue.shift()!)
						if (buffer.length > maxPoints) buffer.shift()
					}
				}

				// --- DRAWING LOGIC (Keep the rest exactly the same as before) ---
				if (buffer.length < 2) return

				ctx.beginPath()
				ctx.strokeStyle = 'rgba(255,255,255,0.1)'
				ctx.lineWidth = 1
				ctx.moveTo(0, midY)
				ctx.lineTo(width, midY)
				ctx.stroke()
			// rAFRef.current = requestAnimationFrame(draw)
			// const elapsed = timestamp - lastUpdateTimeRef.current

			// if (elapsed > animationInterval) {
			// 	lastUpdateTimeRef.current = timestamp - (elapsed % animationInterval)

			// 	// 1. Clear the entire large canvas
			// 	ctx.clearRect(0, 0, width, totalHeight)

			// 	// 2. Loop through every signal and draw it in its specific "lane"
			// 	signalKeys.forEach((key, index) => {
			// 		const yOffset = index * rowHeight
			// 		const midY = yOffset + rowHeight / 2

			// 		// Get Buffers
			// 		// if (!dataQueueRef.current[key]) dataQueueRef.current[key] = []
			// 		// if (!renderBufferRef.current[key]) renderBufferRef.current[key] = []

			// 		const queue = dataQueueRef.current[key]
			// 		const buffer = renderBufferRef.current[key]

			// 		let pointsToProcess = 1

			// 		// If queue is backed up (e.g., > 50 points), process 2 points per frame
			// 		// so we slowly speed up to real-time without skipping data.
			// 		// if (queue.length > 100) pointsToProcess = 3
			// 		// if (queue.length > 500) pointsToProcess = 10 // Major lag recovery

			// 		for (let p = 0; p < pointsToProcess; p++) {
			// 			if (queue.length > 0) {
			// 				const point = queue.shift()!
			// 				buffer.push(point)
			// 				if (buffer.length > maxPoints) buffer.shift()
			// 			}
			// 		}

			// 		// --- DRAWING LOGIC (Same as before) ---
			// 		if (buffer.length < 2) return

			// 		// Draw center line for this row
			// 		ctx.beginPath()
			// 		ctx.strokeStyle = 'rgba(255,255,255,0.1)'
			// 		ctx.lineWidth = 1
			// 		ctx.moveTo(0, midY)
			// 		ctx.lineTo(width, midY)
			// 		ctx.stroke()

					// Dynamic Scaling (Per Signal)
					// let minVal = Infinity
					// let maxVal = -Infinity
					// for (const v of buffer) {
					// 	if (v < minVal) minVal = v
					// 	if (v > maxVal) maxVal = v
					// }

					const xStep = width / (maxPoints - 1)
					const pointsToPad = maxPoints - buffer.length
					const startX = pointsToPad * xStep

					// Constants from your original code
					// const midValue = 0.005
					// const amplitude = 0.02
					// const safeAmplitude = amplitude < 0.02 ? 0.02 : amplitude
					// // const safeAmplitude = amplitude
					// const gain = 2
					// const scaleY = (rowHeight * 0.45 * gain) / safeAmplitude

					// --- NEW DRAWING LOGIC ---
					// Standard normalized data centers at 0
					const midValue = 0; 

					// Standard normalized data operates between -1 and 1
					const amplitude = 1; 

					// This scales a value of 1 or -1 to take up 45% of the lane height.
					// This leaves a clean 5% visual padding at the top and bottom of the lane so the line never touches the borders.
					const scaleY = (rowHeight * 0.45) / amplitude;

					// old
					// Normalize Y relative to the specific Row's midY
					// const normalizeY = (v: number) => {
					// 	return midY - (v - midValue) * scaleY
					// }

					const normalizeY = (v: number) => {
						// 1. Calculate the raw pixel position
						const rawY = midY - (v - midValue) * scaleY

						// 2. Define our safety boundaries (padding of 2px from the lane edges)
						const minYBound = yOffset + 2
						const maxYBound = yOffset + rowHeight - 2

						// 3. Clamp the value:
						// If rawY is too small (above top), use minYBound.
						// If rawY is too large (below bottom), use maxYBound.
						return Math.max(minYBound, Math.min(maxYBound, rawY))
					}

					ctx.beginPath()
					ctx.strokeStyle = 'cyan' // You can make this dynamic per index if you want
					ctx.lineWidth = 2

					// if (buffer[0] > 1 || buffer[0] < -1) {
					// 	console.log(buffer[0], 'buffer value')
					// }

					let minY = Infinity
					let maxY = -Infinity

					let prevX = startX
					let prevY = normalizeY(buffer[0])
					ctx.moveTo(prevX, prevY)

					for (let i = 1; i < buffer.length; i++) {
						const currX = startX + i * xStep
						// const currY = normalizeY(buffer[i] < -1 ? -1 : buffer[i] > 1 ? 1 : buffer[i])
						const currY = normalizeY(buffer[i])

						if (currY < minY) minY = currY
						if (currY > maxY) maxY = currY

						const midX = (prevX + currX) / 2
						const midYPoint = (prevY + currY) / 2

						ctx.quadraticCurveTo(prevX, prevY, midX, midYPoint)

						prevX = currX
						prevY = currY
					}

					ctx.lineTo(prevX, prevY)
					ctx.stroke()
				})
			// }
		}

		rAFRef.current = requestAnimationFrame(draw)

		return () => {
			if (rAFRef.current) cancelAnimationFrame(rAFRef.current)
		}
	}, [maxPoints, totalHeight, rowHeight, signalKeys])

	return (
		<div
			style={{
				position: 'relative',
				width: '90%',
				height: `${totalHeight}px`,
				margin: '20px auto',
				display: 'grid',
				gridTemplateColumns: 'auto 60px', // Adjusted for labels
			}}>
			{/* Graph Area */}
			<div style={{ position: 'relative', width: '100%', height: '100%' }}>
				{/* Render Y-Ticks for each row */}
				{signalKeys.map((key, i) => (
					<div
						key={key}
						style={{
							position: 'absolute',
							top: `${i * rowHeight}px`,
							left: '-25px',
							height: `${rowHeight}px`,
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							color: 'white',
							fontSize: '10px',
						}}>
						{[1, 0.5, 0, -0.5, -1].map(val => (
							<div key={val}>{val}</div>
						))}
					</div>
				))}

				<canvas
					ref={gridRef}
					style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
				/>
				<canvas
					ref={graphRef}
					style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2 }}
				/>
			</div>

			{/* Label Area (Right Side) */}
			<div style={{ display: 'flex', flexDirection: 'column' }}>
				{signalKeys.map(key => (
					<div
						key={key}
						style={{
							height: `${rowHeight}px`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'white',
							fontWeight: 'bold',
							fontSize: '0.9em',
						}}>
						{key}
					</div>
				))}
			</div>
		</div>
	)
}

export default MultiSignalGraph
