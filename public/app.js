const db=window.supabase.createClient('https://lmfqffywplzardgpkzbo.supabase.co','sb_publishable_nk3234xukW8fi34J7U5xvQ_j7MEOEmM');const el=x=>document.getElementById(x),say=x=>el('notice').textContent=x,esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));async function role(){const{data:{user}}=await db.auth.getUser();if(!user)return null;const{data}=await db.from('staff_accounts').select('role,active').eq('user_id',user.id).maybeSingle();return data?.active?data.role:null}async function signIn(){const{error}=await db.auth.signInWithPassword({email:el('email').value.trim(),password:el('password').value});if(error)say(error.message);else location.reload()}async function signUp(){const{error}=await db.auth.signUp({email:el('email').value.trim(),password:el('password').value});say(error?error.message:'Account created. Check your email for a confirmation link, then sign in.')}async function signOut(){await db.auth.signOut();location.href='/'}async function submitApplication(){const{data:{user}}=await db.auth.getUser();if(!user)return say('Please sign in.');const{error}=await db.from('members').insert({owner_user_id:user.id,email:user.email,full_name:el('full_name').value.trim(),phone:el('phone').value.trim(),membership_type:el('membership_type').value,eagles_chapter:el('membership_type').value==='eagles'?el('chapter').value.trim():null});say(error?error.message:'Application submitted. Await administrator approval.');if(!error)location.reload()}async function member(){const{data:{user}}=await db.auth.getUser();const{data,error}=await db.from('members').select('full_name,member_number,application_status,payment_status,qr_token').eq('owner_user_id',user.id).maybeSingle();if(error)return say(error.message);if(!data){el('member').textContent='No application yet.';return}el('application').hidden=true;el('member').innerHTML='<h3>'+esc(data.full_name)+'</h3><p>Status: '+esc(data.application_status)+' | Payment: '+esc(data.payment_status)+'</p>'+(data.application_status==='approved'&&['paid','waived'].includes(data.payment_status)?'<p>Member number: '+esc(data.member_number)+'</p><div id="qrcode"></div><p>Save a screenshot of your QR card.</p>':'');if(el('qrcode')&&window.QRCode)new QRCode(el('qrcode'),{text:data.qr_token,width:220,height:220})}function readableDate(value){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(date)}
function summaryCard(label,amount){return '<div class="admin-stat"><strong>'+amount+'</strong><span>'+label+'</span></div>'}
async function admin(){
 if(await role()!=='admin')return say('Administrator access only.');
 const {data,error}=await db.from('members').select('id,full_name,email,phone,membership_type,member_number,application_status,payment_status,created_at,approved_at,qr_token').order('created_at',{ascending:false}).limit(500);
 if(error)return say(error.message);
 const all=data||[],pending=all.filter(m=>m.application_status==='pending'),history=all.filter(m=>m.application_status!=='pending');
 el('adminstats').innerHTML=summaryCard('Total applications',all.length)+summaryCard('Pending review',pending.length)+summaryCard('Approved',history.filter(m=>m.application_status==='approved').length)+summaryCard('Rejected',history.filter(m=>m.application_status==='rejected').length);
 el('adminlist').innerHTML=pending.map(m=>'<article class="card admin-request"><div class="admin-request-head"><strong>'+esc(m.full_name)+'</strong><span class="member-status pending">Pending</span></div><div class="admin-data"><span><b>Email</b>'+esc(m.email)+'</span><span><b>Mobile</b>'+esc(m.phone||'—')+'</span><span><b>Category</b>'+esc(m.membership_type)+'</span><span><b>Submitted</b>'+esc(readableDate(m.created_at))+'</span><span><b>Payment</b>'+esc(m.payment_status)+'</span></div><div class="admin-actions"><button data-id="'+esc(m.id)+'" data-a="approved">Confirm payment and approve</button><button data-id="'+esc(m.id)+'" data-a="rejected">Reject</button></div></article>').join('')||'<div class="admin-empty">No applications are awaiting review.</div>';
 window.nishlanApprovedRecords=history;
 const historyList=el('approval-history');
 if(historyList)historyList.innerHTML=history.length?'<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Customer</th><th>Membership</th><th>Submitted</th><th>Approved / reviewed</th><th>Status</th></tr></thead><tbody>'+history.map(m=>'<tr><td><strong>'+esc(m.full_name)+'</strong><small>'+esc(m.email)+'</small><small>'+esc(m.phone||'No phone')+'</small></td><td>'+esc(m.membership_type)+'<small>'+esc(m.member_number||'No number')+'</small></td><td>'+esc(readableDate(m.created_at))+'</td><td>'+esc(m.application_status==='approved'?readableDate(m.approved_at):'Not recorded')+'</td><td><span class="member-status '+(m.application_status==='approved'?'approved':'rejected')+'">'+esc(m.application_status)+'</span><small>Payment: '+esc(m.payment_status)+'</small>'+(m.application_status==='approved'?'<button class="resend-email small" data-resend-id="'+esc(m.id)+'">Send QR email again</button><button class="resend-email small" data-qr-id="'+esc(m.id)+'">View / download QR</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="admin-empty">No reviewed applications yet. Approved and rejected members will appear here.</div>';
window.showMemberQr=function(id){const m=(window.nishlanApprovedRecords||[]).find(x=>x.id===id);if(!m||m.application_status!=='approved'||!m.qr_token)return say('No QR code available for this member.');const area=el('qr-preview');const target=el('qr-preview-code');area.hidden=false;target.textContent='';if(!window.QRCode)return say('QR image library could not load. Refresh and try again.');new QRCode(target,{text:m.qr_token,width:230,height:230});el('qr-preview-number').textContent=m.full_name+' — '+(m.member_number||'');area.scrollIntoView({behavior:'smooth',block:'center'})};
window.downloadMemberQr=function(){const canvas=el('qr-preview-code')?.querySelector('canvas');const img=el('qr-preview-code')?.querySelector('img');const url=canvas?.toDataURL('image/png')||img?.src;if(!url)return say('QR image is not yet ready.');const a=document.createElement('a');a.href=url;a.download='Nishlan-Membership-QR.png';a.click()};
 if(historyList)historyList.onclick=async e=>{const show=e.target.closest('button[data-qr-id]');if(show){window.showMemberQr(show.dataset.qrId);return}const b=e.target.closest('button[data-resend-id]');if(!b)return;if(!confirm('Send the existing QR membership email to this customer again?'))return;b.disabled=true;say('Sending QR email…');try{const {data,error}=await db.functions.invoke('membership-email-retry',{body:{member_id:b.dataset.resendId}});let msg=data?.error||error?.message;if(error?.context){try{const detail=await error.context.json();msg=detail.error||msg}catch(_){}}say(msg||'QR email dispatched. Check the recipient inbox or spam folder.')}catch(error){say(error.message||'QR email could not be sent')}finally{b.disabled=false}};
 el('adminlist').onclick=async e=>{
 const b=e.target.closest('button[data-id]');if(!b)return;
 const approved=b.dataset.a==='approved';
 if(!confirm(approved?'Confirm the required payment was received and approve this membership?':'Reject this membership application?'))return;
 b.disabled=true;say('Processing decision…');
 try{
  const {data,error}=await db.functions.invoke('membership-review',{body:{member_id:b.dataset.id,decision:b.dataset.a}});
  let detail=error?.message||data?.error;
  if(error&&error.context){try{const result=await error.context.json();detail=result.error||detail}catch(_){}}
  if(detail){say(detail);b.disabled=false;return}
  const message=data?.email_status==='sent'?'Application saved and email sent.':data?.email_status==='not_configured'?'Application saved. Gmail integration is not configured yet.':data?.email_status==='failed'?'Application saved, but Gmail delivery failed. Check your email setup.':'Application decision saved.';
  await admin();say(message);
 }catch(err){say(err.message||'Unable to complete review.');b.disabled=false}
 };
}
let lastScannedToken='',lastScannedAt=0,scanInProgress=false,cashierScanner=null;
function cashierDate(value){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(date)}
function scanMessage(text,isError=false){const line=el('scan-status');if(line){line.textContent=text;line.className='scan-status'+(isError?' error':'')};if(isError)say(text)}
function resumeCashierScanner(){const result=el('result');if(result)result.hidden=true;const button=el('scan-again');if(button)button.hidden=true;lastScannedToken='';lastScannedAt=0;try{if(cashierScanner?.getState()===3)cashierScanner.resume();else if(cashierScanner?.getState()!==2)startCashierCamera()}catch(_){startCashierCamera()}scanMessage('Scanner is ready. Point your camera at the next membership QR code.')}
async function verifyQrImage(file){
 if(!file)return;
 if(!el('branch')?.value.trim()){scanMessage('Select your branch first, then upload the QR image.',true);el('branch')?.focus();return}
 scanMessage('Reading QR image…');
 try{
  if(!window.Html5Qrcode)throw Error('QR scanner library has not loaded. Refresh the page.');
  if(file.size>8*1024*1024)throw Error('Please select an image smaller than 8 MB.');
  const decoder=new Html5Qrcode('qr-file-reader',{verbose:false});
  const token=await decoder.scanFile(file,true);
  scanMessage('QR detected in the uploaded image. Checking membership…');
  await verifyToken(token);
 }catch(err){scanMessage('Could not read a QR from this image: '+(err.message||String(err)),true)}
 finally{if(el('qr-file'))el('qr-file').value=''}
}
async function verifyToken(token){
 const branch=el('branch')?.value.trim()||'';
 if(branch.length<2||branch.length>100){scanMessage('Please enter or select your branch before scanning.',true);el('branch')?.focus();return}
 const code=String(token||'').trim();if(!code){scanMessage('Please scan the QR card or enter its token.',true);return}
 if(scanInProgress||code===lastScannedToken&&Date.now()-lastScannedAt<12000)return;
 scanInProgress=true;lastScannedToken=code;lastScannedAt=Date.now();say('');scanMessage('QR detected. Checking membership…');
 const button=el('verify-button');if(button)button.disabled=true;
 try{
 const staffRole=await role();if(!['cashier','admin'].includes(staffRole))throw Error('Cashier authorization is required.');
 const {data,error}=await db.rpc('nishlan_verify_at_branch',{p_qr_token:code,p_branch:branch});
 if(error)throw error;
 const status=String(data?.verification_status||'INVALID').toUpperCase(),valid=status==='VALID';
 const result=el('result');result.hidden=false;result.className='cashier-result '+(valid?'is-valid':'is-invalid');
 result.innerHTML='<div class="cashier-result-badge">'+esc(status)+'</div><h3>'+esc(data?.member_name||'Unrecognized QR code')+'</h3><div class="cashier-result-meta"><span><b>Membership number</b>'+esc(data?.membership_number||'—')+'</span><span><b>Category</b>'+esc(data?.membership_category||'—')+'</span><span><b>Branch</b>'+esc(branch)+'</span><span><b>Verified on</b>'+esc(cashierDate(new Date().toISOString()))+'</span></div>';
 scanMessage(valid?'Membership verified successfully.':'QR checked. Please review the membership status shown above.',!valid);
 const again=el('scan-again');if(again)again.hidden=false;
 try{cashierScanner?.pause(true)}catch(_){}
 result.scrollIntoView({behavior:'smooth',block:'center'});
 if(el('token'))el('token').value='';
 await loadCashierHistory();
 }catch(error){scanMessage('Verification failed: '+(error.message||'Please retry or use manual verification.'),true);lastScannedToken='';lastScannedAt=0}
 finally{scanInProgress=false;if(button)button.disabled=false}
}
async function loadCashierHistory(){
 const target=el('cashier-history');if(!target)return;
 const {data,error}=await db.rpc('nishlan_cashier_history',{p_limit:100});
 if(error){target.textContent='Unable to load verification history: '+error.message;return}
 const rows=Array.isArray(data)?data:[];
 if(!rows.length){target.className='admin-empty';target.textContent='No QR verifications recorded yet. Your scans will appear here.';return}
 target.className='history-table-wrap';
 target.innerHTML='<table class="history-table"><thead><tr><th>Date and time</th><th>Customer details</th><th>Branch</th><th>Cashier</th><th>Result</th></tr></thead><tbody>'+rows.map(m=>'<tr><td>'+esc(cashierDate(m.verified_at))+'</td><td><strong>'+esc(m.member_name||'Unknown QR')+'</strong><small>'+esc(m.member_number||'No member number')+' · '+esc(m.membership_category||'—')+'</small><small>'+esc(m.email||'')+'</small><small>'+esc(m.phone||'')+'</small></td><td>'+esc(m.branch_name||'Not recorded')+'</td><td>'+esc(m.cashier_name||'Staff')+'</td><td><span class="member-status '+(m.result==='valid'?'approved':'rejected')+'">'+esc(m.result||'unknown')+'</span></td></tr>').join('')+'</tbody></table>';
}
let cashierCameraStarting=false;
async function startCashierCamera(){
 if(cashierCameraStarting)return;
 const camera=el('camera');
 if(!camera)return;
 if(!window.isSecureContext){scanMessage('Camera requires HTTPS. Open the official secure Nishlan website.',true);return}
 if(!window.Html5Qrcode){scanMessage('Camera scanner library has not loaded. Check your connection and reload.',true);return}
 cashierCameraStarting=true;const trigger=el('start-camera');if(trigger)trigger.disabled=true;
 try{
  if(cashierScanner){try{if(cashierScanner.getState()===2)await cashierScanner.stop()}catch(_){}try{await cashierScanner.clear()}catch(_){}}
  camera.innerHTML='';
  cashierScanner=new Html5Qrcode('camera',{verbose:false});
  const onDecoded=decoded=>{scanMessage('QR recognized! Verifying membership…');void verifyToken(decoded)};
  const config={fps:12,qrbox:(w,h)=>({width:Math.min(250,Math.round(w*.73)),height:Math.min(250,Math.round(h*.73))}),aspectRatio:1.3333333};
  try{
   await cashierScanner.start({facingMode:'environment'},config,onDecoded,()=>{});
  }catch(primary){
   const cameras=await Html5Qrcode.getCameras();
   if(!cameras.length)throw primary;
   const rear=cameras.find(c=>/back|rear|environment/i.test(c.label))||cameras[0];
   await cashierScanner.start(rear.id,config,onDecoded,()=>{});
  }
  scanMessage('Camera is scanning. Hold the member QR code inside the frame.');
 }catch(error){
  const message=String(error?.message||error);
  scanMessage(/NotAllowed|Permission|denied/i.test(message)?'Camera permission denied. Allow camera access for this site in your browser settings, then press Start / restart camera.':'Camera could not start: '+message+'. Press Start / restart camera to retry.',true);
 }finally{cashierCameraStarting=false;if(trigger)trigger.disabled=false}
}
async function init(){const{data:{user}}=await db.auth.getUser();el('auth').hidden=!!user;el('signed').hidden=!user;if(!user)return;el('who').textContent=user.email;if(location.pathname.startsWith('/admin'))return admin();if(location.pathname.startsWith('/cashier')){if(!['cashier','admin'].includes(await role()))return say('Cashier access only.');el('scanner').hidden=false;try{el('branch').value=localStorage.getItem('nishlan_cashier_branch')||'';el('branch').addEventListener('change',()=>localStorage.setItem('nishlan_cashier_branch',el('branch').value.trim()))}catch(_){}await loadCashierHistory();scanMessage('Starting the camera. Select your branch for verification.');await startCashierCamera();return}el('application').hidden=false;await member()}document.addEventListener('DOMContentLoaded',init);