import {api} from '../lib/api';
import {isPreview,getPreviewData} from '../lib/previewData';
export const getMappedLots=async()=>isPreview?(await getPreviewData()).map:api('map');
export const saveMappedLots=lots=>api('map',{method:'PUT',body:{lots}});
export const deleteMappedLot=id=>api('map/'+encodeURIComponent(id),{method:'DELETE',body:{}});
export const clearAllMappedLots=()=>api('map',{method:'DELETE',body:{}});
