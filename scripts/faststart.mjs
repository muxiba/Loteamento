// Move MP4 metadata ahead of media data without decoding or re-encoding.
// Deliberately reject fragmented files and unsupported chunk layouts.
const containers = new Set(['moov','trak','mdia','minf','stbl']);
function atoms(bytes, start=0, end=bytes.length) {
 const result=[];
 while(start<end) {
  if(start+8>end)throw Error('MP4 com cabeçalho incompleto.');
  let size=bytes.readUInt32BE(start);let header=8;
  if(size===1){size=Number(bytes.readBigUInt64BE(start+8));header=16;}
  if(size===0)size=end-start;
  if(!Number.isSafeInteger(size)||size<header||start+size>end)throw Error('MP4 com tamanho de bloco inválido.');
  result.push({type:bytes.toString('ascii',start+4,start+8),start,size,header});start+=size;
 }
 return result;
}
export function faststart(bytes) {
 const boxes=atoms(bytes), moovs=boxes.filter(x=>x.type==='moov'), mdats=boxes.filter(x=>x.type==='mdat');
 if(moovs.length!==1||mdats.length!==1||boxes.some(x=>x.type==='moof'))throw Error('Formato MP4 não suportado para otimização segura.');
 const moov=moovs[0],mdat=mdats[0];
 if(moov.start<mdat.start)return {bytes,changed:false,chunks:0};
 const metadata=Buffer.from(bytes.subarray(moov.start,moov.start+moov.size));let chunks=0;
 function adjust(start,end) {
  for(const box of atoms(metadata,start,end)) {
   const content=box.start+box.header;
   if(containers.has(box.type))adjust(content,box.start+box.size);
   else if(box.type==='stco'||box.type==='co64') {
    const count=metadata.readUInt32BE(content+4),width=box.type==='stco'?4:8;
    if(content+8+count*width!==box.start+box.size)throw Error('Tabela de offsets inválida.');
    for(let i=0;i<count;i++) {
     const pos=content+8+i*width;
     const offset=width===4?metadata.readUInt32BE(pos):Number(metadata.readBigUInt64BE(pos));
     if(offset<mdat.start+mdat.header||offset>=mdat.start+mdat.size)throw Error('Offset de mídia fora do bloco esperado.');
     const updated=offset+moov.size;
     if(width===4){if(updated>0xffffffff)throw Error('Arquivo excede offsets de 32 bits.');metadata.writeUInt32BE(updated,pos);}
     else metadata.writeBigUInt64BE(BigInt(updated),pos);
     chunks++;
    }
   }
  }
 }
 adjust(moov.header,metadata.length);
 if(!chunks)throw Error('MP4 sem offsets de mídia reconhecidos.');
 const output=Buffer.concat([bytes.subarray(0,mdat.start),metadata,...boxes.filter(x=>x.start>=mdat.start&&x!==moov).map(x=>bytes.subarray(x.start,x.start+x.size))]);
 if(output.length!==bytes.length)throw Error('Tamanho inesperado após otimização.');
 const newMdat=atoms(output).find(x=>x.type==='mdat');
 if(!output.subarray(newMdat.start+newMdat.header,newMdat.start+newMdat.size).equals(bytes.subarray(mdat.start+mdat.header,mdat.start+mdat.size)))throw Error('Conteúdo de mídia alterado.');
 return {bytes:output,changed:true,chunks};
}
