import { supabase } from '../lib/supabaseClient'

export const getUsers = async (status) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', status)

    if (error) {
        console.error(`Error fetching ${status} users:`, error)
        throw error
    }
    return data
}

export const updateUserStatus = async (userId, status) => {
    const { data, error } = await supabase
        .from('users')
        .update({ status, approvedAt: status === 'approved' ? new Date().toISOString() : null })
        .eq('id', userId)
        .select()

    if (error) {
        console.error("Error updating user status:", error)
        throw error
    }
    return data[0]
}

export const createPendingUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert([{ ...userData, status: 'pending' }])
        .select()

    if (error) {
        console.error("Error creating pending user:", error)
        throw error
    }
    return data[0]
}
