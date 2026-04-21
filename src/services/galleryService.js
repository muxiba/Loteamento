import { supabase } from '../lib/supabaseClient';

export const getGalleryItems = async () => {
    const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching gallery:", error);
        throw error;
    }
    return data;
};

export const uploadGalleryFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

    return {
        url: data.publicUrl,
        type: file.type.startsWith('video/') ? 'localVideo' : 'image',
        name: file.name
    };
};

export const addGalleryItem = async (item) => {
    const { data, error } = await supabase
        .from('gallery')
        .insert([item])
        .select();

    if (error) {
        throw error;
    }
    return data[0];
};

export const deleteGalleryItem = async (id, url) => {
    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

    if (dbError) throw dbError;

    // 2. Delete from Storage (Extract filename from URL)
    const fileName = url.split('/').pop();
    const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([fileName]);

    if (storageError) console.error("Error deleting from storage:", storageError);
};
