import {api,uploadDataUrl} from '../lib/api';
import {isPreview,getPreviewData} from '../lib/previewData';
export const getConfig=async key=>isPreview?(await getPreviewData()).config[key] ?? null:api('config/'+encodeURIComponent(key));
export const setConfig=async(key,value)=>{
 if(typeof value==='string' && value.startsWith('data:'))value=(await uploadDataUrl(value,'mapa',null,'gallery')).url;
 return api('config/'+encodeURIComponent(key),{method:'PUT',body:{value}});
};
