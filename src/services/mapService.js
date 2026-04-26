import { supabase } from '../lib/supabaseClient'

export const getMappedLots = async () => {
    const { data, error } = await supabase
        .from('map_mapped')
        .select('*')

    if (error) {
        console.error("Error fetching mapped lots:", error)
        throw error
    }
    return data || []
}

export const saveMappedLots = async (lots) => {
    // Usually we clear and re-insert or upsert.
    // For simplicity, let's assume we replace them or upsert by ID.
    const { error } = await supabase
        .from('map_mapped')
        .upsert(lots)

    if (error) {
        console.error("Error saving mapped lots:", error)
        throw error
    }
}

export const deleteMappedLot = async (lotId) => {
    const { error } = await supabase
        .from('map_mapped')
        .delete()
        .eq('id', lotId)

    if (error) {
        console.error("Error deleting mapped lot:", error)
        throw error
    }
}

export const clearAllMappedLots = async () => {
    const { error } = await supabase
        .from('map_mapped')
        .delete()
        .neq('id', 'void') // Delete all

    if (error) {
        console.error("Error clearing mapped lots:", error)
        throw error
    }
}
