import { supabase } from '../lib/supabaseClient'

export const getLots = async () => {
    const { data, error } = await supabase
        .from('lots')
        .select('*')
        .order('id')

    if (error) {
        console.error("Error fetching lots:", error)
        throw error
    }
    return data
}

export const createLot = async (lot) => {
    const { data, error } = await supabase
        .from('lots')
        .insert([lot])
        .select()

    if (error) {
        console.error("Error creating lot:", error)
        throw error
    }
    return data[0]
}

export const updateLot = async (id, updates) => {
    const { data, error } = await supabase
        .from('lots')
        .update(updates)
        .eq('id', id)
        .select()

    if (error) {
        console.error("Error updating lot:", error)
        throw error
    }
    return data[0]
}

export const updateLotPayments = async (lotId, payments) => {
    const { data, error } = await supabase
        .from('lots')
        .update({ payments })
        .eq('id', lotId)
        .select()

    if (error) {
        console.error("Error updating payments:", error)
        throw error
    }
    return data[0]
}

export const deleteLot = async (id) => {
    const { error } = await supabase
        .from('lots')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting lot:", error)
        throw error
    }
}
