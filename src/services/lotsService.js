import {api,externalizeFiles} from '../lib/api';
import {isPreview,getPreviewData} from '../lib/previewData';
export const getLots=async()=>isPreview?(await getPreviewData()).lots:api('lots');
export const getLotsSummary=async()=>isPreview?(await getPreviewData()).lots:api('lots');
export const createLot=lot=>api('lots',{method:'POST',body:lot});
export const updateLot=async(id,updates)=>api('lots/'+encodeURIComponent(id),{method:'PATCH',body:await externalizeFiles(updates,id)});
export const updateLotPayments=(id,payments)=>updateLot(id,{payments});
export const deleteLot=id=>api('lots/'+encodeURIComponent(id),{method:'DELETE',body:{}});
