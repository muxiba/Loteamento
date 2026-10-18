export const isPreview = import.meta.env.MODE === 'preview' || import.meta.env.VITE_DATA_MODE === 'preview';
let pending;
export async function getPreviewData() {
 if (!pending) pending = fetch('/preview/data.json').then(response => {
  if (!response.ok) throw new Error('Dados da prévia indisponíveis.');
  return response.json();
 }).catch(error => { pending = undefined; throw error; });
 return pending;
}
