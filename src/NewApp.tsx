import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import MultiSignalCharts from './Components/barChatNew'
import MultiSignalGraph from './Components/graphNew'
import WaitingForData from './Components/waiting'

// Define types
interface Signals {
	[key: string]: number[]
}

interface Meta {
	[key: string]: any[]
}

interface DataState {
	signals: Signals
	meta: Meta
}

const MAX_POINTS = 1000 // keep last N points per signal

const NewApp = () => {
	const navigate = useNavigate()
	const [dataState, setDataState] = useState<DataState>({
		signals: {},
		meta: {},
	})

	const getData = async () => {
		try {
			const token = localStorage.getItem('token')
			const res = await axios.get(`${import.meta.env.VITE_API_URL}data/get_array`, {
				headers: {
					// The format must be "Bearer " followed by the token
					Authorization: `Bearer ${token}`,
				},
			})
			const newSignals: Signals = res.data.data.signals || {}
			const newMetaRaw: { [key: string]: any } = res.data.data.meta || {}

			console.log(res)

			setDataState(prev => {
				const updatedSignals: Signals = { ...prev.signals }
				const updatedMeta: Meta = { ...prev.meta }

				// Update signals
				Object.keys(newSignals).forEach(key => {
					if (key.endsWith('_time')) return // skip _time keys

					const prevArray = updatedSignals[key] || []
					const combined = [...prevArray, ...newSignals[key]]

					updatedSignals[key] = combined.length > MAX_POINTS ? combined.slice(combined.length - MAX_POINTS) : combined
				})

				// Update meta separately, key by key
				Object.keys(newMetaRaw).forEach(metaKey => {
					if (metaKey === 'sampling_rate') {
						updatedMeta[metaKey] = [newMetaRaw[metaKey]] // keep single value or handle as needed
						return
					}
					if (metaKey === 'description') {
						const prevArray = updatedMeta[metaKey] || []
						updatedMeta[metaKey] = [...prevArray, newMetaRaw[metaKey]].slice(-MAX_POINTS)
						return
					}

					// For other meta keys
					const prevArray = updatedMeta[metaKey] || []
					const value = newMetaRaw[metaKey] // true/false or value
					const repeated = Array(Object.values(newSignals)[0]?.length || 1).fill(value) // repeat to match new signal segment length

					updatedMeta[metaKey] = [...prevArray, ...repeated].slice(-MAX_POINTS)
				})

				console.log(updatedSignals)
				console.log(updatedMeta)

				return {
					signals: updatedSignals,
					meta: updatedMeta,
				}
			})
		} catch (err: any) {
			if (err.response?.status === 401) {
				alert('Please login to continue.')
				navigate('/login')
			} else {
				console.error(err)
			}
		}
	}

	useEffect(() => {
		console.log('started')
		// getData();
		const interval = setInterval(getData, 2000)
		return () => clearInterval(interval)
	}, [])

	const hasData = Object.keys(dataState.signals).length > 0 && Object.values(dataState.signals)[0].length > 0

	return (
		<div style={{ textAlign: 'center' }}>
			<h1>ECG Signals & Meta</h1>
			{/* <pre>{JSON.stringify(dataState, null, 2)}</pre> */}
			{/* Render all signal graphs */}
			{!hasData ? <WaitingForData /> : <MultiSignalGraph signals={dataState.signals} />}
			{/* <>
					<MultiSignalCharts chartData={dataState} />
				</> */}
		</div>
	)
}

export default NewApp
