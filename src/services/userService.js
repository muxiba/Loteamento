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
    // Map camelCase to snake_case to match SQL schema
    const dbData = {
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        telefone: userData.telefone,
        password: userData.password,
        status: 'pending',
        simulation: userData.simulation,
        lote_id: userData.loteId,
        total_parcelas: userData.totalParcelas,
        start_date: userData.startDate
    };

    const { data, error } = await supabase
        .from('users')
        .insert([dbData])
        .select()

    if (error) {
        console.error("Error creating pending user:", error)
        throw error
    }
    return data[0]
}
