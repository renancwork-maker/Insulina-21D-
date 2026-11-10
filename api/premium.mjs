const PREMIUM_HTML = "<section class=\"premium-member-content\"><div class=\"welcome\"><div><div class=\"eyebrow\">MEMBRO PREMIUM · PLANO R$ 67</div><h2>Bem-vinda à sua área exclusiva!</h2><p>Seu planejamento pessoal para acompanhar o programa.</p></div><span class=\"medal\">✧</span></div><div class=\"metrics\"><div class=\"metric\"><span id=\"count\">0</span><small>dias acompanhados</small></div><div class=\"metric\"><span id=\"percentage\">0%</span><small>do seu planner</small></div></div><div class=\"card panel\"><div class=\"panel-head\"><div><div class=\"eyebrow\">SEU PLANEJAMENTO</div><h3>Planner dos 21 dias</h3></div><span class=\"small-tag\">EXCLUSIVO</span></div><p>Selecione os dias conforme avançar. Você pode registrar suas anotações abaixo.</p><div class=\"day-grid\" id=\"days\"></div></div><div class=\"card panel\"><div class=\"panel-head\"><div><div class=\"eyebrow\">MEU CADERNO</div><h3>Anotações da jornada</h3></div><span class=\"small-tag\">PESSOAL</span></div><label class=\"notes-label\" for=\"notes\">Como foi seu dia?</label><textarea id=\"notes\" rows=\"5\" placeholder=\"Registre suas metas, dúvidas e aprendizados.\"></textarea><div class=\"note-row\"><p>Salvo somente neste aparelho.</p><span id=\"saved\" role=\"status\" aria-live=\"polite\"></span></div></div><div class=\"card panel extras\"><div class=\"panel-head\"><div><div class=\"eyebrow\">MAIS RECURSOS</div><h3>Continue a sua experiência</h3></div></div><a href=\"/jornada\" class=\"resource\"><span class=\"res-ico\">◷</span><span><strong>Minha jornada no aplicativo</strong><small>Abra o acompanhamento dos 21 dias</small></span><span>↗</span></a><a href=\"/presentes\" class=\"resource\"><span class=\"res-ico\">✦</span><span><strong>Presentes do aplicativo</strong><small>Consulte os materiais disponíveis</small></span><span>↗</span></a></div><button id=\"exit\" class=\"exit\">Sair da área Premium neste aparelho</button></section>";
import { createHmac, timingSafeEqual } from 'node:crypto';
const MAX_AGE = 7*24*60*60;
const COOKIE = 'clube_vip_67';
const json = (body,status=200,headers={}) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const codeEqual = (a,b) => { const A=Buffer.from(a||'','utf8'),B=Buffer.from(b||'','utf8');return A.length===B.length && A.length>0 && timingSafeEqual(A,B); };
const sign = (payload,secret) => createHmac('sha256',secret).update(payload).digest('hex');
const getCookies = header=>Object.fromEntries((header||'').split(';').map(v=>{const p=v.trim().indexOf('=');return p<0?[v.trim(),'']:[v.trim().slice(0,p),v.trim().slice(p+1)]}));
function authorized(request,secret){const value=getCookies(request.headers.get('cookie'))[COOKIE]||'';const [exp,signature]=value.split('.');if(!/^[0-9]{10}$/.test(exp)||!signature||+exp<=Math.floor(Date.now()/1000))return false;return codeEqual(signature,sign(exp,secret));}
async function handlePremium(request) {
  const code=(process.env.PREMIUM_ACCESS_CODE||'').trim();const secret=(process.env.PREMIUM_SESSION_SECRET||'').trim();
  if(code.length<12||secret.length<32)return json({error:'A área Premium ainda não foi ativada pelo administrador.'},503);
  if(request.method==='GET')return authorized(request,secret)?json({authorized:true,plan:'premium',amount:67,html:PREMIUM_HTML}):json({authorized:false},401);
  if(request.method!=='POST')return json({error:'Método não permitido'},405,{'allow':'GET, POST'});
  let input={};try{if(Number(request.headers.get('content-length')||0)>4096)return json({error:'Solicitação inválida'},413);input=await request.json()}catch{return json({error:'Formato inválido'},400)}
  if(input.action==='logout')return json({ok:true},200,{'set-cookie':`${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`});
  if(input.action!=='unlock'||typeof input.code!=='string'||input.code.length>128)return json({error:'Dados de acesso inválidos.'},400);
  if(!codeEqual(input.code.trim(),code))return json({error:'Código inválido. Confira o código recebido após a compra.'},401);
  const exp=String(Math.floor(Date.now()/1000)+MAX_AGE),value=exp+'.'+sign(exp,secret);
  return json({authorized:true},200,{'set-cookie':`${COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`});
};

export default { fetch(request) { return handlePremium(request); } };
