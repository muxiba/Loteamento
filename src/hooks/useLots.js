import { useEffect, useState } from 'react'
import { getLots, getLotsSummary, createLot, updateLot, deleteLot } from '../services/lotsService'

export const useLots = () => {
    const [lots, setLots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadLots = async () => {
        try {
            setLoading(true)
            const data = await getLots()
            setLots(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const addLot = async (lot) => {
        try {
            const newLot = await createLot(lot)
            setLots(prev => [...prev, newLot])
            return newLot
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const editLot = async (id, updates) => {
        try {
            const updated = await updateLot(id, updates)
            setLots(prev => prev.map(l => l.id === id ? updated : l))
            return updated
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const removeLot = async (id) => {
        try {
            await deleteLot(id)
            setLots(prev => prev.filter(l => l.id !== id))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        loadLots()
    }, [])

    return { lots, loading, error, addLot, editLot, removeLot, reload: loadLots }
}

export const useLotsSummary = () => {
    const [lots, setLots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadLots = async () => {
        try {
            setLoading(true)
            const data = await getLotsSummary()
            setLots(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isMounted = true;
        loadLots().then(() => {
            if (!isMounted) return;
        });
        return () => { isMounted = false; };
    }, [])

    return { lots, loading, error, reload: loadLots }
}
