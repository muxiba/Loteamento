import { supabase } from '../lib/supabaseClient'

export const getConfig = async (key) => {
    const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', key)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
        console.error("Error fetching config:", error)
        throw error
    }
    return data?.value || null
}

export const setConfig = async (key, value) => {
    const { data, error } = await supabase
        .from('config')
        .upsert({ key, value })
        .select()

    if (error) {
        console.error("Error setting config:", error)
        throw error
    }
    return data[0]
}
