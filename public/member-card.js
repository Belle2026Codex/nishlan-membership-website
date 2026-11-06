/* Nishlan digital card - retain the original scanner QR token unchanged. */
const NishlanCard={
 async build(member){
  if(!member?.qr_token)throw Error('This membership does not yet have a QR code.');
  if(typeof QRCode==='undefined')throw Error('QR library unavailable. Reload the page.');
  const qrHolder=document.createElement('div');qrHolder.style.cssText='position:fixed;left:-9999px;top:0';
  document.body.appendChild(qrHolder);
  try{
   new QRCode(qrHolder,{text:String(member.qr_token),width:440,height:440,colorDark:'#111111',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
   await new Promise(r=>setTimeout(r,80));
   const source=qrHolder.querySelector('canvas')||qrHolder.querySelector('img');
   if(!source)throw Error('QR image could not be rendered.');
   if(source.tagName==='IMG'&&!source.complete)await new Promise((resolve,reject)=>{source.onload=resolve;source.onerror=reject});
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;
   const c=canvas.getContext('2d');const grad=c.createLinearGradient(0,0,1200,720);grad.addColorStop(0,'#fffdf6');grad.addColorStop(1,'#e5d4b8');c.fillStyle=grad;c.fillRect(0,0,1200,720);
   c.fillStyle='#133f2b';c.fillRect(0,0,1200,156);c.fillStyle='#cda35b';c.fillRect(0,156,1200,10);
   c.fillStyle='#fffaf0';c.font='bold 64px Georgia,serif';c.fillText('NISHLAN',56,83);c.font='23px Arial,sans-serif';c.fillText('FOODLIFE & MARKETING INC.',58,121);
   c.fillStyle='#b48b50';c.fillRect(0,654,1200,66);
   c.fillStyle='#234631';c.font='bold 24px Arial,sans-serif';c.fillText('OFFICIAL MEMBERSHIP CARD',57,224);
   const type=String(member.membership_type||'general').toLowerCase()==='eagles'?'EAGLES · LIFETIME MEMBERSHIP':'GENERAL · 1-YEAR MEMBERSHIP';
   c.fillStyle='#795b2e';c.font='bold 30px Arial,sans-serif';c.fillText(type,57,273);
   const name=String(member.full_name||'MEMBER').toUpperCase();let fontSize=49;c.font='bold '+fontSize+'px Arial,sans-serif';
   while(c.measureText(name).width>660&&fontSize>22){fontSize-=2;c.font='bold '+fontSize+'px Arial,sans-serif'}
   c.fillStyle='#133f2b';c.fillText(name,57,355);
   c.fillStyle='#677465';c.font='bold 19px Arial,sans-serif';c.fillText('MEMBERSHIP NUMBER',57,415);
   c.fillStyle='#22432d';c.font='30px Arial,sans-serif';c.fillText(String(member.member_number||'—'),57,456);
   c.fillStyle='#677465';c.font='bold 19px Arial,sans-serif';c.fillText('VALIDITY',57,513);
   c.fillStyle='#22432d';c.font='28px Arial,sans-serif';c.fillText(NishlanCard.validity(member),57,554);
   c.fillStyle='#fff';c.fillRect(765,199,389,389);c.strokeStyle='#cfb98e';c.lineWidth=4;c.strokeRect(765,199,389,389);
   c.imageSmoothingEnabled=false;c.drawImage(source,788,222,344,344);
   c.fillStyle='#fff';c.font='bold 20px Arial,sans-serif';c.fillText('PRESENT THIS CARD TO THE CASHIER',58,696);
   return canvas;
  }finally{qrHolder.remove()}
 },
 validity(m){
  if(String(m.membership_type).toLowerCase()==='eagles')return 'LIFETIME';
  const raw=m.approved_at||m.created_at;if(!raw)return '1 YEAR FROM APPROVAL';
  const date=new Date(raw);if(Number.isNaN(date.getTime()))return '1 YEAR FROM APPROVAL';
  const end=new Date(date);end.setFullYear(end.getFullYear()+1);
  return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeZone:'Asia/Manila'}).format(date)+' - '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeZone:'Asia/Manila'}).format(end);
 },
 async preview(member,target){const canvas=await NishlanCard.build(member);target.replaceChildren(canvas);canvas.style.cssText='width:100%;max-width:720px;height:auto;display:block;margin:auto;border-radius:14px';return canvas},
 download(canvas,number){const link=document.createElement('a');link.download='Nishlan-Membership-'+String(number||'Card').replace(/[^a-z0-9_-]/gi,'-')+'.png';link.href=canvas.toDataURL('image/png');link.click()}
};