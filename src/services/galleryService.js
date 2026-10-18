import {api,uploadFile} from '../lib/api';
import {isPreview,getPreviewData} from '../lib/previewData';
export const getGalleryItems=async()=>isPreview?(await getPreviewData()).gallery:api('gallery');
export const uploadGalleryFile=async file=>{
 const result=await uploadFile(file,'gallery');
 return {url:result.url,type:file.type==='application/pdf'?'pdf':file.type.startsWith('video/')?'localVideo':'image',name:file.name};
};
export const addGalleryItem=item=>api('gallery',{method:'POST',body:item});
export const deleteGalleryItem=id=>api('gallery/'+encodeURIComponent(id),{method:'DELETE',body:{}});
