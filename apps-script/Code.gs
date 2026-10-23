/**
 * Nishlan Membership Gmail sender.
 * Set Script property NISHLAN_EMAIL_SECRET to a long random secret.
 * Deploy as Web app: Execute as Me; access Anyone.
 * Store the same secret and web app URL in Supabase Edge Function secrets.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('NISHLAN_EMAIL_SECRET');
    if (!secret || data.secret !== secret) return json_({ok:false,error:'Unauthorized'});
    const recipient = String(data.recipient || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return json_({ok:false,error:'Invalid recipient'});
    const name = String(data.name || 'Member').slice(0,120);
    const approved = data.decision === 'approved';
    if (!approved && data.decision !== 'rejected') return json_({ok:false,error:'Invalid decision'});
    const title = approved ? 'Nishlan Membership Approved' : 'Nishlan Membership Application Update';
    const body = approved
      ? 'Hello ' + name + ',\n\nYour Nishlan membership has been approved.\nMembership number: ' + (data.member_number || 'See Nishlan administration') + '\n\nYour QR membership card is attached below. Present it at a Nishlan branch.\n\nNishlan FoodLife & Marketing Inc.'
      : 'Hello ' + name + ',\n\nYour Nishlan membership application was not approved at this time. Please contact Nishlan for details.\n\nNishlan FoodLife & Marketing Inc.';
    const options = {name:'Nishlan FoodLife & Marketing Inc.'};
    if (approved && data.qr_png) {
      const bytes = Utilities.base64Decode(data.qr_png);
      const qr = Utilities.newBlob(bytes, 'image/png', 'Nishlan-Membership-QR.png');
      options.attachments = [qr];
      options.htmlBody = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:26px;background:#fffaf2;color:#183d2c;border:1px solid #e9dcc7;border-radius:16px"><h1 style="color:#164c31">NISHLAN</h1><p>FoodLife &amp; Marketing Inc.</p><h2>Membership approved</h2><p>Hello '+escapeHtml_(name)+',</p><p>Your membership has been approved.</p><p><strong>Membership number:</strong> '+escapeHtml_(String(data.member_number||''))+'</p><p>Show the attached QR code at participating Nishlan branches.</p><p>Thank you for being part of Nishlan.</p></div>';
    }
    GmailApp.sendEmail(recipient,title,body,options);
    return json_({ok:true});
  } catch (err) {
    console.error(err);
    return json_({ok:false,error:'Unable to send email'});
  }
}
function escapeHtml_(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)}

// Public health check. Never reveal the private security secret.
function doGet(e) {
  return json_({ok:true,service:'Nishlan Membership Email System',ready:!!PropertiesService.getScriptProperties().getProperty('NISHLAN_EMAIL_SECRET')});
}
