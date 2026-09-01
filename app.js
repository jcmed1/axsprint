const STORAGE_KEY = 'ax-sprint-control-tower-v24';
const LEGACY_STORAGE_KEYS = ['ax-sprint-control-tower-v22','ax-sprint-control-tower-v21','ax-sprint-control-tower-v20','ax-sprint-control-tower-v19','ax-sprint-control-tower-v18','ax-sprint-control-tower-v11','ax-sprint-control-tower-v10','ax-sprint-control-tower-v9','ax-sprint-control-tower-v8','ax-sprint-control-tower-v7','ax-sprint-control-tower-v6','ax-sprint-control-tower-v5','ax-sprint-control-tower-v4'];
const STATUS_OPTIONS = ['예정','진행 중','협업기관 회신 대기','PM 검토 대기','PM 결정 필요','지연','완료 요청','완료 승인','보류'];
const KPI_STATUS_OPTIONS = ['미측정','준비 중','진행 중','주의','위험','달성','미달'];
const REQUEST_STATUS = ['요청','수신 확인','처리 중','답변 완료','요청자 확인 대기','종결','기한 초과','PM 조정 필요'];
const PARTNER_ORDER = ['경복대학교','돌봄과 미래','에임랩'];
const PORTAL_ORDER = ['정션메드',...PARTNER_ORDER];
const DISPLAY_ORDER = [...PARTNER_ORDER,'정션메드'];
const PORTAL_CODE = {'main':'정션메드','kbu':'경복대학교','care':'돌봄과 미래','aimlab':'에임랩'};
const INSTITUTION_CODE = Object.fromEntries(Object.entries(PORTAL_CODE).map(([code,name])=>[name,code]));
const NAV = [
  ['workboard','▣','기관 진행현황'],['dashboard','▦','PM 대시보드'],['verification','◈','실증 관리'],['kpis','◎','성과목표'],['institutions','◫','기관 관리'],['actions','✓','진행항목'],
  ['requests','⇄','요청·회신'],['memos','▧','협의사항'],['timeline','▤','전체 일정'],['records','≡','회의·문서'],['users','♙','사용자 관리'],['settings','⚙','관리설정']
];
let state = loadState();
const urlParams = new URLSearchParams(location.search);
let supabaseClient = null;
let supabaseReady = false;
let remoteInitialized = false;
let remoteUpdatedAt = '';
let remoteSaveTimer = null;
let remoteSaveBusy = false;
let remoteSaveQueued = false;
let currentUser = null;
let currentProfile = null;
let isAdmin = false;
let authReady = false;
let portalInstitution = PORTAL_CODE[urlParams.get('inst')] || PORTAL_ORDER[0];
let portalDetailTab = 'all';
let portalListFilter = 'all';
let portalRequestView = 'all';
let currentView = 'portal';
let viewFilter = {};
let adminUsersCache = null;
let adminUsersLoading = false;
let adminResetRequestsCache = [];
let verificationSites=[];
let verificationLoaded=false;
let verificationLoading=false;

function clone(v){return JSON.parse(JSON.stringify(v));}
function renameLegacyInstitution(value){
  if(Array.isArray(value)) return value.map(renameLegacyInstitution);
  if(value && typeof value==='object'){
    Object.keys(value).forEach(k=>{ value[k]=renameLegacyInstitution(value[k]); });
    return value;
  }
  if(typeof value==='string') return value.replaceAll('경복대학교 산학협력단','경복대학교').replaceAll('경복대학교산학협력단','경복대학교');
  return value;
}
function normalizeFlexibleActions(data){
  (data.actions||[]).forEach((a,index)=>{
    if(a.baselineStart===undefined) a.baselineStart=a.start||'';
    if(a.baselineEnd===undefined) a.baselineEnd=a.end||'';
    if(a.parentId===undefined) a.parentId='';
    if(a.active===undefined) a.active=true;
    if(a.changeReason===undefined) a.changeReason='';
    if(a.sortOrder===undefined) a.sortOrder=(index+1)*10;
    if(!Array.isArray(a.stages)) a.stages=[];
    if(a.displayCode===undefined) a.displayCode=`AX-${String(index+1).padStart(4,'0')}`;
  });
  (data.requests||[]).forEach(r=>{normalizeRequest(r);if(r.replyLocked===undefined)r.replyLocked=requestReplyCount(r)>0;});
  (data.memos||[]).forEach((m,mi)=>{
    if(!m.createdByInstitution) m.createdByInstitution=m.institution||'';
    (m.messages||[]).forEach((msg,idx)=>{if(!msg.id)msg.id=`MSG-LEGACY-${mi+1}-${idx+1}`;if(!msg.authorInstitution)msg.authorInstitution=m.createdByInstitution||m.institution||'';});
    if(m.replyLocked===undefined)m.replyLocked=(m.messages||[]).length>1;
  });
  data.project=data.project||{};
  data.project.version='Secure v24';
  return data;
}
function requestRecipients(r){
  const raw=Array.isArray(r?.toInstitutions)?r.toInstitutions:(Array.isArray(r?.to)?r.to:(r?.to?[r.to]:[]));
  return [...new Set(raw.filter(Boolean).map(renameLegacyInstitution))];
}
function normalizeRequest(r){
  if(!r||typeof r!=='object') return r;
  const recipients=requestRecipients(r);
  r.toInstitutions=recipients;
  r.to=recipients[0]||r.to||'';
  if(!r.responses||typeof r.responses!=='object'||Array.isArray(r.responses)) r.responses={};
  if(r.response && r.to && !r.responses[r.to]){
    r.responses[r.to]={text:r.response,date:r.responseDate||'',confirmation:r.confirmation||''};
  }
  recipients.forEach(name=>{
    const old=r.responses[name];
    if(typeof old==='string') r.responses[name]={text:old,date:'',confirmation:''};
    else if(!old||typeof old!=='object') r.responses[name]={text:'',date:'',confirmation:''};
    else r.responses[name]={text:old.text||old.response||'',date:old.date||old.responseDate||'',confirmation:old.confirmation||''};
  });
  r.requestedAt=r.requestedAt||'';
  r.confirmation=r.confirmation||'';
  syncRequestLegacyFields(r);
  return r;
}
function requestIncludesRecipient(r,name){return requestRecipients(r).includes(name);}
function requestResponse(r,name){
  normalizeRequest(r);
  return r.responses?.[name]||{text:'',date:'',confirmation:''};
}
function requestReplyCount(r){return requestRecipients(r).filter(name=>(requestResponse(r,name).text||'').trim()).length;}
function requestAllReplied(r){const recipients=requestRecipients(r);return !!recipients.length && requestReplyCount(r)===recipients.length;}
function requestNeedsReply(r,name){return requestIncludesRecipient(r,name)&&requestLiveStatus(r)!=='종결'&&!(requestResponse(r,name).text||'').trim();}
function syncRequestLegacyFields(r){
  const recipients=requestRecipients(r);
  r.toInstitutions=recipients;
  r.to=recipients[0]||'';
  if(recipients.length===1){
    const resp=r.responses?.[recipients[0]]||{};
    r.response=resp.text||'';r.responseDate=resp.date||'';r.confirmation=resp.confirmation||'';
  }else{r.response='';r.responseDate='';r.confirmation='';}
  return r;
}
function requestRecipientLabel(r){const names=requestRecipients(r);return names.length===PORTAL_ORDER.length-1?'전체 요청':names.join(', ');}
function requestLiveStatus(r){
  if(['종결','PM 조정 필요'].includes(r.status)) return r.status;
  if(requestAllReplied(r)) return '답변 완료';
  if(requestReplyCount(r)>0) return '처리 중';
  if(r.due && r.due<today()) return '기한 초과';
  return r.status||'요청';
}
function requestLocked(r){return r?.replyLocked===true||requestReplyCount(r)>0;}
function canEditRequest(r){return !!currentProfile && (currentProfile.role==='admin'||r.from===currentProfile.institution) && !requestLocked(r);}
function canDeleteRequest(r){return canEditRequest(r);}
function memoCreator(m){return m?.createdByInstitution||m?.institution||'';}
function memoLocked(m){return m?.replyLocked===true||(m?.messages||[]).length>1;}
function canEditMemo(m){return !!currentProfile && (currentProfile.role==='admin'||memoCreator(m)===currentProfile.institution) && !memoLocked(m);}
function canDeleteMemo(m){return canEditMemo(m);}
function canEditMemoMessage(m,msg,index){const msgs=m?.messages||[];return !!currentProfile && index===msgs.length-1 && (currentProfile.role==='admin'||msg?.authorInstitution===currentProfile.institution);}
function recipientPickerHTML(id,names,selected=[],allowAll=true){
  const values=[...new Set(selected||[])];
  const allChecked=names.length>0 && names.every(n=>values.includes(n));
  return `<div class="recipient-picker" id="${id}">${allowAll?`<label class="recipient-choice recipient-choice-all"><input type="checkbox" data-recipient-all="${id}" ${allChecked?'checked':''}><span><strong>전체 요청</strong><small>선택 가능한 모든 기관</small></span></label>`:''}<div class="recipient-choice-grid">${names.map(name=>`<label class="recipient-choice"><input type="checkbox" name="${id}-recipient" value="${esc(name)}" ${values.includes(name)?'checked':''}><span><strong>${esc(name)}</strong></span></label>`).join('')}</div></div>`;
}
function selectedRecipients(id){return [...document.querySelectorAll(`input[name="${id}-recipient"]:checked`)].map(x=>x.value);}
function bindRecipientPicker(id){
  const all=document.querySelector(`[data-recipient-all="${id}"]`);const boxes=[...document.querySelectorAll(`input[name="${id}-recipient"]`)];
  if(!all)return;
  all.onchange=()=>boxes.forEach(b=>{if(!b.disabled)b.checked=all.checked;});
  boxes.forEach(b=>b.onchange=()=>{const enabled=boxes.filter(x=>!x.disabled);all.checked=enabled.length>0&&enabled.every(x=>x.checked);all.indeterminate=enabled.some(x=>x.checked)&&!all.checked;});
}

function loadState(){
  try {
    const current=localStorage.getItem(STORAGE_KEY);
    let data;
    if(current){
      data=JSON.parse(current);
    }else{
      const legacyRaw=LEGACY_STORAGE_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);
      data=legacyRaw ? JSON.parse(legacyRaw) : clone(window.INITIAL_DATA);
      if(legacyRaw){
        const criteriaById=Object.fromEntries((window.INITIAL_DATA.actions||[]).map(a=>[a.id,a.completionCriteria]));
        (data.actions||[]).forEach(a=>{ if(criteriaById[a.id]) a.completionCriteria=criteriaById[a.id]; });
        data.project=data.project||{};
        data.project.version=window.INITIAL_DATA.project.version;
        data.project.completionCriteriaBasis=window.INITIAL_DATA.project.completionCriteriaBasis;
        localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      }
    }
    data=normalizeFlexibleActions(renameLegacyInstitution(data));
    data.requests=data.requests||[]; data.memos=data.memos||[];
    data.requests.forEach(normalizeRequest);
    return data;
  } catch(e){ const data=normalizeFlexibleActions(clone(window.INITIAL_DATA)); data.memos=data.memos||[]; return data; }
}
function orderedInstitutions(){
  return DISPLAY_ORDER.map(name=>state.institutions.find(i=>i.name===name)).filter(Boolean);
}
function normalizeInstitutionOrder(){
  const ordered=orderedInstitutions();
  const extra=state.institutions.filter(i=>!DISPLAY_ORDER.includes(i.name));
  state.institutions=[...ordered,...extra];
}
normalizeInstitutionOrder();
function persistLocal(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}
function setSyncStatus(text,tone=''){
  const el=document.getElementById('syncStatus'); if(!el)return;
  el.textContent=text; el.className='sync-badge '+tone;
}
function loginIdToEmail(loginId){return `${String(loginId||'').trim().toLowerCase()}@ax-sprint.example.com`;}
function profileInstitution(){return currentProfile?.institution||'';}
function canEditInstitution(name){return !!currentProfile && (currentProfile.role==='admin'||currentProfile.institution===name);}
function canManageAction(a){return !!currentProfile && (currentProfile.role==='admin'||a?.owner===currentProfile.institution);}
function actionCode(a){return (a?.displayCode||'').trim();}
function actionLabel(a){if(!a)return '연결 항목 없음';return `${actionCode(a)?'['+actionCode(a)+'] ':''}${a.name||''}`;}
function actionById(id){return (state.actions||[]).find(a=>a.id===id);}
function relatedActionHTML(id,compact=false){
  const a=actionById(id); if(!a)return id?`<span class="related-action-missing">연결 항목 확인 필요</span>`:'';
  return `<button type="button" class="related-action-link ${compact?'compact':''}" data-go-action="${esc(a.id)}">${actionCode(a)?`<span class="action-code-tag">${esc(actionCode(a))}</span>`:''}<span>${esc(a.name)}</span></button>`;
}
function nextActionDisplayCode(){
  let max=0;(state.actions||[]).forEach(a=>{const m=String(a.displayCode||'').match(/^AX-(\d{4})$/);if(m)max=Math.max(max,Number(m[1]));});
  return `AX-${String(max+1).padStart(4,'0')}`;
}
function saveState(){
  persistLocal();
  if(isAdmin && supabaseReady && currentProfile?.role==='admin') scheduleRemoteSave();
}
function scheduleRemoteSave(){
  clearTimeout(remoteSaveTimer);setSyncStatus('저장 대기','syncing');remoteSaveTimer=setTimeout(pushRemoteState,450);
}
async function pushRemoteState(){
  if(!supabaseClient||!currentUser||currentProfile?.role!=='admin')return;
  if(remoteSaveBusy){remoteSaveQueued=true;return;}
  remoteSaveBusy=true;setSyncStatus('공유DB 저장 중','syncing');
  try{
    const {data,error}=await supabaseClient.rpc('ax_admin_save_state_v21',{p_state:state});
    if(error)throw error;remoteInitialized=true;remoteUpdatedAt=data||new Date().toISOString();setSyncStatus('공유DB 저장됨','ok');
  }catch(e){console.error(e);setSyncStatus('저장 실패','error');toast('공유DB 저장에 실패했습니다.');}
  finally{remoteSaveBusy=false;if(remoteSaveQueued){remoteSaveQueued=false;scheduleRemoteSave();}}
}
async function refreshFromRemote(silent=false){
  if(!supabaseClient||!currentUser||!currentProfile)return false;
  if(!silent)setSyncStatus('공유DB 불러오는 중','syncing');
  const {data,error}=await supabaseClient.from('ax_project_state').select('state,updated_at').eq('id','main').maybeSingle();
  if(error){console.error(error);if(error.code==='42501'||error.code==='PGRST301'){setSyncStatus('접근 권한 없음','error');}else setSyncStatus('DB 확인 필요','error');return false;}
  supabaseReady=true;
  if(!data||!data.state){remoteInitialized=false;setSyncStatus('초기 데이터 필요','warn');return false;}
  const incoming=normalizeFlexibleActions(renameLegacyInstitution(data.state));incoming.requests=incoming.requests||[];incoming.requests.forEach(normalizeRequest);incoming.memos=incoming.memos||[];
  state=incoming;normalizeInstitutionOrder();persistLocal();remoteInitialized=true;remoteUpdatedAt=data.updated_at||'';setSyncStatus('공유DB 연결됨','ok');
  if(!verificationLoaded)loadVerificationSites(true);if(!silent||!isAdmin)render();return true;
}
async function loadCurrentProfile(){
  if(!supabaseClient||!currentUser)return null;
  const {data,error}=await supabaseClient.rpc('ax_current_profile');
  if(error){console.error(error);return null;}
  const p=Array.isArray(data)?data[0]:data;if(!p||p.active===false)return null;
  currentProfile=p;if(p.role==='admin'&&urlParams.get('admin')==='1')sessionStorage.setItem('ax-admin-mode-v22','1');isAdmin=p.role==='admin' && sessionStorage.getItem('ax-admin-mode-v22')==='1';
  if(!urlParams.get('inst') && p.role!=='admin')portalInstitution=p.institution;
  try{await supabaseClient.rpc('ax_touch_login_v21');}catch(_e){}
  return p;
}
async function handleSession(session){
  currentUser=session?.user||null;currentProfile=null;isAdmin=false;authReady=true;
  if(!currentUser){setSyncStatus('로그인 필요','warn');showLogin(true);render();return;}
  const p=await loadCurrentProfile();
  if(!p){await supabaseClient.auth.signOut();currentUser=null;showLogin(true,'사용 권한이 없는 계정입니다. 관리자에게 문의해 주십시오.');render();return;}
  hideLogin();await refreshFromRemote(false);render();
  if(currentUser?.user_metadata?.must_change_password){setTimeout(()=>{toast('초기 비밀번호를 새 비밀번호로 변경해 주십시오.');openMyAccount(true);},250);}
}
async function initSupabaseSync(){
  try{
    const cfg=window.AX_SUPABASE_CONFIG;
    if(!cfg?.url||!cfg?.publishableKey||!window.supabase){authReady=true;setSyncStatus('DB 설정 필요','error');showLogin(true,'Supabase 설정을 확인해 주십시오.');return;}
    supabaseClient=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});supabaseReady=true;
    const {data:{session}}=await supabaseClient.auth.getSession();await handleSession(session);
    supabaseClient.auth.onAuthStateChange((event,newSession)=>{if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){setTimeout(()=>handleSession(newSession),0);}});
  }catch(e){console.error(e);authReady=true;supabaseReady=false;setSyncStatus('연결 실패','error');showLogin(true,'공유DB 연결에 실패했습니다.');}
}
async function signIn(loginId,password){
  if(!supabaseClient)throw new Error('Supabase 연결이 없습니다.');
  const {data,error}=await supabaseClient.auth.signInWithPassword({email:loginIdToEmail(loginId),password});if(error)throw error;return data;
}
async function signOut(){if(supabaseClient)await supabaseClient.auth.signOut();sessionStorage.removeItem('ax-admin-mode-v22');currentUser=null;currentProfile=null;isAdmin=false;currentView='portal';showLogin(true);render();}
async function portalCreateActionRemote(payload){
  const {data,error}=await supabaseClient.rpc('ax_portal_create_action_v21',{p_action:payload});if(error)throw error;await refreshFromRemote(true);return data;
}
async function portalUpdateActionRemote(id,patch){const {error}=await supabaseClient.rpc('ax_portal_update_action_v21',{p_action_id:id,p_patch:patch});if(error)throw error;await refreshFromRemote(true);}
async function portalDeleteActionRemote(id){const {error}=await supabaseClient.rpc('ax_portal_delete_action_v21',{p_action_id:id});if(error)throw error;await refreshFromRemote(true);}
async function portalCreateRequestRemote(r){
  const {data,error}=await supabaseClient.rpc('ax_portal_create_request_v21',{p_recipients:requestRecipients(r),p_title:r.title,p_content:r.content,p_requested_at:r.requestedAt||today(),p_due:r.due||'',p_related_action:r.relatedAction||''});
  if(error)throw error;await refreshFromRemote(true);return data;
}
async function portalUpdateRequestRemote(r){const {error}=await supabaseClient.rpc('ax_portal_update_request_v21',{p_request_id:r.id,p_patch:{title:r.title,content:r.content,requestedAt:r.requestedAt,due:r.due,relatedAction:r.relatedAction,status:r.status,toInstitutions:requestRecipients(r)}});if(error)throw error;await refreshFromRemote(true);}
async function portalDeleteRequestRemote(id){const {error}=await supabaseClient.rpc('ax_portal_delete_request_v21',{p_request_id:id});if(error)throw error;await refreshFromRemote(true);}
async function portalReplyRequestRemote(r){const resp=requestResponse(r,profileInstitution());const {error}=await supabaseClient.rpc('ax_portal_reply_request_v21',{p_request_id:r.id,p_response:resp.text,p_response_date:resp.date||today()});if(error)throw error;await refreshFromRemote(true);}
async function portalDeleteRequestResponseRemote(id){const {error}=await supabaseClient.rpc('ax_portal_delete_request_response_v21',{p_request_id:id});if(error)throw error;await refreshFromRemote(true);}
async function portalCreateMemoRemote(m,text){const {data,error}=await supabaseClient.rpc('ax_portal_create_memo_v21',{p_title:m.title,p_text:text,p_date:today(),p_related_action:m.relatedAction||''});if(error)throw error;await refreshFromRemote(true);return data;}
async function portalUpdateMemoRemote(m,text){const {error}=await supabaseClient.rpc('ax_portal_update_memo_v21',{p_memo_id:m.id,p_title:m.title,p_text:text,p_related_action:m.relatedAction||'',p_status:m.status||'진행'});if(error)throw error;await refreshFromRemote(true);}
async function portalDeleteMemoRemote(id){const {error}=await supabaseClient.rpc('ax_portal_delete_memo_v21',{p_memo_id:id});if(error)throw error;await refreshFromRemote(true);}
async function portalAddMemoMessageRemote(id,text,date=today()){const {error}=await supabaseClient.rpc('ax_portal_add_memo_message_v21',{p_memo_id:id,p_text:text,p_date:date});if(error)throw error;await refreshFromRemote(true);}
async function portalUpdateMemoMessageRemote(memoId,messageId,text,date=today()){const {error}=await supabaseClient.rpc('ax_portal_update_memo_message_v21',{p_memo_id:memoId,p_message_id:messageId,p_text:text,p_date:date});if(error)throw error;await refreshFromRemote(true);}
async function portalDeleteMemoMessageRemote(memoId,messageId){const {error}=await supabaseClient.rpc('ax_portal_delete_memo_message_v21',{p_memo_id:memoId,p_message_id:messageId});if(error)throw error;await refreshFromRemote(true);}
async function adminSetRequestResponseRemote(requestId,institution,text,date,confirmation,del=false){const {error}=await supabaseClient.rpc('ax_admin_set_request_response_v21',{p_request_id:requestId,p_institution:institution,p_text:text||'',p_date:date||'',p_confirmation:confirmation||'',p_delete:del});if(error)throw error;await refreshFromRemote(true);}
async function callUserAdmin(action,payload={}){
  const cfg=window.AX_SUPABASE_CONFIG;const {data:{session}}=await supabaseClient.auth.getSession();if(!session)throw new Error('로그인이 필요합니다.');
  const res=await fetch(`${cfg.url}/functions/v1/ax-user-admin`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.publishableKey},body:JSON.stringify({action,...payload})});
  const out=await res.json().catch(()=>({}));if(!res.ok)throw new Error(out.error||'사용자 관리 요청에 실패했습니다.');return out;
}
async function callUserAdminPublic(action,payload={}){
  const cfg=window.AX_SUPABASE_CONFIG;if(!cfg?.url||!cfg?.publishableKey)throw new Error('Supabase 설정이 필요합니다.');
  const res=await fetch(`${cfg.url}/functions/v1/ax-user-admin`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.publishableKey},body:JSON.stringify({action,...payload})});
  const out=await res.json().catch(()=>({}));if(!res.ok)throw new Error(out.error||'계정 요청에 실패했습니다.');return out;
}
async function changeOwnPassword(newPassword){
  if(!supabaseClient||!currentUser)throw new Error('로그인이 필요합니다.');
  if(String(newPassword||'').length<8)throw new Error('새 비밀번호는 8자 이상이어야 합니다.');
  const {error}=await supabaseClient.auth.updateUser({password:newPassword,data:{must_change_password:false}});if(error)throw error;const {data:{user}}=await supabaseClient.auth.getUser();currentUser=user||currentUser;return true;
}

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmtDate(s){if(!s)return '-';const d=new Date(s+'T00:00:00');return `${d.getMonth()+1}/${d.getDate()}`;}
function daysDiff(a,b){return Math.floor((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);}
function today(){return state.project.asOf || new Date().toISOString().slice(0,10);}
function statusTone(s){if(['완료 승인','달성','종결','답변 완료'].includes(s))return 'good';if(['지연','위험','미달','기한 초과','PM 결정 필요','PM 조정 필요'].includes(s))return 'bad';if(['진행 중','주의','완료 요청','PM 검토 대기','협업기관 회신 대기','처리 중'].includes(s))return 'warn';return 'blue';}
function statusTag(s){return `<span class="tag ${statusTone(s)}"><span class="status-dot ${statusTone(s)}"></span>${esc(s)}</span>`;}
function institutionTags(arr){return (arr||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('') || '<span class="muted">-</span>';}
function ownerDisplay(x){return x || '<책임기관 미확정>';}
function pct(v){return (v===null||v===''||Number.isNaN(Number(v))) ? null : Math.max(0,Math.min(100,Number(v)));}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);}

function renderNav(){
  const nav=document.getElementById('nav');
  const mobile=document.getElementById('mobileNav');
  if(!isAdmin){nav.innerHTML='';if(mobile)mobile.innerHTML='';return;}
  const html=NAV.map(([id,icon,label])=>`<button class="nav-item ${id===currentView?'active':''}" data-view="${id}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></button>`).join('');
  nav.innerHTML=html;
  if(mobile) mobile.innerHTML=html;
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;viewFilter={};render();window.scrollTo({top:0,behavior:'smooth'});});
}
function setShellMode(){
  document.body.classList.toggle('institution-mode',!isAdmin);
  document.body.classList.toggle('admin-mode',isAdmin);
  document.body.classList.toggle('auth-locked',!currentProfile);
  const footer=document.querySelector('.sidebar-footer strong');if(footer)footer.textContent=currentProfile?`${currentProfile.display_name} · ${currentProfile.institution}`:'로그인 필요';
  const adminBtn=document.getElementById('adminAccessBtn');
  if(adminBtn){adminBtn.hidden=currentProfile?.role!=='admin';adminBtn.textContent=isAdmin?'기관 화면':'관리자';}
  const accountBtn=document.getElementById('accountBtn');if(accountBtn)accountBtn.hidden=!currentProfile;
  const logoutBtn=document.getElementById('logoutBtn');if(logoutBtn)logoutBtn.hidden=!currentProfile;
  const badge=document.getElementById('userBadge');if(badge){badge.hidden=!currentProfile;badge.textContent=currentProfile?`${currentProfile.display_name} · ${currentProfile.institution}`:'';}
}
function render(){
  setShellMode();renderNav();if(currentProfile&&!verificationLoaded&&!verificationLoading)setTimeout(()=>loadVerificationSites(true),0);
  const quick=document.getElementById('quickAddBtn'),pmBtn=document.getElementById('pmUpdateBtn'),content=document.getElementById('content'),eyebrow=document.querySelector('.topbar .eyebrow');
  if(!currentProfile){
    if(quick)quick.style.display='none';if(pmBtn)pmBtn.style.display='none';document.getElementById('asOf').textContent='';document.getElementById('pageTitle').textContent='AX Sprint 사업관리';
    if(eyebrow)eyebrow.textContent='2026 복지분야 AI 응용제품 신속 상용화 지원사업';content.innerHTML='<div class="auth-wait-panel">기관 계정으로 로그인해 주십시오.</div>';return;
  }
  document.getElementById('asOf').textContent=`기준일 ${state.project.asOf}`;
  if(!isAdmin){
    if(quick)quick.style.display='none';if(pmBtn)pmBtn.style.display='none';eyebrow.textContent='2026 복지분야 AI 응용제품 신속 상용화 지원사업';document.getElementById('pageTitle').textContent=`${portalInstitution} 진행현황`;content.innerHTML=institutionPortalHTML(portalInstitution);bindInstitutionPortalEvents();return;
  }
  eyebrow.textContent='2026 복지분야 AI 응용제품 신속 상용화 지원사업 · 관리자';
  const titles={workboard:'기관 진행현황',dashboard:'통합 대시보드',verification:'실증 관리',kpis:'성과목표',institutions:'기관 관리',actions:'진행항목 관리',requests:'요청·회신 관리',memos:'협의사항',timeline:'전체 일정',records:'회의·문서',users:'사용자 관리',settings:'관리설정'};
  if(currentView==='portal')currentView='dashboard';document.getElementById('pageTitle').textContent=titles[currentView]||'통합 대시보드';
  quick.style.display=currentView==='workboard'?'none':'';pmBtn.style.display=currentView==='workboard'?'none':'';
  if(currentView==='workboard')content.innerHTML=workboardHTML();
  if(currentView==='dashboard')content.innerHTML=dashboardHTML();
  if(currentView==='verification')content.innerHTML=verificationAdminHTML();
  if(currentView==='kpis')content.innerHTML=kpisHTML();
  if(currentView==='institutions')content.innerHTML=institutionsHTML();
  if(currentView==='actions')content.innerHTML=actionsHTML();
  if(currentView==='requests')content.innerHTML=requestsHTML();
  if(currentView==='memos')content.innerHTML=memosHTML();
  if(currentView==='timeline')content.innerHTML=timelineHTML();
  if(currentView==='records')content.innerHTML=recordsHTML();
  if(currentView==='users')content.innerHTML=usersHTML();
  if(currentView==='settings')content.innerHTML=settingsHTML();
  bindViewEvents();
}

function actionMetrics(){
  const all=state.actions.filter(a=>a.active!==false), done=all.filter(x=>x.status==='완료 승인').length;
  const overdue=all.filter(x=>x.status!=='완료 승인' && x.end && x.end<today()).length;
  const pm=all.filter(x=>['PM 결정 필요','PM 검토 대기','완료 요청'].includes(x.status)||x.pmCheck).length;
  const waiting=all.filter(x=>x.status==='협업기관 회신 대기').length;
  return {all:all.length,done,overdue,pm,waiting,rate:all.length?Math.round(done/all.length*100):0};
}
function kpiMetrics(){
  const vals=state.kpis.map(k=>pct(k.progress)).filter(v=>v!==null);
  return {entered:vals.length, total:state.kpis.length, avg:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null,
    risk:state.kpis.filter(k=>['주의','위험','미달'].includes(k.status)).length};
}
function categoryStats(){
  const map={}; state.kpis.forEach(k=>{map[k.category]??=[];map[k.category].push(k);});
  return Object.entries(map).map(([name,items])=>{const vals=items.map(x=>pct(x.progress)).filter(v=>v!==null);return {name,items:items.length,avg:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null,entered:vals.length};});
}
function institutionStats(name){
  const responsibility=state.actions.filter(a=>a.owner===name).length;
  const collab=state.actions.filter(a=>(a.collaborators||[]).includes(name)).length;
  const late=state.actions.filter(a=>a.owner===name && a.status!=='완료 승인' && a.end && a.end<today()).length;
  const req=state.requests.filter(r=>requestIncludesRecipient(r,name) && !['종결'].includes(requestLiveStatus(r)) && !(requestResponse(r,name).text||'').trim()).length;
  return {responsibility,collab,late,req};
}
function urgentActions(){
  return state.actions.filter(a=>a.status!=='완료 승인' && a.end).map(a=>({...a,diff:daysDiff(today(),a.end)})).filter(a=>a.diff<=14).sort((a,b)=>a.diff-b.diff).slice(0,9);
}

function actionTouchesInstitution(a,name){
  return a.owner===name || (a.collaborators||[]).includes(name) || (a.planInstitutions||[]).includes(name);
}
function actionRoleForInstitution(a,name){
  if(a.owner===name) return '책임';
  if((a.collaborators||[]).includes(name)) return '협업';
  if(!a.owner && (a.planInstitutions||[]).includes(name)) return '공동참여';
  if((a.planInstitutions||[]).includes(name)) return '참여';
  return '';
}
function workboardData(name){
  const relevant=state.actions.filter(a=>actionTouchesInstitution(a,name));
  const open=relevant.filter(a=>a.status!=='완료 승인');
  const enriched=open.map(a=>({...a,diff:a.end?daysDiff(today(),a.end):999,startDiff:a.start?daysDiff(today(),a.start):999,role:actionRoleForInstitution(a,name)}));
  const overdue=enriched.filter(a=>a.end && a.diff<0).sort((a,b)=>a.diff-b.diff);
  const dueSoon=enriched.filter(a=>a.end && a.diff>=0 && a.diff<=7).sort((a,b)=>a.diff-b.diff);
  const active=enriched.filter(a=>a.start && a.end && a.start<=today() && a.end>=today() && a.diff>7).sort((a,b)=>a.end.localeCompare(b.end));
  const upcoming=enriched.filter(a=>a.start && a.start>today()).sort((a,b)=>a.start.localeCompare(b.start));
  const requests=state.requests.filter(r=>requestIncludesRecipient(r,name) && requestLiveStatus(r)!=='종결' && !(requestResponse(r,name).text||'').trim()).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const done=relevant.filter(a=>a.status==='완료 승인').sort((a,b)=>(b.end||'').localeCompare(a.end||''));
  return {relevant,open,overdue,dueSoon,active,upcoming,requests,done};
}
function ddayLabel(a){
  if(!a.end) return '<span class="work-dday neutral">기한 미정</span>';
  const d=daysDiff(today(),a.end);
  if(d<0) return `<span class="work-dday bad">D+${Math.abs(d)}</span>`;
  if(d===0) return '<span class="work-dday warn">TODAY</span>';
  if(d<=7) return `<span class="work-dday warn">D-${d}</span>`;
  return `<span class="work-dday">D-${d}</span>`;
}
function workActionCard(a,name){
  const role=actionRoleForInstitution(a,name);
  const criterion=(a.completionCriteria||'').trim();
  const blocker=(a.blocker||'').trim();
  return `<div class="work-card ${a.end&&a.end<today()?'is-overdue':''}" data-action="${a.id}">
    <div class="work-card-top"><div><span class="tag ${role==='책임'?'blue':role==='공동참여'?'warn':''}">${esc(role||'관련항목')}</span>${statusTag(a.status)}</div>${ddayLabel(a)}</div>
    <h3>${esc(a.name)}</h3>
    <div class="work-deadline"><strong>${a.end?fmtDate(a.end):'미정'}</strong>까지${a.start?` · ${fmtDate(a.start)} 시작`:''}</div>
    ${criterion?`<div class="work-criterion"><span>완료기준</span>${esc(criterion)}</div>`:`<div class="work-criterion muted"><span>완료기준</span>아직 입력되지 않음</div>`}
    ${blocker?`<div class="work-blocker">막힘 · ${esc(blocker)}</div>`:''}
  </div>`;
}
function workList(items,name,emptyText){
  if(!items.length) return `<div class="empty compact">${emptyText}</div>`;
  return `<div class="work-card-grid">${items.map(a=>workActionCard(a,name)).join('')}</div>`;
}
function requestMiniList(items,institution=''){
  if(!items.length) return '<div class="empty compact">현재 회신할 요청사항이 없습니다.</div>';
  return `<div class="request-feedback-list">${items.map(r=>{const resp=requestResponse(r,institution||requestRecipients(r)[0]||'');const replied=(resp.text||'').trim();return `<div class="request-feedback-card" data-request="${r.id}">
    <div class="request-feedback-head"><div><span class="request-label">${esc(r.from||'요청기관')} 요청</span><strong>${esc(r.title)}</strong></div><div class="request-feedback-meta"><span>${r.due?'회신 '+fmtDate(r.due)+'까지':'회신기한 미정'}</span>${statusTag(requestLiveStatus(r))}</div></div>
    <div class="request-body"><span>요청사항</span><p>${esc(r.content||'요청내용 미입력')}</p></div>
    <div class="feedback-body ${replied?'answered':''}"><span>기관 회신</span><p>${replied?esc(resp.text):'회신이 등록되지 않았습니다.'}</p>${resp.date?`<small>${fmtDate(resp.date)} 회신</small>`:''}</div>
    <div class="request-feedback-foot"><span>${r.relatedAction?`관련과제 ${esc(r.relatedAction)}`:'관련과제 미연결'}</span><button class="mini-btn" type="button">${replied?'회신 확인·수정':'회신 작성'}</button></div>
  </div>`}).join('')}</div>`;
}
function institutionMemoThreads(name){
  return (state.memos||[]).filter(m=>m.institution===name).sort((a,b)=>memoLastDate(b).localeCompare(memoLastDate(a)));
}
function memoLastDate(m){const msgs=m.messages||[];return msgs.length?(msgs[msgs.length-1].date||''):'';}
function memoPreviewList(items,name){
  if(!items.length) return '<div class="empty compact">등록된 소통 메모가 없습니다.</div>';
  return `<div class="memo-preview-list">${items.slice(0,8).map(m=>{const msgs=m.messages||[], last=msgs[msgs.length-1]||{};return `<div class="memo-preview" data-memo="${m.id}"><div class="memo-preview-top"><strong>${esc(m.title)}</strong><span>${esc(m.status||'진행')}</span></div><p>${esc(last.text||'메모 내용 없음')}</p><div class="memo-preview-foot"><span>${last.authorInstitution?esc(last.authorInstitution):'-'} · ${last.date?fmtDate(last.date):'-'}</span><span>${msgs.length}건</span></div></div>`}).join('')}</div>`;
}
function portalActionData(name){
  const allRelevant=state.actions.filter(a=>a.active!==false).filter(a=>a.owner===name || (a.collaborators||[]).includes(name) || (!a.owner && (a.planInstitutions||[]).includes(name)));
  const relevant=allRelevant.filter(a=>a.status!=='완료 승인');
  const items=relevant.map(a=>({...a,diff:a.end?daysDiff(today(),a.end):999,startDiff:a.start?daysDiff(today(),a.start):999,portalRole:a.owner===name?'책임항목':'관련항목'}));
  const priority=items.filter(a=>(a.end&&a.diff<0) || (a.end&&a.diff>=0&&a.diff<=7) || (a.start&&a.start<=today()&&(!a.end||a.end>=today())))
    .sort((a,b)=>{const ad=a.diff??999,bd=b.diff??999;if(ad!==bd)return ad-bd;return (a.owner===name?-1:1)-(b.owner===name?-1:1);});
  const current=items.filter(a=>!a.start || a.start<=today()).sort((a,b)=>(a.diff??999)-(b.diff??999));
  const upcoming=items.filter(a=>a.start && a.start>today()).sort((a,b)=>a.start.localeCompare(b.start));
  const receivedAll=state.requests.filter(r=>requestIncludesRecipient(r,name)).sort((a,b)=>(b.requestedAt||'').localeCompare(a.requestedAt||''));
  const requests=receivedAll.filter(r=>requestLiveStatus(r)!=='종결').sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const sentRequests=state.requests.filter(r=>r.from===name).sort((a,b)=>(b.requestedAt||'').localeCompare(a.requestedAt||''));
  const memos=(state.memos||[]).filter(m=>m.institution===name).sort((a,b)=>memoLastDate(b).localeCompare(memoLastDate(a)));
  const done=allRelevant.filter(a=>a.status==='완료 승인').sort((a,b)=>(b.end||'').localeCompare(a.end||''));
  return {items,priority,current,upcoming,requests,receivedAll,sentRequests,memos,done,overdue:items.filter(a=>a.end&&a.diff<0),dueSoon:items.filter(a=>a.end&&a.diff>=0&&a.diff<=7)};
}
function portalStatusMessage(w){
  const pending=w.requests.filter(r=>requestNeedsReply(r,portalInstitution)).length;
  if(w.overdue.length) return `기한이 지난 항목 ${w.overdue.length}건이 있습니다.`;
  if(w.dueSoon.length) return `7일 이내 마감 항목 ${w.dueSoon.length}건이 있습니다.`;
  if(pending) return `회신이 필요한 요청사항 ${pending}건이 있습니다.`;
  return '현재 별도 확인이 필요한 긴급사항은 없습니다.';
}
function portalStageLabels(a){
  if(Array.isArray(a.stages)&&a.stages.filter(Boolean).length) return a.stages.filter(Boolean);
  const n=(a.name||'');
  if(/설문/.test(n)) return ['초안 작성','기관 검토','최종 수정','확정'];
  if(/IRB/.test(n)) return ['서류 준비','신청','접수 확인'];
  if(/KOLAS|성능 평가/.test(n)) return ['시험항목 확정','시험 의뢰','성능 시험','결과서 확보'];
  if(/키오스크 디자인|규격 논의/.test(n)) return ['요구사항','디자인','규격 검토','확정'];
  if(/하드웨어 설계/.test(n)) return ['구성 확정','설계','검토','설계 확정'];
  if(/완성품 제작/.test(n)) return ['부품 준비','제작','연동 점검','설치 준비'];
  if(/키오스크.*설치|상담센터.*개시|케어콜.*개시/.test(n)) return ['기관 협의','설치·연동 준비','현장 적용','운영 개시'];
  if(/실증 운영|실증기관|대상자 모집|온보딩/.test(n)) return ['기관 준비','대상자·환경 확보','실증 운영','실적 점검'];
  if(/데이터.*표준|표준화|수집 기준/.test(n)) return ['기준 정리','형식 통합','품질 점검','확정'];
  if(/데이터 수집|학습데이터셋/.test(n)) return ['수집체계','데이터 수집','정제·비식별','실적 점검'];
  if(/만족도 조사/.test(n)) return ['설문 확정','조사 실시','응답 회수','결과 집계'];
  if(/타당도|신뢰도|성과 분석|결과 취합/.test(n)) return ['데이터 확보','분석','검토','결과 정리'];
  if(/회의|자문/.test(n)) return ['안건 준비','회의 진행','의견 정리','후속 반영'];
  if(/보고서|보고회|결과 보고/.test(n)) return ['자료 취합','작성','검토','제출·공유'];
  if(/개발|고도화|내부 테스트/.test(n)) return ['요구사항','개발·적용','내부 테스트','반영 완료'];
  return ['준비','진행','검토','완료'];
}
function portalStageIndex(a,steps){
  if(a.status==='완료 승인') return steps.length;
  if(a.status==='예정') return 0;
  if(!a.start||!a.end) return Math.min(1,steps.length-1);
  const start=new Date(a.start+'T00:00:00'), end=new Date(a.end+'T00:00:00'), now=new Date(today()+'T00:00:00');
  if(now<=start) return 0;
  if(now>=end) return Math.max(1,steps.length-1);
  const ratio=(now-start)/Math.max(1,end-start);
  return Math.max(1,Math.min(steps.length-1,Math.floor(ratio*steps.length)));
}
function portalStageFlow(a){
  const steps=portalStageLabels(a), idx=portalStageIndex(a,steps);
  return `<div class="portal-stage-flow" aria-label="진행 단계">${steps.map((label,i)=>{
    const done=i<idx, current=i===idx && idx<steps.length;
    return `<div class="portal-stage ${done?'done':''} ${current?'current':''}"><span class="stage-dot">${done?'●':'○'}</span><span class="stage-label">${esc(label)}</span></div>${i<steps.length-1?'<span class="stage-line">──</span>':''}`;
  }).join('')}</div>`;
}
function portalActionCard(a){
  const criterion=(a.completionCriteria||'').trim();const editable=canManageAction(a);
  return `<article class="portal-task ${a.end&&a.end<today()?'late':''}" data-portal-action="${a.id}">
    <div class="portal-task-primary"><div class="portal-task-dday">${ddayLabel(a)}</div><div class="portal-task-main"><div class="portal-task-titleline">${actionCode(a)?`<span class="action-code-tag">${esc(actionCode(a))}</span>`:''}<h3>${esc(a.name)}</h3></div>${portalStageFlow(a)}</div><button type="button" class="task-detail-btn" data-open-action="${esc(a.id)}">${editable?'상세·수정':'상세'}</button></div>
    <div class="portal-deadline"><span>기한</span><strong>${a.end?`${fmtDate(a.end)}까지`:'기한 미정'}</strong></div>
    <div class="portal-criterion"><span>완료기준</span><p>${esc(criterion||'완료기준 확인 필요')}</p></div>
    ${a.blocker?`<div class="portal-blocker"><strong>확인사항</strong>${esc(a.blocker)}</div>`:''}
  </article>`;
}

function portalTaskList(items,empty){
  return items.length?`<div class="portal-task-list">${items.map(portalActionCard).join('')}</div>`:`<div class="portal-empty">${empty}</div>`;
}
function portalRequestList(items,institution=portalInstitution){
  if(!items.length)return '<div class="portal-empty">현재 받은 요청이 없습니다.</div>';
  return `<div class="portal-request-list">${items.map(r=>{const resp=requestResponse(r,institution);const myReply=requestIncludesRecipient(r,profileInstitution());return `<article class="portal-request">
    <div class="portal-request-top"><div><span>${esc(r.from||'요청기관')} 요청</span><h3>${esc(r.title)}</h3></div><strong>${r.due?`${fmtDate(r.due)}까지`:'기한 미정'}</strong></div>
    ${r.relatedAction?`<div class="request-related">${relatedActionHTML(r.relatedAction,true)}</div>`:''}
    <p class="portal-request-content">${esc(r.content||'요청내용 미입력')}</p>
    <div class="portal-response ${resp.text?'answered':''}"><span>${esc(institution)} 회신</span><p>${resp.text?esc(resp.text):'회신 대기'}</p>${resp.date?`<small>${fmtDate(resp.date)} 회신</small>`:''}</div>
    <div class="request-card-actions"><button type="button" class="btn secondary portal-reply-btn" data-public-request="${r.id}">${myReply?(requestResponse(r,profileInstitution()).text?'내 회신 확인·수정':'회신 작성'):'상세 보기'}</button></div>
  </article>`}).join('')}</div>`;
}

function portalSentRequestList(items){
  if(!items.length)return '<div class="portal-empty">보낸 요청이 없습니다.</div>';
  return `<div class="portal-request-list sent">${items.map(r=>{const recipients=requestRecipients(r);const own=r.from===profileInstitution();const unlocked=own&&!requestLocked(r);return `<article class="portal-request sent-request">
    <div class="portal-request-top"><div><span>${esc(requestRecipientLabel(r))}</span><h3>${esc(r.title)}</h3></div><strong>${r.due?`회신 ${fmtDate(r.due)}까지`:'회신기한 미정'}</strong></div>
    ${r.relatedAction?`<div class="request-related">${relatedActionHTML(r.relatedAction,true)}</div>`:''}<p class="portal-request-content">${esc(r.content||'요청내용 미입력')}</p>
    <div class="multi-response-summary">${recipients.map(name=>{const resp=requestResponse(r,name);return `<div class="multi-response-line ${resp.text?'answered':''}"><strong>${esc(name)}</strong><span>${resp.text?esc(resp.text):'회신 대기'}</span>${resp.date?`<small>${fmtDate(resp.date)}</small>`:''}</div>`}).join('')}</div>
    <div class="sent-request-foot">${statusTag(requestLiveStatus(r))}<span>${requestReplyCount(r)}/${recipients.length}개 기관 회신</span><div class="request-inline-actions"><button type="button" class="text-btn" data-public-request="${esc(r.id)}">상세</button>${unlocked?`<button type="button" class="text-btn" data-edit-own-request="${esc(r.id)}">수정</button><button type="button" class="text-btn danger-text" data-delete-own-request="${esc(r.id)}">삭제</button>`:''}${own&&requestLocked(r)?'<span class="lock-note">회신 등록 후 잠금</span>':''}</div></div>
  </article>`}).join('')}</div>`;
}

function portalCommunicationDetail(w,mode='all'){
  const sections=[];
  if(mode==='all'||mode==='received') sections.push(`<div class="communication-subsection"><div class="communication-subhead"><div><h3>받은 요청</h3><p>회신이 필요한 요청사항입니다.</p></div><strong>${(w.receivedAll||w.requests).length}건</strong></div>${portalRequestList(w.receivedAll||w.requests)}</div>`);
  if(mode==='all'||mode==='sent') sections.push(`<div class="communication-subsection"><div class="communication-subhead"><div><h3>보낸 요청</h3><p>기관에서 전달한 요청과 회신 결과입니다.</p></div><strong>${w.sentRequests.length}건</strong></div>${portalSentRequestList(w.sentRequests)}</div>`);
  return `<div class="portal-communication-detail">${sections.join('')}</div>`;
}
function portalRequestSection(w,name){
  const canCreate=profileInstitution()===name;
  return `<section class="portal-section portal-request-main-section"><div class="portal-section-head portal-request-main-head"><div><h2>요청·회신</h2><p>기관 간 요청과 회신 현황을 확인합니다.</p></div><div class="portal-request-head-actions"><label class="portal-request-view"><span>보기</span><select id="portalRequestView"><option value="all" ${portalRequestView==='all'?'selected':''}>전체 요청</option><option value="received" ${portalRequestView==='received'?'selected':''}>받은 요청</option><option value="sent" ${portalRequestView==='sent'?'selected':''}>보낸 요청</option></select></label>${canCreate?'<button type="button" class="btn primary" id="publicNewRequest">요청 보내기</button>':''}</div></div>${portalCommunicationDetail(w,portalRequestView)}</section>`;
}

function portalCommunicationPanel(w,name){
  const latestReceived=w.requests.slice(0,1), latestSent=w.sentRequests.slice(0,1), latestMemo=w.memos.slice(0,1);
  const rows=[
    ['v24.4','2026-09-01','이용 안내를 관리자용·기관 사용자용 상세 매뉴얼로 분리하고 설치·계정·권한·진행항목·요청회신·실증·비밀번호·백업 절차를 단계별로 확장.'],
    ...latestReceived.map(r=>({type:'받은 요청',title:r.title,meta:`${r.from||'요청기관'} · ${r.due?fmtDate(r.due)+'까지':'기한 미정'}`,action:'requests'})),
    ...latestSent.map(r=>({type:'보낸 요청',title:r.title,meta:`${requestRecipientLabel(r)} · ${requestReplyCount(r)}/${requestRecipients(r).length} 회신`,action:'requests'})),
    ...latestMemo.map(m=>({type:'협의',title:m.title,meta:`대화 ${(m.messages||[]).length}건`,action:'memos'}))
  ].slice(0,3);
  return `<section class="portal-communication-hub"><div class="portal-communication-top"><div><span class="portal-kicker">협업 소통</span><h2>요청·회신 및 협의사항</h2><p>필요한 요청을 전달하고 회신과 협의 내용을 한 곳에서 확인합니다.</p></div><div class="portal-communication-actions"><button type="button" class="btn primary" id="publicNewRequest">요청 보내기</button><button type="button" class="btn secondary" id="publicAddMemoTop">협의사항 작성</button></div></div><div class="communication-counts"><button type="button" data-portal-jump="requests"><span>받은 요청</span><strong>${w.requests.length}</strong></button><button type="button" data-portal-jump="requests"><span>보낸 요청</span><strong>${w.sentRequests.length}</strong></button><button type="button" data-portal-jump="memos"><span>협의사항</span><strong>${w.memos.length}</strong></button></div>${rows.length?`<div class="communication-recent">${rows.map(row=>`<button type="button" data-portal-jump="${row.action}"><span class="communication-type">${esc(row.type)}</span><strong>${esc(row.title)}</strong><em>${esc(row.meta)}</em></button>`).join('')}</div>`:'<div class="portal-empty communication-empty">등록된 소통 내역이 없습니다. 요청 또는 협의사항을 직접 등록할 수 있습니다.</div>'}</section>`;
}
function portalMemoList(items){
  if(!items.length)return '<div class="portal-empty">등록된 협의사항이 없습니다.</div>';
  return `<div class="portal-memo-list">${items.slice(0,20).map(m=>{const msgs=m.messages||[],last=msgs[msgs.length-1]||{};return `<article class="portal-memo"><button type="button" class="portal-memo-main" data-public-memo="${m.id}"><div><div class="memo-title-line"><strong>${esc(m.title)}</strong>${memoLocked(m)?'<span class="mini-lock">답변 있음</span>':''}</div><p>${esc(last.text||'내용 없음')}</p></div><span>${last.date?fmtDate(last.date):'-'} · 대화 ${msgs.length}건</span></button>${m.relatedAction?`<div class="memo-related-inline">${relatedActionHTML(m.relatedAction,true)}</div>`:''}</article>`}).join('')}</div>`;
}

function portalDoneList(items){
  if(!items.length)return '<div class="portal-empty">완료 승인된 항목이 없습니다.</div>';
  return `<div class="portal-done-list">${items.slice(0,20).map(a=>`<div class="portal-done-row"><div><strong>${esc(a.name)}</strong><span>${a.end?fmtDate(a.end):'-'}</span></div><em>완료</em></div>`).join('')}</div>`;
}
function portalInstitutionTabsHTML(selected){
  return `<div class="portal-inst-selector"><div class="portal-inst-label">기관 선택</div><div class="portal-inst-tabs" role="tablist">${PORTAL_ORDER.map(name=>{const inst=state.institutions.find(i=>i.name===name);const role=inst?.role || (name==='정션메드'?'주관기관':'참여기관');return `<button type="button" class="portal-inst-tab ${name===selected?'active':''}" data-portal-inst="${esc(name)}" role="tab" aria-selected="${name===selected?'true':'false'}"><strong>${esc(name)}</strong><span>${esc(role)}</span></button>`}).join('')}</div></div>`;
}
function portalListCategory(a,w){
  if(a.status==='완료 승인') return 'done';
  if(w.overdue.some(x=>x.id===a.id)) return 'overdue';
  if(w.dueSoon.some(x=>x.id===a.id)) return 'dueSoon';
  if(w.upcoming.some(x=>x.id===a.id)) return 'upcoming';
  return 'active';
}
function portalListCategoryLabel(category){
  return {overdue:'기한 경과',dueSoon:'마감 임박',active:'진행',upcoming:'예정',done:'완료'}[category]||'진행';
}
function portalAllItemsForList(w){
  return [...w.items,...w.done].sort((a,b)=>{
    const ac=portalListCategory(a,w),bc=portalListCategory(b,w);
    const order={overdue:0,dueSoon:1,active:2,upcoming:3,done:4};
    if(order[ac]!==order[bc]) return order[ac]-order[bc];
    if(ac==='done') return (b.end||'').localeCompare(a.end||'');
    return (a.end||a.start||'9999-12-31').localeCompare(b.end||b.start||'9999-12-31');
  });
}
function portalListFilterControl(w){
  const all=portalAllItemsForList(w);
  const counts={all:all.length,overdue:w.overdue.length,dueSoon:w.dueSoon.length,active:all.filter(a=>portalListCategory(a,w)==='active').length,upcoming:w.upcoming.length,done:w.done.length};
  const options=[['all','전체'],['overdue','기한 경과'],['dueSoon','마감 임박'],['active','진행'],['upcoming','예정'],['done','완료']];
  return `<label class="portal-list-filter"><span>보기</span><select id="portalListFilter" aria-label="전체 항목 분류 선택">${options.map(([id,label])=>`<option value="${id}" ${portalListFilter===id?'selected':''}>${label} ${counts[id]}건</option>`).join('')}</select></label>`;
}
function portalCompactAllList(w){
  const all=portalAllItemsForList(w);
  const filtered=portalListFilter==='all'?all:all.filter(a=>portalListCategory(a,w)===portalListFilter);
  if(!filtered.length)return '<div class="portal-empty compact-list-empty">선택한 분류에 해당하는 항목이 없습니다.</div>';
  return `<div class="portal-compact-list">${filtered.map(a=>{
    const category=portalListCategory(a,w);
    const label=portalListCategoryLabel(category);
    return `<button type="button" class="portal-compact-item ${category}" data-portal-item="${a.id}" data-portal-category="${category}" title="${esc(a.name)}">
      <div class="compact-item-meta">
        <span class="compact-status-tag ${category}">${label}</span>
        ${actionCode(a)?`<span class="action-code-tag small">${esc(actionCode(a))}</span>`:''}
      </div>
      <strong>${esc(a.name)}</strong>
      <span class="compact-date">${a.end?fmtDate(a.end):a.start?`${fmtDate(a.start)} 시작`:'기한 미정'}</span>
    </button>`;
  }).join('')}</div>`;
}
function portalDetailTabsHTML(){
  const tabs=[['all','전체 항목'],['overdue','기한 경과'],['dueSoon','마감 임박'],['upcoming','예정 일정'],['memos','협의사항'],['done','완료']];
  return `<div class="portal-detail-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" class="portal-detail-tab ${portalDetailTab===id?'active':''}" data-portal-detail="${id}" role="tab" aria-selected="${portalDetailTab===id?'true':'false'}">${label}</button>`).join('')}</div>`;
}
function portalDetailContent(w){
  if(portalDetailTab==='overdue')return portalTaskList(w.overdue,'기한이 경과한 항목이 없습니다.');
  if(portalDetailTab==='dueSoon')return portalTaskList(w.dueSoon,'7일 이내 마감되는 항목이 없습니다.');
  if(portalDetailTab==='upcoming')return portalTaskList(w.upcoming,'예정된 항목이 없습니다.');
  if(portalDetailTab==='memos')return `${profileInstitution()===portalInstitution?'<div class="portal-detail-action"><button type="button" class="btn secondary" id="publicAddMemo">협의사항 작성</button></div>':''}${portalMemoList(w.memos)}`;
  if(portalDetailTab==='done')return portalTaskList(w.done,'완료 승인된 항목이 없습니다.');
  return portalTaskList(w.items,'등록된 항목이 없습니다.');
}

function portalDistributionHTML(w){
  const overdue=w.overdue.length;
  const dueSoon=w.dueSoon.length;
  const overdueIds=new Set(w.overdue.map(a=>a.id));
  const dueSoonIds=new Set(w.dueSoon.map(a=>a.id));
  const active=w.current.filter(a=>!overdueIds.has(a.id)&&!dueSoonIds.has(a.id)).length;
  const upcoming=w.upcoming.length;
  const done=w.done.length;
  const total=Math.max(1,overdue+dueSoon+active+upcoming+done);
  const parts=[
    ['done','완료',done],['active','진행',active],['soon','마감 임박',dueSoon],['late','기한 경과',overdue],['upcoming','예정',upcoming]
  ];
  return `<div class="portal-visual">
    <div class="portal-visual-head"><div><span>진행 현황</span><strong>전체 ${overdue+dueSoon+active+upcoming+done}건</strong></div><div class="portal-visual-rate">완료 <b>${done}</b>건</div></div>
    <div class="portal-status-bar" aria-label="진행 현황 시각화">${parts.map(([cls,label,count])=>count?`<span class="status-segment ${cls}" style="width:${(count/total*100).toFixed(2)}%" title="${label} ${count}건"></span>`:'').join('')}</div>
    <div class="portal-status-legend">${parts.map(([cls,label,count])=>`<span><i class="legend-dot ${cls}"></i>${label} <strong>${count}</strong></span>`).join('')}</div>
  </div>`;
}
function institutionPortalHTML(name){
  const w=portalActionData(name);
  const focus=w.priority.slice(0,3);
  const hidden=Math.max(0,w.priority.length-focus.length);
  return `<div class="institution-portal">
    ${portalInstitutionTabsHTML(name)}
    <section class="portal-hero">
      <div><span class="portal-kicker">기관 진행현황</span><h2>${esc(name)}</h2><p>현재 진행사항, 일정 및 협업 요청을 확인합니다.</p></div>
      <div class="portal-date"><span>기준일</span><strong>${fmtDate(today())}</strong></div>
    </section>
    <section class="portal-situation">
      <div class="situation-message">${esc(portalStatusMessage(w))}</div>
      <div class="situation-counts" aria-label="빠른 현황 보기">
        <button type="button" class="situation-count-btn ${w.overdue.length?'has-alert':''}" data-portal-jump="overdue"><span>기한 경과</span><strong>${w.overdue.length}</strong><em>건</em></button>
        <button type="button" class="situation-count-btn" data-portal-jump="dueSoon"><span>마감 임박</span><strong>${w.dueSoon.length}</strong><em>건</em></button>
        <button type="button" class="situation-count-btn" data-portal-jump="requests"><span>회신 필요</span><strong>${w.requests.filter(r=>requestNeedsReply(r,name)).length}</strong><em>건</em></button>
      </div>
    </section>

    <section class="portal-section portal-focus-section"><div class="portal-section-head"><div><h2>현재 주요 진행사항</h2><p>현재 진행 중이거나 기한이 가까운 항목을 표시합니다.</p></div><div class="portal-head-actions"><strong>${w.priority.length}건</strong>${profileInstitution()===name?'<button type="button" class="btn secondary compact-btn" id="publicAddAction">+ 진행항목</button>':''}</div></div>${portalTaskList(focus,'현재 표시할 주요 진행사항이 없습니다.')}${hidden?`<div class="portal-more-note">추가 ${hidden}건은 아래 전체 항목에서 확인할 수 있습니다.</div>`:''}</section>

    ${portalRequestSection(w,name)}
    <section class="portal-section portal-memo-main-section"><div class="portal-section-head"><div><h2>협의사항</h2><p>기관 간 협의와 확인 내용을 기록합니다.</p></div>${profileInstitution()===name?'<button type="button" class="btn secondary compact-btn" id="publicAddMemoTop">협의사항 작성</button>':''}</div>${portalMemoList(w.memos)}</section>

    <section class="portal-section portal-list-section"><div class="portal-section-head portal-list-head"><div><h2>전체 항목</h2><p>분류를 선택하면 해당 항목만 목록으로 표시합니다.</p></div>${portalListFilterControl(w)}</div>${portalCompactAllList(w)}</section>

    ${verificationPortalSectionHTML()}
  </div>`;
}
function workboardHTML(){
  const selected=viewFilter.workInstitution || PARTNER_ORDER[0];
  const inst=state.institutions.find(i=>i.name===selected)||state.institutions[0];
  const w=workboardData(inst.name);
  const now=[...w.overdue,...w.dueSoon,...w.active].filter((a,i,arr)=>arr.findIndex(x=>x.id===a.id)===i);
  const next30=w.upcoming.filter(a=>a.startDiff<=30).slice(0,12);
  const responsibilityOpen=w.open.filter(a=>a.owner===inst.name).length;
  const relatedUnowned=w.open.filter(a=>!a.owner && (a.planInstitutions||[]).includes(inst.name)).length;
  return `<div class="workboard-shell">
    <div class="institution-tabs" role="tablist" aria-label="기관 진행항목 선택">
      ${orderedInstitutions().map(i=>`<button type="button" class="institution-tab ${i.name===inst.name?'active':''}" data-work-inst="${esc(i.name)}" role="tab"><span>${esc(i.name)}</span><small>${esc(i.role)}</small></button>`).join('')}
    </div>
    <div class="workboard-hero"><div><div class="eyebrow">기관별 실행현황</div><h2>${esc(inst.name)}</h2><p>현재 주요 진행사항, 마감일, 완료기준, 요청사항 및 회신내용을 확인합니다.</p></div><div class="workboard-asof"><span>기준일</span><strong>${fmtDate(today())}</strong></div></div>
    <div class="work-summary-grid">${metric('지연',w.overdue.length+'건','기한이 지난 항목',w.overdue.length?'bad':'good')}${metric('7일 이내 마감',w.dueSoon.length+'건','마감 임박 항목')}${metric('현재 진행',responsibilityOpen+'건','책임기관으로 수행 중')}${metric('회신 필요',w.requests.length+'건','해당 기관 답변 필요')}${metric('역할 확인',relatedUnowned+'건','책임기관 미확정',relatedUnowned?'bad':'good')}</div>
    <div class="section-title"><div><h2>현재 주요 진행사항</h2><p>기한 경과, 7일 이내 마감, 진행 중 항목 순으로 표시</p></div><span class="tag blue">${now.length}건</span></div>${workList(now,inst.name,'현재 진행 중이거나 7일 이내 마감되는 항목이 없습니다.')}
    <div class="communication-grid"><div><div class="section-title"><div><h2>요청사항 및 기관 회신</h2></div><button class="btn ghost compact-btn" id="newRequestForInst">+ 요청 등록</button></div>${requestMiniList(w.requests,inst.name)}</div><div><div class="section-title"><div><h2>협의사항</h2></div><button class="btn ghost compact-btn" id="newMemoForInst">+ 메모 등록</button></div><div class="panel">${memoPreviewList(institutionMemoThreads(inst.name),inst.name)}</div></div></div>
    <div class="section-title"><div><h2>향후 30일 예정 일정</h2></div></div>${workList(next30,inst.name,'30일 이내 새로 시작할 일정이 없습니다.')}
  </div>`;
}

function adminPortalLinksHTML(){
  const files={'정션메드':'junctionmed.html','경복대학교':'kyungbok.html','돌봄과 미래':'carefuture.html','에임랩':'aimlab.html'};
  return `<div class="admin-portal-panel admin-portal-compact"><div class="admin-portal-title"><strong>기관 화면 바로가기</strong><span>각 기관에 보이는 화면을 확인합니다.</span></div><div class="admin-portal-links">${PORTAL_ORDER.map(name=>`<a class="admin-portal-link" href="${files[name]}" target="_blank"><strong>${esc(name)}</strong><span>열기 ↗</span></a>`).join('')}</div></div>`;
}
function dashboardHTML(){
  const am=actionMetrics(), km=kpiMetrics();
  return `
  ${adminPortalLinksHTML()}
  <div class="metric-grid">
    ${metric('성과 달성률',km.avg===null?'입력 필요':km.avg+'%',km.avg===null?`21개 지표 중 현재값 ${km.entered}개 입력`:`${km.entered}/${km.total}개 지표 반영`)}
    ${metric('실행과제 완료율',am.rate+'%',`${am.done}/${am.all}개 완료 승인`)}
    ${metric('지연 실행과제',am.overdue+'건','기한 경과·미완료','bad')}
    ${metric('협업 회신 대기',am.waiting+'건','기관 간 응답 필요')}
    ${metric('PM 확인 필요',am.pm+'건','결정·검토·완료승인')}
  </div>
  <div class="section-title"><div><h2>성과영역 현황</h2><p>성과값이 입력된 지표 기준. 미입력 지표는 별도 표시</p></div><button class="btn ghost" data-go="kpis">전체 성과목표 보기</button></div>
  <div class="grid-2 dashboard-balance-grid">
    <div class="panel dashboard-category-panel">${categoryStats().map(c=>`<div class="category-row"><div><strong>${esc(c.name)}</strong><div class="cell-sub">${c.items}개 지표 · 현재값 ${c.entered}개 입력</div></div><div class="progress-track"><div class="progress-fill ${c.avg===null?'neutral':''}" style="width:${c.avg||0}%"></div></div><div class="progress-number">${c.avg===null?'미측정':c.avg+'%'}</div></div>`).join('')}</div>
    <div class="panel dashboard-alert-panel"><div class="panel-head"><h3>주요 확인사항</h3><span>기준일 ${fmtDate(today())}</span></div>${urgentListHTML(urgentActions())}</div>
  </div>
  <div class="section-title"><div><h2>기관별 현황</h2><p>책임항목·협업항목·지연·회신요청을 한 번에 확인</p></div></div>
  <div class="institution-grid">${orderedInstitutions().map(i=>institutionCard(i)).join('')}</div>
  <div class="section-title"><div><h2>실증 현황</h2><p>실증기관별 목표 인원 대비 4단계 진행상황</p></div><button class="btn ghost" data-go="verification">실증 관리</button></div>
  ${verificationCompactListHTML(true)}`;
}
function metric(label,value,foot,tone=''){return `<div class="metric-card"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-foot ${tone}">${foot}</div></div>`;}
function institutionCard(i){const s=institutionStats(i.name);return `<div class="institution-card" data-inst="${esc(i.name)}"><span class="role">${esc(i.role)}</span><h3>${esc(i.name)}</h3><div class="mini-stats"><div class="mini-stat"><strong>${s.responsibility}</strong><span>책임항목</span></div><div class="mini-stat"><strong>${s.late}</strong><span>지연</span></div><div class="mini-stat"><strong>${s.req}</strong><span>회신필요</span></div></div></div>`;}
function urgentListHTML(items){if(!items.length)return '<div class="empty">현재 14일 이내 마감 또는 지연 항목이 없습니다.</div>';const shown=items.slice(0,6),rest=Math.max(0,items.length-shown.length);return `<div class="alert-list">${shown.map(a=>`<div class="alert-row" data-action="${a.id}"><div class="alert-deadline">${a.diff<0?'<span class="tag bad">지연 '+Math.abs(a.diff)+'일</span>':a.diff===0?'<span class="tag warn">오늘 마감</span>':'<span class="tag warn">D-'+a.diff+'</span>'}</div><div class="name">${esc(a.name)}<div class="cell-sub">${esc(ownerDisplay(a.owner))}</div></div><div class="alert-status">${statusTag(a.status)}</div><div class="alert-date ${a.diff<0?'date-bad':'date-warn'}">${fmtDate(a.end)}</div></div>`).join('')}</div>${rest?`<button class="alert-more" data-go="actions">추가 ${rest}건 전체 실행항목에서 보기 →</button>`:''}`;}

function kpisHTML(){
  const cats=['전체',...new Set(state.kpis.map(x=>x.category))];
  return `<div class="toolbar"><input class="input search" id="kpiSearch" placeholder="성과지표 검색"><select class="select filter-select" id="kpiCategory">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select><select class="select filter-select" id="kpiStatus"><option>전체 상태</option>${KPI_STATUS_OPTIONS.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="kpi-grid" id="kpiGrid">${renderKpiCards(state.kpis)}</div>`;
}
function renderKpiCards(items){return items.map(k=>`<div class="kpi-card" data-kpi="${k.id}" data-cat="${esc(k.category)}" data-status="${esc(k.status)}" data-search="${esc((k.name+' '+k.target).toLowerCase())}"><span class="tag blue">${esc(k.category)}</span><h3>${esc(k.name)}</h3><div class="kpi-target">${esc(k.target)}</div><div class="kpi-bottom"><div><div class="kpi-progress">${pct(k.progress)===null?'—':pct(k.progress)+'%'}</div><div class="cell-sub">${statusTag(k.status)}</div></div><div class="kpi-owner">책임기관<br><strong>${esc(ownerDisplay(k.owner))}</strong></div></div></div>`).join('');}

function institutionsHTML(){
  const selected=viewFilter.institution || PARTNER_ORDER[0];
  const inst=state.institutions.find(i=>i.name===selected)||state.institutions[0];
  const s=institutionStats(inst.name);
  const responsible=state.actions.filter(a=>a.active!==false&&a.owner===inst.name);
  const collab=state.actions.filter(a=>a.active!==false&&(a.collaborators||[]).includes(inst.name));
  const relatedKpi=state.kpis.filter(k=>k.owner===inst.name||(k.collaborators||[]).includes(inst.name));
  return `<div class="institution-grid">${orderedInstitutions().map(i=>institutionCard(i)).join('')}</div>
  <div class="section-title"><div><h2>${esc(inst.name)} 상세</h2><p>${esc(inst.role)} · 책임항목 ${s.responsibility}건 · 협업항목 ${s.collab}건</p></div></div>
  <div class="metric-grid">${metric('책임 실행과제',s.responsibility+'건','완료 책임')}${metric('협업 실행과제',s.collab+'건','지원·검토')}${metric('지연',s.late+'건','책임항목 기준',s.late?'bad':'good')}${metric('회신 필요',s.req+'건','협업요청 수신')}${metric('관련 성과목표',relatedKpi.length+'개','책임 또는 협업')}</div>
  <div class="section-title"><div><h2>책임 실행과제</h2></div></div>${actionTableHTML(responsible)}
  <div class="section-title"><div><h2>협업 실행과제</h2></div></div>${actionTableHTML(collab)}`;
}

function actionSort(items){
  const map=new Map(items.map(a=>[a.id,a]));
  const parents=items.filter(a=>!a.parentId||!map.has(a.parentId)).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
  const out=[];
  const walk=(p,depth=0)=>{out.push({...p,_depth:depth});items.filter(a=>a.parentId===p.id).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)).forEach(c=>walk(c,depth+1));};
  parents.forEach(p=>walk(p));
  return out;
}
function actionsHTML(){
  const insts=['전체 기관','책임기관 미확정',...state.institutions.map(x=>x.name)];
  return `<div class="toolbar"><input class="input search" id="actionSearch" placeholder="실행항목 검색"><select class="select filter-select" id="actionInst">${insts.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select class="select filter-select" id="actionStatus"><option>전체 상태</option>${STATUS_OPTIONS.map(s=>`<option>${s}</option>`).join('')}</select><select class="select filter-select" id="actionActive"><option>사용 항목</option><option>전체 항목</option><option>비활성</option></select><button class="btn primary" id="addAction">+ 진행항목 추가</button></div><div class="admin-edit-hint"><strong>일정 운영</strong><span>사업계획서 일정은 기준일정으로 보존됩니다. 현재일정은 자유롭게 변경하고, 필요하면 세부항목을 추가하십시오.</span></div><div id="actionTableHolder">${actionTableHTML(state.actions.filter(a=>a.active!==false))}</div>`;
}
function actionTableHTML(items){if(!items.length)return '<div class="empty panel">조건에 맞는 진행항목이 없습니다.</div>';const rows=actionSort(items);return `<div class="table-wrap"><table class="data-table action-admin-table"><thead><tr><th>진행항목</th><th>책임기관</th><th>기준일정</th><th>현재일정</th><th>상태</th><th>변경</th></tr></thead><tbody>${rows.map(a=>{const changed=(a.baselineStart||'')!==(a.start||'')||(a.baselineEnd||'')!==(a.end||'');return `<tr data-action="${a.id}" class="${a.active===false?'inactive-row':''}"><td><div class="cell-title ${a._depth?'sub-action-title':''}" style="--depth:${a._depth||0}">${a._depth?'↳ ':''}${actionCode(a)?`<span class="action-code-tag">${esc(actionCode(a))}</span> `:''}${esc(a.name)} ${a._depth?'<span class="mini-label">세부</span>':''}</div><div class="cell-sub">${esc(a.relatedKpi||'성과목표 연결 필요')}</div></td><td>${esc(ownerDisplay(a.owner))}</td><td><span class="baseline-date">${fmtDate(a.baselineStart)} ~ ${fmtDate(a.baselineEnd)}</span></td><td>${fmtDate(a.start)} ~ ${fmtDate(a.end)}${a.end&&a.end<today()&&a.status!=='완료 승인'?'<div class="cell-sub date-bad">기한 경과</div>':''}</td><td>${statusTag(a.status)}${a.active===false?'<span class="tag">비활성</span>':''}</td><td>${changed?'<span class="tag warn">일정 변경</span>':'<span class="muted">기준 유지</span>'}${a.changeReason?`<div class="cell-sub">${esc(a.changeReason)}</div>`:''}</td></tr>`}).join('')}</tbody></table></div>`;}

function requestAdminItems(){
  const q=(viewFilter.requestSearch||'').trim().toLowerCase();
  const inst=viewFilter.requestInstitution||'전체 기관';
  const scope=viewFilter.requestScope||'전체 요청';
  return (state.requests||[]).filter(r=>{
    normalizeRequest(r);
    const recipients=requestRecipients(r);
    const responseText=recipients.map(name=>requestResponse(r,name).text||'').join(' ');
    const text=`${r.title||''} ${r.content||''} ${r.from||''} ${recipients.join(' ')} ${responseText}`.toLowerCase();
    const matchQ=!q||text.includes(q);
    const matchInst=inst==='전체 기관'||r.from===inst||requestIncludesRecipient(r,inst);
    const live=requestLiveStatus(r);
    let matchScope=true;
    if(scope==='회신 대기') matchScope=live!=='종결'&&!requestAllReplied(r);
    if(scope==='답변 완료') matchScope=requestAllReplied(r)&&live!=='종결';
    if(scope==='종결') matchScope=live==='종결';
    return matchQ&&matchInst&&matchScope;
  }).sort((a,b)=>(b.requestedAt||'').localeCompare(a.requestedAt||'') || (a.due||'9999').localeCompare(b.due||'9999'));
}
function requestAdminTableHTML(items){
  if(!items.length)return '<div class="empty panel">조건에 맞는 요청이 없습니다.</div>';
  return `<div class="table-wrap"><table class="data-table request-admin-table"><thead><tr><th>요청</th><th>관련 항목</th><th>요청기관</th><th>수신기관</th><th>회신기한</th><th>상태</th><th>회신</th></tr></thead><tbody>${items.map(r=>{const recipients=requestRecipients(r);const a=actionById(r.relatedAction);return `<tr data-request="${r.id}"><td><div class="cell-title">${esc(r.title)} ${requestLocked(r)?'<span class="mini-lock">잠금</span>':''}</div><div class="cell-sub">${esc(r.content||'').slice(0,70)}${(r.content||'').length>70?'…':''}</div></td><td>${a?`${actionCode(a)?`<span class="action-code-tag small">${esc(actionCode(a))}</span>`:''}<div class="cell-sub">${esc(a.name)}</div>`:'-'}</td><td>${esc(r.from||'-')}</td><td><strong>${esc(requestRecipientLabel(r)||'-')}</strong></td><td>${r.due?fmtDate(r.due):'-'}</td><td>${statusTag(requestLiveStatus(r))}</td><td><strong>${requestReplyCount(r)}/${recipients.length}</strong><div class="cell-sub">기관 회신</div></td></tr>`}).join('')}</tbody></table></div>`;
}

function requestsHTML(){
  const insts=['전체 기관',...PORTAL_ORDER],scopes=['전체 요청','회신 대기','답변 완료','종결'];
  return `<div class="toolbar request-admin-toolbar"><input class="input search" id="requestSearch" placeholder="요청 제목·내용 검색" value="${esc(viewFilter.requestSearch||'')}"><select class="select filter-select" id="requestInstitutionFilter">${insts.map(x=>`<option ${x===(viewFilter.requestInstitution||'전체 기관')?'selected':''}>${esc(x)}</option>`).join('')}</select><select class="select filter-select" id="requestScopeFilter">${scopes.map(x=>`<option ${x===(viewFilter.requestScope||'전체 요청')?'selected':''}>${esc(x)}</option>`).join('')}</select><button class="btn primary" id="addRequest">+ 요청 등록</button></div><div class="admin-edit-hint"><strong>요청·회신 관리</strong><span>회신 전에는 요청 원문 수정·삭제 가능 · 회신이 등록되면 원문 잠금 · 관리자 확인메모와 기관별 회신은 별도 관리</span></div><div id="requestTableHolder">${requestAdminTableHTML(requestAdminItems())}</div>`;
}

function filterRequestsAdmin(){
  viewFilter.requestSearch=document.getElementById('requestSearch')?.value||'';
  viewFilter.requestInstitution=document.getElementById('requestInstitutionFilter')?.value||'전체 기관';
  viewFilter.requestScope=document.getElementById('requestScopeFilter')?.value||'전체 요청';
  const holder=document.getElementById('requestTableHolder');if(holder)holder.innerHTML=requestAdminTableHTML(requestAdminItems());
  document.querySelectorAll('[data-request]').forEach(x=>x.onclick=()=>openRequest(x.dataset.request));
}

function memosHTML(){
  const insts=['전체 기관',...state.institutions.map(x=>x.name)];
  const selected=viewFilter.memoInstitution||'전체 기관';
  const items=(state.memos||[]).filter(m=>selected==='전체 기관'||m.institution===selected);
  return `<div class="toolbar"><select class="select filter-select" id="memoInstitutionFilter">${insts.map(x=>`<option ${x===selected?'selected':''}>${esc(x)}</option>`).join('')}</select><button class="btn primary" id="addMemo">+ 소통 메모 등록</button><span class="toolbar-note">확인사항, 협의내용, 답변을 한 흐름으로 기록합니다.</span></div>
  <div class="memo-board">${items.length?items.map(m=>memoThreadCard(m)).join(''):'<div class="empty panel">등록된 소통 메모가 없습니다.</div>'}</div>`;
}
function memoThreadCard(m){const msgs=m.messages||[],last=msgs[msgs.length-1]||{},a=actionById(m.relatedAction);return `<div class="memo-thread-card" data-memo="${m.id}"><div class="memo-thread-head"><div><span class="tag blue">${esc(memoCreator(m)||'기관 미지정')}</span><h3>${esc(m.title)} ${memoLocked(m)?'<span class="mini-lock">잠금</span>':''}</h3></div><span class="memo-status">${esc(m.status||'진행')}</span></div><div class="memo-last-message"><span>${esc(last.authorInstitution||'-')}</span><p>${esc(last.text||'메모 내용 없음')}</p></div><div class="memo-thread-foot"><span>${last.date?fmtDate(last.date):'-'} · 대화 ${msgs.length}건</span><span>${a?`${actionCode(a)?`[${esc(actionCode(a))}] `:''}${esc(a.name)}`:'관련 항목 미연결'}</span></div></div>`;}



function verificationStagePct(site,key){const target=Math.max(1,Number(site.target_count)||1);return Math.min(100,Math.max(0,Number(site[key])||0)/target*100);}
function verificationTotalPct(site){return Math.round((['pre_survey_count','training_count','usage_count','post_survey_count'].reduce((sum,k)=>sum+verificationStagePct(site,k),0)/4)*10)/10;}
function verificationStatus(site){return verificationTotalPct(site)>=100?'완료':(site.pre_survey_count||site.training_count||site.usage_count||site.post_survey_count)?'진행':'대기';}
function verificationBarHTML(site,compact=false){const stages=[['pre_survey_count','사전설문','pre'],['training_count','교육','training'],['usage_count','사용','use'],['post_survey_count','사후설문','post']];return `<div class="vf-bar ${compact?'compact':''}">${stages.map(([key,label,cls])=>`<div class="vf-segment ${cls}" title="${label} ${Number(site[key])||0}/${site.target_count}명"><span style="width:${verificationStagePct(site,key)}%"></span></div>`).join('')}</div>`;}
function verificationCompactListHTML(admin=false){
  if(!verificationLoaded){setTimeout(()=>loadVerificationSites(true),0);return '<div class="vf-empty">실증 현황을 불러오는 중입니다.</div>';}
  const items=verificationSites.filter(x=>x.active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.name).localeCompare(String(b.name)));
  if(!items.length)return '<div class="vf-empty">등록된 실증기관이 없습니다.</div>';
  return `<div class="vf-compact-list">${items.map(s=>`<button type="button" class="vf-compact-row" data-verification-site="${s.id}"><div class="vf-name"><strong>${esc(s.name)}</strong><span>${esc(s.responsible_institution)} · 목표 ${s.target_count}명</span></div><div class="vf-mini-viz">${verificationBarHTML(s,true)}<div class="vf-stage-numbers"><span>사전 ${s.pre_survey_count||0}</span><span>교육 ${s.training_count||0}</span><span>사용 ${s.usage_count||0}</span><span>사후 ${s.post_survey_count||0}</span></div></div><div class="vf-rate"><strong>${verificationTotalPct(s)}%</strong><span>${verificationStatus(s)}</span></div><div class="vf-stipend-status ${s.stipend_paid?'done':''}"><span>사례비</span><strong>${s.stipend_paid?'✓':'□'}</strong></div></button>`).join('')}</div>`;
}
function verificationPortalSectionHTML(){return `<section class="portal-section vf-portal-section"><div class="portal-section-head"><div><h2>실증 현황</h2><p>실증기관별 목표 인원 대비 사전설문·교육·사용·사후설문 진행상황입니다.</p></div></div>${verificationCompactListHTML(false)}</section>`;}
async function loadVerificationSites(silent=false){
  if(!supabaseClient||!currentProfile||verificationLoading)return;verificationLoading=true;
  try{
    const {data:sites,error:e1}=await supabaseClient.from('ax_verification_sites').select('*').order('sort_order').order('name');if(e1)throw e1;
    const {data:prog,error:e2}=await supabaseClient.from('ax_verification_progress').select('*');if(e2)throw e2;
    const pm=Object.fromEntries((prog||[]).map(x=>[x.site_id,x]));verificationSites=(sites||[]).map(x=>({...x,...(pm[x.id]||{})}));verificationLoaded=true;
    if(!silent)render();else{const content=document.getElementById('content');if(content)render();}
  }catch(e){console.error('verification load',e);if(!silent)toast('실증 현황을 불러오지 못했습니다.');}finally{verificationLoading=false;}
}
function verificationAdminHTML(){
  if(!verificationLoaded){setTimeout(()=>loadVerificationSites(false),0);return '<div class="panel loading-panel">실증 현황을 불러오는 중입니다.</div>';}
  const totalTarget=verificationSites.filter(x=>x.active!==false).reduce((s,x)=>s+(Number(x.target_count)||0),0);const avg=verificationSites.length?Math.round(verificationSites.reduce((s,x)=>s+verificationTotalPct(x),0)/verificationSites.length*10)/10:0;
  return `<div class="vf-admin-head"><div><h2>실증 관리</h2><p>실증기관 등록·책임기관·목표 인원·연계 진행항목은 관리자만 관리합니다. 단계별 완료 인원은 관리자 또는 해당 책임기관에서 수정할 수 있습니다.</p></div><button class="btn primary" id="addVerificationSite">+ 실증기관 추가</button></div><div class="vf-summary"><div><span>실증기관</span><strong>${verificationSites.filter(x=>x.active!==false).length}</strong></div><div><span>전체 목표</span><strong>${totalTarget}명</strong></div><div><span>평균 진척</span><strong>${avg}%</strong></div></div>${verificationCompactListHTML(true)}`;
}
function bindVerificationAdminEvents(){document.getElementById('addVerificationSite')?.addEventListener('click',()=>openVerificationSite());document.querySelectorAll('[data-verification-site]').forEach(b=>b.onclick=()=>openVerificationSite(b.dataset.verificationSite));}
function verificationLinkedActionChecks(selected=[]){return `<div class="vf-action-checks">${state.actions.filter(a=>a.active!==false).map(a=>`<label><input type="checkbox" name="vfLinkedAction" value="${esc(a.id)}" ${selected.includes(a.id)?'checked':''}><span>${actionCode(a)?`[${esc(actionCode(a))}] `:''}${esc(a.name)}</span></label>`).join('')}</div>`;}
async function saveVerificationSiteRemote(site,isNew){
  if(!supabaseClient||currentProfile?.role!=='admin')throw new Error('관리자 권한이 필요합니다.');
  const payload={name:site.name,responsible_institution:site.responsible_institution,target_count:site.target_count,linked_action_ids:site.linked_action_ids,active:site.active,sort_order:site.sort_order};
  let id=site.id;if(isNew){const {data,error}=await supabaseClient.from('ax_verification_sites').insert(payload).select('id').single();if(error)throw error;id=data.id;}else{const {error}=await supabaseClient.from('ax_verification_sites').update(payload).eq('id',id);if(error)throw error;}
  const progress={site_id:id,pre_survey_count:site.pre_survey_count||0,training_count:site.training_count||0,usage_count:site.usage_count||0,post_survey_count:site.post_survey_count||0,stipend_paid:!!site.stipend_paid,updated_by:currentUser.id};const {error:pe}=await supabaseClient.from('ax_verification_progress').upsert(progress,{onConflict:'site_id'});if(pe)throw pe;verificationLoaded=false;await loadVerificationSites(true);return id;
}
async function saveVerificationProgressRemote(site){
  if(!supabaseClient||!currentProfile)throw new Error('로그인이 필요합니다.');
  const progress={site_id:site.id,pre_survey_count:site.pre_survey_count||0,training_count:site.training_count||0,usage_count:site.usage_count||0,post_survey_count:site.post_survey_count||0,stipend_paid:!!site.stipend_paid,updated_by:currentUser.id};const {error}=await supabaseClient.from('ax_verification_progress').upsert(progress,{onConflict:'site_id'});if(error)throw error;verificationLoaded=false;await loadVerificationSites(true);
}
async function deleteVerificationSiteRemote(id){if(currentProfile?.role!=='admin')throw new Error('관리자 권한이 필요합니다.');const {error}=await supabaseClient.from('ax_verification_sites').delete().eq('id',id);if(error)throw error;verificationLoaded=false;await loadVerificationSites(true);}
function openVerificationSite(id=''){
  const existing=id?verificationSites.find(x=>x.id===id):null;const isNew=!existing;const site=existing?{...existing}:{id:'',name:'',responsible_institution:'경복대학교',target_count:1,linked_action_ids:[],active:true,sort_order:verificationSites.length*10+10,pre_survey_count:0,training_count:0,usage_count:0,post_survey_count:0,stipend_paid:false};
  const admin=currentProfile?.role==='admin';const canProgress=admin||currentProfile?.institution===site.responsible_institution;const metaDisabled=admin?'':'disabled';const progressDisabled=canProgress?'':'disabled';
  const stageFields=[['pre_survey_count','사전설문'],['training_count','교육'],['usage_count','사용'],['post_survey_count','사후설문']].map(([key,label])=>`<div class="vf-count-field"><label>${label}</label><div><input type="number" min="0" max="${site.target_count}" class="input" id="vf_${key}" value="${site[key]||0}" ${progressDisabled}><span>/ ${site.target_count}명</span></div></div>`).join('');
  openDrawer('FIELD VERIFICATION',isNew?'실증기관 추가':site.name,`${!admin?`<div class="read-only-banner">${canProgress?'책임기관 권한 · 단계별 완료 인원만 수정할 수 있습니다.':'조회 전용 · 다른 책임기관의 실증정보는 수정할 수 없습니다.'}</div>`:''}<div class="form-grid"><div class="form-field"><label>실증기관명</label><input class="input" id="vfName" value="${esc(site.name)}" ${metaDisabled}></div><div class="form-field"><label>책임기관</label><select class="select" id="vfOwner" ${metaDisabled}>${PORTAL_ORDER.map(x=>`<option ${x===site.responsible_institution?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="form-field"><label>목표 인원수</label><input type="number" min="1" class="input" id="vfTarget" value="${site.target_count}" ${metaDisabled}></div><div class="form-field"><label>상태</label><div class="vf-drawer-rate"><strong>${verificationTotalPct(site)}%</strong><span>${verificationStatus(site)}</span></div></div></div><div class="drawer-section-divider"><span>단계별 완료 인원</span></div><div class="vf-count-grid">${stageFields}</div>${verificationBarHTML(site)}<div class="vf-stipend-check"><label><span>사례비</span><input type="checkbox" id="vfStipendPaid" ${site.stipend_paid?'checked':''} ${progressDisabled}></label><small>사례비 지급 완료 여부 · 실증 진행률에는 반영되지 않습니다.</small></div>${admin?`<div class="drawer-section-divider"><span>실증 연계 진행항목</span></div><div class="form-help">실증과 직접 연관된 진행항목을 체크합니다.</div>${verificationLinkedActionChecks(site.linked_action_ids||[])}<label class="toggle-line"><input type="checkbox" id="vfActive" ${site.active!==false?'checked':''}> 사용 중인 실증기관</label>`:''}<div class="drawer-actions">${admin&&!isNew?'<button class="btn danger" id="vfDelete">삭제</button>':''}<button class="btn secondary" id="vfClose">닫기</button>${admin||canProgress?'<button class="btn primary" id="vfSave">저장</button>':''}</div>`);
  document.getElementById('vfClose').onclick=closeDrawer;
  if(document.getElementById('vfDelete'))document.getElementById('vfDelete').onclick=async()=>{if(!confirm('이 실증기관을 삭제하시겠습니까?'))return;try{await deleteVerificationSiteRemote(site.id);closeDrawer();render();toast('실증기관을 삭제했습니다.');}catch(e){alert(e.message);}};
  if(document.getElementById('vfSave'))document.getElementById('vfSave').onclick=async()=>{try{const target=admin?Math.max(1,Number(document.getElementById('vfTarget').value)||1):site.target_count;site.target_count=target;if(admin){site.name=document.getElementById('vfName').value.trim();site.responsible_institution=document.getElementById('vfOwner').value;site.linked_action_ids=checkedValues('vfLinkedAction');site.active=document.getElementById('vfActive')?.checked??true;if(!site.name)throw new Error('실증기관명을 입력해 주십시오.');}for(const key of ['pre_survey_count','training_count','usage_count','post_survey_count']){site[key]=Math.min(target,Math.max(0,Number(document.getElementById('vf_'+key).value)||0));}site.stipend_paid=!!document.getElementById('vfStipendPaid')?.checked;if(admin)await saveVerificationSiteRemote(site,isNew);else await saveVerificationProgressRemote(site);closeDrawer();render();toast('실증 현황을 저장했습니다.');}catch(e){alert(e.message||'저장에 실패했습니다.');}};
}
function timelineHTML(){
  const start='2026-06-01', end='2026-12-31'; const total=daysDiff(start,end)+1;
  const rows=state.actions.filter(a=>a.active!==false&&a.start&&a.end).sort((a,b)=>a.start.localeCompare(b.start));
  return `<div class="toolbar"><span class="tag blue">Master Schedule</span><span class="muted">실행과제의 시작일·종료일을 자동으로 표시</span></div><div class="gantt"><div class="gantt-header"><div>실행과제</div>${['6월','7월','8월','9월','10월','11월','12월'].map(m=>`<div>${m}</div>`).join('')}</div>${rows.map(a=>{const left=Math.max(0,daysDiff(start,a.start))/total*100;const width=Math.max(1,(daysDiff(a.start,a.end)+1)/total*100);const overdue=a.status!=='완료 승인'&&a.end<today();return `<div class="gantt-row" data-action="${a.id}"><div class="gantt-name"><strong>${actionCode(a)?`<span class="action-code-tag small">${esc(actionCode(a))}</span> `:''}${esc(a.name)}</strong><span>${esc(ownerDisplay(a.owner))} · ${fmtDate(a.start)}~${fmtDate(a.end)}</span></div>${Array(7).fill('<div></div>').join('')}<div class="gantt-track"><span class="gantt-bar ${a.status==='완료 승인'?'done':overdue?'overdue':''}" style="left:${left}%;width:${width}%"></span></div></div>`}).join('')}</div>`;
}

function recordsHTML(){return `<div class="grid-2"><div><div class="section-title"><div><h2>회의</h2><p>회의 결과는 실행과제로 전환하는 구조를 전제로 함</p></div></div><div class="table-wrap"><table class="data-table" style="min-width:600px"><thead><tr><th>회의명</th><th>일자</th><th>참여</th><th>장소</th></tr></thead><tbody>${state.meetings.map(m=>`<tr><td class="cell-title">${esc(m.name)}</td><td>${fmtDate(m.date)}</td><td>${esc(m.participants||'-')}</td><td>${esc(m.location||'-')}</td></tr>`).join('')}</tbody></table></div></div><div><div class="section-title"><div><h2>공유 문서</h2><p>현재 Notion export 문서 목록</p></div></div><div class="panel">${state.documents.map(d=>`<div class="category-row" style="grid-template-columns:1fr 90px"><div><strong>${esc(d.name)}</strong><div class="cell-sub">${esc(d.type)}</div></div><div>${fmtDate(d.date)}</div></div>`).join('')||'<div class="empty">문서 없음</div>'}</div></div></div>`;}

function formatDateTime(v){if(!v)return '-';try{return new Date(v).toLocaleString('ko-KR',{year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_e){return v;}}
function usersHTML(){
  const users=adminUsersCache||[];const counts=Object.fromEntries(PORTAL_ORDER.map(inst=>[inst,users.filter(u=>u.role==='member'&&u.institution===inst).length]));
  const resetRows=(adminResetRequestsCache||[]).map(r=>{const u=users.find(x=>x.user_id===r.user_id)||{};return `<div class="password-reset-row"><div><strong>${esc(u.display_name||r.login_id)}</strong><small>${esc(r.login_id)}</small></div><span>${esc(r.institution||u.institution||'-')}</span><small>${formatDateTime(r.requested_at)}</small><button class="mini-btn" data-reset-request-user="${esc(r.user_id||'')}">비밀번호 재설정</button></div>`}).join('');
  return `<div class="user-admin-head"><div><h2>사용자 계정 관리</h2><p>관리자 최대 2개, 기관별 사용자 최대 5개를 운영합니다. 비밀번호 원문은 저장하지 않습니다.</p></div><button class="btn primary" id="addUserAccount">+ 계정 추가</button></div>
  <div class="user-count-grid"><div class="user-count-card admin-count-card"><span>관리자</span><strong>${users.filter(u=>u.role==='admin').length}<em>/2</em></strong></div>${PORTAL_ORDER.map(inst=>`<div class="user-count-card"><span>${esc(inst)}</span><strong>${counts[inst]||0}<em>/5</em></strong></div>`).join('')}</div>
  <div class="admin-edit-hint"><strong>권한 원칙</strong><span>전체 현황 조회 가능 · 수정·삭제·요청은 자기 기관 데이터만 · 답변이 달린 원문은 잠금</span></div>
  ${(adminResetRequestsCache||[]).length?`<div class="panel password-reset-panel"><div class="section-title"><div><h2>비밀번호 초기화 요청</h2><p>로그인 화면에서 접수된 요청입니다. 임시 비밀번호를 설정한 뒤 사용자에게 전달해 주십시오.</p></div></div><div class="password-reset-list">${resetRows}</div></div>`:''}
  <div id="userAdminHolder">${adminUsersCache?userTableHTML(users):'<div class="panel loading-panel">계정 목록을 불러오는 중입니다.</div>'}</div>`;
}
function userTableHTML(users){
  if(!users.length)return '<div class="empty panel">등록된 계정이 없습니다.</div>';
  return `<div class="table-wrap"><table class="data-table user-admin-table"><thead><tr><th>사용자</th><th>로그인 ID</th><th>기관</th><th>권한</th><th>상태</th><th>최근 접속</th><th>관리</th></tr></thead><tbody>${users.map(u=>`<tr><td><strong>${esc(u.display_name)}</strong></td><td>${esc(u.login_id)}</td><td>${esc(u.institution)}</td><td>${u.role==='admin'?'<span class="tag blue">관리자</span>':'기관 사용자'}</td><td>${u.active?'<span class="tag good">사용중</span>':'<span class="tag">중지</span>'}</td><td>${formatDateTime(u.last_login_at)}</td><td><div class="user-actions">${u.role!=='admin'?`<button class="mini-btn" data-user-edit="${u.user_id}">정보</button><button class="mini-btn" data-user-reset="${u.user_id}">비밀번호</button><button class="mini-btn" data-user-active="${u.user_id}">${u.active?'중지':'사용'}</button><button class="mini-btn danger-mini" data-user-delete="${u.user_id}">삭제</button>`:`<button class="mini-btn" data-user-reset="${u.user_id}">비밀번호</button>`}</div></td></tr>`).join('')}</tbody></table></div>`;
}
async function loadAdminUsers(){
  if(adminUsersLoading||currentProfile?.role!=='admin')return;adminUsersLoading=true;
  try{const out=await callUserAdmin('list');adminUsersCache=out.users||[];adminResetRequestsCache=out.reset_requests||[];render();} 
  catch(e){const holder=document.getElementById('userAdminHolder');if(holder)holder.innerHTML=`<div class="panel error-panel">${esc(e.message||'계정 목록을 불러오지 못했습니다.')}</div>`;}
  finally{adminUsersLoading=false;}
}
function bindUserAdminEvents(){
  document.querySelectorAll('[data-user-edit]').forEach(b=>b.onclick=()=>openUserEdit(b.dataset.userEdit));
  document.querySelectorAll('[data-user-reset]').forEach(b=>b.onclick=()=>openUserPassword(b.dataset.userReset));
  document.querySelectorAll('[data-user-active]').forEach(b=>b.onclick=async()=>{const u=adminUsersCache.find(x=>x.user_id===b.dataset.userActive);if(!u)return;try{await callUserAdmin('set_active',{user_id:u.user_id,active:!u.active});adminUsersCache=null;render();toast(u.active?'계정을 중지했습니다.':'계정을 활성화했습니다.');}catch(e){alert(e.message);}});
  document.querySelectorAll('[data-user-delete]').forEach(b=>b.onclick=async()=>{const u=adminUsersCache.find(x=>x.user_id===b.dataset.userDelete);if(!u||!confirm(`${u.display_name} 계정을 삭제하시겠습니까?`))return;try{await callUserAdmin('delete',{user_id:u.user_id});adminUsersCache=null;render();toast('계정을 삭제했습니다.');}catch(e){alert(e.message);}});
  document.querySelectorAll('[data-reset-request-user]').forEach(b=>b.onclick=()=>openUserPassword(b.dataset.resetRequestUser));
}
function openUserCreate(){
  openDrawer('USER','계정 추가',`<div class="form-grid"><div class="form-field"><label>계정 유형</label><select class="select" id="uRole"><option value="member">기관 사용자</option><option value="admin">관리자</option></select></div><div class="form-field"><label>기관</label><select class="select" id="uInstitution">${PORTAL_ORDER.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div></div><div class="form-field"><label>사용자명</label><input class="input" id="uName"></div><div class="form-field"><label>로그인 ID</label><input class="input" id="uLoginId" placeholder="영문·숫자 3자 이상"></div><div class="form-field"><label>초기 비밀번호</label><input type="password" class="input" id="uPassword" placeholder="8자 이상"></div><div class="form-help">관리자는 최대 2개, 기관 사용자 계정은 기관당 최대 5개입니다. 관리자 계정은 정션메드 소속으로 생성됩니다.</div><div class="drawer-actions"><button class="btn secondary" id="uCancel">취소</button><button class="btn primary" id="uSave">계정 생성</button></div>`);
  const role=document.getElementById('uRole'),inst=document.getElementById('uInstitution');role.onchange=()=>{if(role.value==='admin'){inst.value='정션메드';inst.disabled=true;}else inst.disabled=false;};
  document.getElementById('uCancel').onclick=closeDrawer;document.getElementById('uSave').onclick=async()=>{const payload={role:role.value,institution:role.value==='admin'?'정션메드':inst.value,display_name:document.getElementById('uName').value.trim(),login_id:document.getElementById('uLoginId').value.trim(),password:document.getElementById('uPassword').value};try{await callUserAdmin('create',payload);adminUsersCache=null;closeDrawer();render();toast(payload.role==='admin'?'관리자 계정을 생성했습니다.':'기관 계정을 생성했습니다.');}catch(e){alert(e.message);}};
}
function openUserEdit(userId){const u=adminUsersCache.find(x=>x.user_id===userId);if(!u)return;openDrawer('USER',u.display_name,`<div class="form-grid"><div class="form-field"><label>기관</label><select class="select" id="ueInstitution">${PORTAL_ORDER.map(x=>`<option ${x===u.institution?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="form-field"><label>사용자명</label><input class="input" id="ueName" value="${esc(u.display_name)}"></div></div><div class="form-field"><label>로그인 ID</label><input class="input" value="${esc(u.login_id)}" disabled></div><div class="drawer-actions"><button class="btn secondary" id="ueCancel">취소</button><button class="btn primary" id="ueSave">저장</button></div>`);document.getElementById('ueCancel').onclick=closeDrawer;document.getElementById('ueSave').onclick=async()=>{try{await callUserAdmin('update_profile',{user_id:u.user_id,institution:document.getElementById('ueInstitution').value,display_name:document.getElementById('ueName').value.trim()});adminUsersCache=null;closeDrawer();render();toast('계정 정보를 수정했습니다.');}catch(e){alert(e.message);}};}
function openUserPassword(userId){const u=adminUsersCache.find(x=>x.user_id===userId);if(!u)return;openDrawer('PASSWORD',`${u.display_name} 비밀번호 재설정`,`<div class="form-field"><label>새 비밀번호</label><input type="password" class="input" id="urPassword" placeholder="8자 이상"></div><div class="form-field"><label>새 비밀번호 확인</label><input type="password" class="input" id="urPassword2"></div><div class="form-help">기존 비밀번호는 조회하지 않습니다. 새 비밀번호로 즉시 재설정합니다. 접수된 초기화 요청이 있으면 함께 처리 완료됩니다.</div><div class="drawer-actions"><button class="btn secondary" id="urCancel">취소</button><button class="btn primary" id="urSave">재설정</button></div>`);document.getElementById('urCancel').onclick=closeDrawer;document.getElementById('urSave').onclick=async()=>{const p1=document.getElementById('urPassword').value,p2=document.getElementById('urPassword2').value;if(p1!==p2){alert('비밀번호 확인이 일치하지 않습니다.');return;}try{await callUserAdmin('reset_password',{user_id:u.user_id,password:p1});adminUsersCache=null;adminResetRequestsCache=[];closeDrawer();render();toast('비밀번호를 재설정했습니다.');}catch(e){alert(e.message);}};}

function settingsHTML(){return `<div class="settings-grid">
  <div class="setting-card"><h3>프로젝트 기본정보</h3><p>기준일과 사업기간은 대시보드·지연판정·간트에 즉시 반영됩니다.</p><div class="form-field"><label>기준일</label><input type="date" class="input" id="asOfSetting" value="${state.project.asOf}"></div><button class="btn primary" id="saveProjectSetting">저장</button></div>
  <div class="setting-card"><h3>데이터 백업</h3><p>별도 개발 없이 운영 데이터를 JSON으로 백업·복원할 수 있습니다.</p><div class="toolbar"><button class="btn secondary" id="exportJson">JSON 내보내기</button><button class="btn secondary" id="importJson">JSON 불러오기</button></div></div>
  <div class="setting-card"><h3>초기 데이터</h3><p>업로드된 사업계획·Notion export 자료를 기준으로 만든 초기 상태로 되돌립니다. 입력한 수정내용은 삭제됩니다.</p><button class="btn danger" id="resetData">초기 데이터로 복원</button></div>
  <div class="setting-card"><h3>운영 원칙</h3><div class="code-note">참여기관: 진행상황·실적·증빙·요청 제출\n정션메드 PM: 검토 → 승인 → 공식 데이터 반영\n성과목표/진행항목/기관/일정: 하나의 데이터에서 자동 생성</div></div>
  <div class="setting-card"><h3>공유DB</h3><p>Supabase 공유DB와 연결됩니다. 변경사항은 저장 즉시 공용 데이터에 반영됩니다.</p><div class="toolbar"><button class="btn secondary" id="refreshRemote">공유DB 새로고침</button><button class="btn primary" id="forceRemoteSave">현재 데이터 동기화</button></div><div class="form-help">사업계획서 기준일정은 보존하고 현재일정·세부항목은 운영 중 변경할 수 있습니다.</div></div>
  <div class="setting-card"><h3>기관</h3><p>${state.institutions.map(i=>`<span class="tag ${i.role==='주관기관'?'blue':''}">${esc(i.name)} · ${esc(i.role)}</span>`).join(' ')}</p></div>
  </div>`;}

function bindViewEvents(){
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{currentView=b.dataset.go;render();});
  document.querySelectorAll('[data-verification-site]').forEach(b=>b.onclick=()=>openVerificationSite(b.dataset.verificationSite));
  document.querySelectorAll('[data-kpi]').forEach(x=>x.onclick=()=>openKpi(x.dataset.kpi));
  document.querySelectorAll('[data-action]').forEach(x=>x.onclick=()=>openAction(x.dataset.action));
  document.querySelectorAll('[data-request]').forEach(x=>x.onclick=()=>openRequest(x.dataset.request));
  document.querySelectorAll('[data-memo]').forEach(x=>x.onclick=()=>openMemo(x.dataset.memo));
  document.querySelectorAll('[data-inst]').forEach(x=>x.onclick=()=>{viewFilter.institution=x.dataset.inst;currentView='institutions';render();});
  document.querySelectorAll('[data-work-inst]').forEach(b=>b.onclick=()=>{viewFilter.workInstitution=b.dataset.workInst;render();window.scrollTo({top:0,behavior:'smooth'});});
  if(document.getElementById('kpiSearch')){['input','change'].forEach(evt=>{document.getElementById('kpiSearch').addEventListener(evt,filterKpis);document.getElementById('kpiCategory').addEventListener(evt,filterKpis);document.getElementById('kpiStatus').addEventListener(evt,filterKpis);});}
  if(document.getElementById('actionSearch')){['input','change'].forEach(evt=>{document.getElementById('actionSearch').addEventListener(evt,filterActions);document.getElementById('actionInst').addEventListener(evt,filterActions);document.getElementById('actionStatus').addEventListener(evt,filterActions);document.getElementById('actionActive').addEventListener(evt,filterActions);});document.getElementById('addAction').onclick=()=>openAction();}
  if(document.getElementById('addRequest')) document.getElementById('addRequest').onclick=()=>openRequest();
  if(document.getElementById('requestSearch')){['input','change'].forEach(evt=>{document.getElementById('requestSearch').addEventListener(evt,filterRequestsAdmin);document.getElementById('requestInstitutionFilter').addEventListener(evt,filterRequestsAdmin);document.getElementById('requestScopeFilter').addEventListener(evt,filterRequestsAdmin);});}
  if(document.getElementById('newRequestForInst')) document.getElementById('newRequestForInst').onclick=()=>openRequest(null, viewFilter.workInstitution || PARTNER_ORDER[0]);
  if(document.getElementById('newMemoForInst')) document.getElementById('newMemoForInst').onclick=()=>openMemo(null, viewFilter.workInstitution || PARTNER_ORDER[0]);
  if(document.getElementById('addMemo')) document.getElementById('addMemo').onclick=()=>openMemo();
  if(document.getElementById('memoInstitutionFilter')) document.getElementById('memoInstitutionFilter').onchange=e=>{viewFilter.memoInstitution=e.target.value;render();};
  if(document.getElementById('saveProjectSetting')) document.getElementById('saveProjectSetting').onclick=()=>{state.project.asOf=document.getElementById('asOfSetting').value;saveState();toast('기준일을 저장했습니다.');render();};
  if(document.getElementById('exportJson')) document.getElementById('exportJson').onclick=exportJson;
  if(document.getElementById('importJson')) document.getElementById('importJson').onclick=()=>document.getElementById('importInput').click();
  if(document.getElementById('refreshRemote')) document.getElementById('refreshRemote').onclick=()=>refreshFromRemote(false);
  if(document.getElementById('forceRemoteSave')) document.getElementById('forceRemoteSave').onclick=()=>pushRemoteState();
  if(document.getElementById('resetData')) document.getElementById('resetData').onclick=()=>{if(confirm('현재 수정 데이터를 모두 지우고 초기 상태로 복원할까요?')){state=normalizeFlexibleActions(clone(window.INITIAL_DATA));normalizeInstitutionOrder();saveState();render();toast('초기 데이터로 복원했습니다.');}};
  if(currentView==='verification') bindVerificationAdminEvents();
  if(currentView==='users'){const add=document.getElementById('addUserAccount');if(add)add.onclick=openUserCreate;bindUserAdminEvents();if(!adminUsersCache)loadAdminUsers();}
}
function bindInstitutionPortalEvents(){
  document.querySelectorAll('[data-portal-inst]').forEach(b=>b.onclick=()=>{portalInstitution=b.dataset.portalInst;portalDetailTab='all';portalListFilter='all';portalRequestView='all';const code=INSTITUTION_CODE[portalInstitution]||'main';history.replaceState(null,'',`index.html?inst=${encodeURIComponent(code)}`);render();window.scrollTo({top:0,behavior:'smooth'});});
  document.querySelectorAll('[data-portal-detail]').forEach(b=>b.onclick=()=>{portalDetailTab=b.dataset.portalDetail;render();setTimeout(()=>document.querySelector('.portal-detail-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);});
  const portalListFilterEl=document.getElementById('portalListFilter');if(portalListFilterEl)portalListFilterEl.onchange=()=>{portalListFilter=portalListFilterEl.value;render();setTimeout(()=>document.querySelector('.portal-list-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);};
  document.querySelectorAll('[data-portal-jump]').forEach(b=>b.onclick=()=>{const target=b.dataset.portalJump;if(target==='requests'){setTimeout(()=>document.querySelector('.portal-request-main-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}if(target==='memos'){setTimeout(()=>document.querySelector('.portal-memo-main-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);return;}portalListFilter=target;render();setTimeout(()=>document.querySelector('.portal-list-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);});
  document.querySelectorAll('[data-portal-item]').forEach(b=>b.onclick=()=>openAction(b.dataset.portalItem));
  document.querySelectorAll('[data-open-action]').forEach(b=>b.onclick=e=>{e.stopPropagation();openAction(b.dataset.openAction);});
  document.querySelectorAll('[data-go-action]').forEach(b=>b.onclick=e=>{e.stopPropagation();openAction(b.dataset.goAction);});
  document.querySelectorAll('[data-public-request]').forEach(b=>b.onclick=()=>openInstitutionRequest(b.dataset.publicRequest,portalInstitution));
  document.querySelectorAll('[data-edit-own-request]').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequest(b.dataset.editOwnRequest);});
  document.querySelectorAll('[data-delete-own-request]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const r=state.requests.find(x=>x.id===b.dataset.deleteOwnRequest);if(!r||!confirm('요청을 삭제하시겠습니까?'))return;try{await portalDeleteRequestRemote(r.id);render();toast('요청을 삭제했습니다.');}catch(err){alert(err.message||'삭제할 수 없습니다.');}});
  document.querySelectorAll('[data-public-memo]').forEach(b=>b.onclick=()=>openInstitutionMemo(b.dataset.publicMemo,portalInstitution));
  const add=document.getElementById('publicAddMemo');if(add)add.onclick=()=>openInstitutionMemo(null,portalInstitution);
  const addTop=document.getElementById('publicAddMemoTop');if(addTop)addTop.onclick=()=>openInstitutionMemo(null,portalInstitution);
  const newReq=document.getElementById('publicNewRequest');if(newReq)newReq.onclick=()=>openInstitutionNewRequest(portalInstitution);
  const addAction=document.getElementById('publicAddAction');if(addAction)addAction.onclick=()=>openAction();
  const requestView=document.getElementById('portalRequestView');if(requestView)requestView.onchange=()=>{portalRequestView=requestView.value;render();setTimeout(()=>document.querySelector('.portal-request-main-section')?.scrollIntoView({behavior:'smooth',block:'start'}),20);};
  document.querySelectorAll('[data-verification-site]').forEach(b=>b.onclick=()=>openVerificationSite(b.dataset.verificationSite));
}

function filterKpis(){const q=document.getElementById('kpiSearch').value.trim().toLowerCase(),cat=document.getElementById('kpiCategory').value,st=document.getElementById('kpiStatus').value;const list=state.kpis.filter(k=>(!q||(k.name+' '+k.target).toLowerCase().includes(q))&&(cat==='전체'||k.category===cat)&&(st==='전체 상태'||k.status===st));document.getElementById('kpiGrid').innerHTML=renderKpiCards(list);document.querySelectorAll('[data-kpi]').forEach(x=>x.onclick=()=>openKpi(x.dataset.kpi));}
function filterActions(){const q=document.getElementById('actionSearch').value.trim().toLowerCase(),inst=document.getElementById('actionInst').value,st=document.getElementById('actionStatus').value,active=document.getElementById('actionActive')?.value||'사용 항목';const list=state.actions.filter(a=>(!q||`${a.displayCode||''} ${a.name||''}`.toLowerCase().includes(q))&&(inst==='전체 기관'||(inst==='책임기관 미확정'&&!a.owner)||a.owner===inst||(a.collaborators||[]).includes(inst))&&(st==='전체 상태'||a.status===st)&&(active==='전체 항목'||(active==='비활성'?a.active===false:a.active!==false)));document.getElementById('actionTableHolder').innerHTML=actionTableHTML(list);document.querySelectorAll('[data-action]').forEach(x=>x.onclick=()=>openAction(x.dataset.action));}

function openDrawer(eyebrow,title,body){document.getElementById('drawerEyebrow').textContent=eyebrow;document.getElementById('drawerTitle').textContent=title;document.getElementById('drawerBody').innerHTML=body;document.getElementById('drawer').classList.add('open');document.getElementById('drawerBackdrop').classList.add('open');}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawerBackdrop').classList.remove('open');}
function instOptions(selected='',allowBlank=true){return `${allowBlank?`<option value="">책임기관 미확정</option>`:''}${state.institutions.map(i=>`<option value="${esc(i.name)}" ${i.name===selected?'selected':''}>${esc(i.name)}</option>`).join('')}`;}
function multiInstChecks(selected=[]){return state.institutions.map(i=>`<label class="tag"><input type="checkbox" name="collab" value="${esc(i.name)}" ${selected.includes(i.name)?'checked':''}> ${esc(i.name)}</label>`).join('');}
function checkedValues(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value);}

function openKpi(id){const k=state.kpis.find(x=>x.id===id);if(!k)return;openDrawer(k.id,k.name,`<div class="detail-block"><h4>협약 목표</h4><p>${esc(k.target)}</p></div><div class="form-grid"><div class="form-field"><label>현재값</label><input class="input" id="kCurrent" value="${esc(k.currentValue)}" placeholder="예: 430명 / 1,280건"></div><div class="form-field"><label>달성률 (%)</label><input type="number" min="0" max="100" class="input" id="kProgress" value="${k.progress??''}" placeholder="0~100"></div></div><div class="form-grid"><div class="form-field"><label>성과 상태</label><select class="select" id="kStatus">${KPI_STATUS_OPTIONS.map(s=>`<option ${s===k.status?'selected':''}>${s}</option>`).join('')}</select></div><div class="form-field"><label>증빙 상태</label><select class="select" id="kEvidence"><option ${k.evidenceStatus==='미등록'?'selected':''}>미등록</option><option ${k.evidenceStatus==='준비 중'?'selected':''}>준비 중</option><option ${k.evidenceStatus==='확보'?'selected':''}>확보</option><option ${k.evidenceStatus==='PM 승인'?'selected':''}>PM 승인</option></select></div></div><div class="form-field"><label>책임기관</label><select class="select" id="kOwner">${instOptions(k.owner)}</select><div class="form-help">원자료에 여러 기관이 함께 표기된 경우 초기값을 미확정으로 두었습니다.</div></div><div class="form-field"><label>협업기관</label><div>${multiInstChecks(k.collaborators)}</div></div><div class="form-field"><label>남아있는 과정 / 다음 단계</label><textarea class="textarea" id="kNext" placeholder="예: 기관확보 → 온보딩 → 사전조사 → 실증 → 사후조사 → 분석">${esc(k.nextStep)}</textarea></div><div class="form-field"><label>PM 메모</label><textarea class="textarea" id="kPm">${esc(k.pmNote)}</textarea></div><div class="detail-block"><h4>주요내용 및 산출물</h4><p>${esc(k.deliverable)}</p></div><div class="detail-block"><h4>평가기준</h4><p>${esc(k.evaluation)}</p></div><div class="drawer-actions"><button class="btn secondary" id="closeKpi">취소</button><button class="btn primary" id="saveKpi">저장</button></div>`);document.getElementById('closeKpi').onclick=closeDrawer;document.getElementById('saveKpi').onclick=()=>{k.currentValue=document.getElementById('kCurrent').value;k.progress=document.getElementById('kProgress').value===''?null:Number(document.getElementById('kProgress').value);k.status=document.getElementById('kStatus').value;k.evidenceStatus=document.getElementById('kEvidence').value;k.owner=document.getElementById('kOwner').value;k.collaborators=checkedValues('collab').filter(x=>x!==k.owner);k.nextStep=document.getElementById('kNext').value;k.pmNote=document.getElementById('kPm').value;saveState();closeDrawer();render();toast('성과목표를 업데이트했습니다.');};}

function nextActionId(){return 'ACT-'+String(Math.max(0,...state.actions.map(x=>Number(String(x.id).split('-')[1])||0))+1).padStart(3,'0');}
function openAction(id,preset={}){
  let a=id?state.actions.find(x=>x.id===id):null;const isNew=!a;const adminMode=isAdmin&&currentProfile?.role==='admin';
  if(!a){
    const parent=preset.parentId?state.actions.find(x=>x.id===preset.parentId):null;
    const owner=adminMode?(parent?.owner||profileInstitution()):(profileInstitution()||'');
    a={id:adminMode?nextActionId():'',displayCode:adminMode?nextActionDisplayCode():'',name:'',owner,collaborators:parent?[...(parent.collaborators||[])]:[],start:parent?.start||today(),end:parent?.end||today(),baselineStart:parent?.start||today(),baselineEnd:parent?.end||today(),status:'예정',priority:'보통',completionCriteria:'',evidence:'',blocker:'',pmCheck:false,relatedKpi:parent?.relatedKpi||'',note:'',planInstitutions:[owner],parentId:preset.parentId||'',active:true,changeReason:'',sortOrder:Math.max(0,...state.actions.map(x=>Number(x.sortOrder)||0))+10,stages:[]};
  }
  normalizeFlexibleActions({actions:[a],project:{}});
  const editable=adminMode||(!isNew&&a.owner===profileInstitution())||(isNew&&!adminMode&&portalInstitution===profileInstitution());
  if(!editable&&!a){return;}
  const parentOptions=`<option value="">상위항목 없음</option>${state.actions.filter(x=>x.id!==a.id&&x.active!==false).map(x=>`<option value="${esc(x.id)}" ${x.id===a.parentId?'selected':''}>${esc(actionLabel(x))}</option>`).join('')}`;
  const stageText=(a.stages||[]).join(', ');const ro=editable?'':'disabled';const adminRo=adminMode?'':'disabled';
  const relatedReq=(state.requests||[]).filter(r=>r.relatedAction===a.id);const relatedMemo=(state.memos||[]).filter(m=>m.relatedAction===a.id);
  openDrawer(actionCode(a)||a.id||'NEW ITEM',isNew?'진행항목 추가':a.name,`
    ${!editable?'<div class="read-only-banner">조회 전용 · 다른 기관의 진행항목은 수정할 수 없습니다.</div>':''}
    <div class="form-grid"><div class="form-field"><label>고유번호</label><input class="input" id="aDisplayCode" value="${esc(a.displayCode||'')}" ${adminRo} placeholder="미지정 시 자동 생성"><div class="form-help">관리자만 변경·삭제할 수 있습니다. 내부 연결 ID는 별도로 유지됩니다.</div></div><div class="form-field"><label>책임기관</label><select class="select" id="aOwner" ${adminRo}>${instOptions(a.owner)}</select></div></div>
    <div class="form-field"><label>항목명</label><input class="input" id="aName" value="${esc(a.name)}" ${ro}></div>
    <div class="form-grid"><div class="form-field"><label>상위항목</label><select class="select" id="aParent" ${ro}>${parentOptions}</select></div><div class="form-field"><label>상태</label><select class="select" id="aStatus" ${ro}>${STATUS_OPTIONS.map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select></div></div>
    <div class="form-field"><label>협업기관</label><div class="${!editable?'checks-disabled':''}">${multiInstChecks(a.collaborators)}</div></div>
    <div class="drawer-section-divider"><span>일정</span></div>
    <div class="form-grid baseline-grid"><div class="form-field"><label>기준 시작일</label><input type="date" class="input baseline-input" value="${a.baselineStart||''}" readonly></div><div class="form-field"><label>기준 종료일</label><input type="date" class="input baseline-input" value="${a.baselineEnd||''}" readonly></div></div>
    <div class="form-grid"><div class="form-field"><label>현재 시작일</label><input type="date" class="input" id="aStart" value="${a.start||''}" ${ro}></div><div class="form-field"><label>현재 종료일</label><input type="date" class="input" id="aEnd" value="${a.end||''}" ${ro}></div></div>
    <div class="form-field"><label>일정 변경 사유</label><input class="input" id="aChangeReason" value="${esc(a.changeReason||'')}" ${ro} placeholder="예: 기관 협의 일정 변경"></div>
    <div class="form-field"><label>관련 성과목표</label><select class="select" id="aKpi" ${ro}><option value="">미연결</option>${state.kpis.map(k=>`<option value="${esc(k.name)}" ${k.name===a.relatedKpi?'selected':''}>${esc(k.name)}</option>`).join('')}</select></div>
    <div class="form-field"><label>진행단계 표시</label><input class="input" id="aStages" value="${esc(stageText)}" ${ro} placeholder="예: 준비, 검토, 확정"></div>
    <div class="form-field"><label>완료기준</label><textarea class="textarea" id="aCriteria" ${ro}>${esc(a.completionCriteria)}</textarea></div>
    <div class="form-field"><label>필요 증빙</label><input class="input" id="aEvidence" value="${esc(a.evidence)}" ${ro}></div>
    <div class="form-field"><label>현재 이슈 / 확인사항</label><textarea class="textarea" id="aBlocker" ${ro}>${esc(a.blocker)}</textarea></div>
    ${adminMode?`<div class="form-grid"><div class="form-field"><label>사용 여부</label><label class="toggle-line"><input type="checkbox" id="aActive" ${a.active!==false?'checked':''}> 기관 화면과 일정에 표시</label></div><div class="form-field"><label><input type="checkbox" id="aPm" ${a.pmCheck?'checked':''}> PM 확인 필요</label></div></div>`:''}
    ${!isNew&&(relatedReq.length||relatedMemo.length)?`<div class="drawer-section-divider"><span>연결된 소통</span></div><div class="linked-communication-list">${relatedReq.map(r=>`<button type="button" data-open-request="${esc(r.id)}"><span>요청</span><strong>${esc(r.title)}</strong></button>`).join('')}${relatedMemo.map(m=>`<button type="button" data-open-memo="${esc(m.id)}"><span>협의</span><strong>${esc(m.title)}</strong></button>`).join('')}</div>`:''}
    <div class="drawer-actions flex-action-buttons">${editable&&!isNew?'<button class="btn danger" id="deleteAction">삭제</button>':''}${adminMode&&!isNew?'<button class="btn secondary" id="addSubAction">+ 세부항목</button><button class="btn secondary" id="duplicateAction">복제</button>':''}<button class="btn secondary" id="closeAction">닫기</button>${editable?'<button class="btn primary" id="saveAction">저장</button>':''}</div>`);
  document.getElementById('closeAction').onclick=closeDrawer;
  document.querySelectorAll('.checks-disabled input').forEach(x=>x.disabled=true);
  document.querySelectorAll('[data-open-request]').forEach(b=>b.onclick=()=>{closeDrawer();openRequest(b.dataset.openRequest);});
  document.querySelectorAll('[data-open-memo]').forEach(b=>b.onclick=()=>{closeDrawer();openMemo(b.dataset.openMemo);});
  if(document.getElementById('addSubAction'))document.getElementById('addSubAction').onclick=()=>{closeDrawer();openAction(null,{parentId:a.id});};
  if(document.getElementById('duplicateAction'))document.getElementById('duplicateAction').onclick=()=>{const copy=clone(a);copy.id=nextActionId();copy.displayCode=nextActionDisplayCode();copy.name=a.name+' 복사';copy.baselineStart=a.start;copy.baselineEnd=a.end;copy.sortOrder=Math.max(0,...state.actions.map(x=>Number(x.sortOrder)||0))+10;state.actions.push(copy);saveState();closeDrawer();render();toast('항목을 복제했습니다.');};
  if(document.getElementById('deleteAction'))document.getElementById('deleteAction').onclick=async()=>{if(!confirm('이 진행항목을 삭제하시겠습니까? 연결된 요청·메모는 연결 기록을 유지합니다.'))return;try{if(adminMode){a.active=false;saveState();}else await portalDeleteActionRemote(a.id);closeDrawer();render();toast('진행항목을 삭제했습니다.');}catch(e){alert(e.message||'삭제에 실패했습니다.');}};
  if(document.getElementById('saveAction'))document.getElementById('saveAction').onclick=async()=>{
    const name=document.getElementById('aName').value.trim();if(!name){alert('항목명을 입력하세요.');return;}
    const patch={name,parentId:document.getElementById('aParent').value,status:document.getElementById('aStatus').value,collaborators:checkedValues('collab').filter(x=>x!==a.owner),start:document.getElementById('aStart').value,end:document.getElementById('aEnd').value,changeReason:document.getElementById('aChangeReason').value.trim(),relatedKpi:document.getElementById('aKpi').value,stages:document.getElementById('aStages').value.split(',').map(x=>x.trim()).filter(Boolean),completionCriteria:document.getElementById('aCriteria').value,evidence:document.getElementById('aEvidence').value,blocker:document.getElementById('aBlocker').value};
    try{
      if(adminMode){
        a.name=patch.name;a.parentId=patch.parentId;a.owner=document.getElementById('aOwner').value;a.status=patch.status;a.collaborators=patch.collaborators.filter(x=>x!==a.owner);a.start=patch.start;a.end=patch.end;a.changeReason=patch.changeReason;a.relatedKpi=patch.relatedKpi;a.stages=patch.stages;a.completionCriteria=patch.completionCriteria;a.evidence=patch.evidence;a.blocker=patch.blocker;a.displayCode=document.getElementById('aDisplayCode').value.trim();if(isNew&&!a.displayCode)a.displayCode=nextActionDisplayCode();a.active=document.getElementById('aActive')?.checked??true;a.pmCheck=document.getElementById('aPm')?.checked??false;if(isNew)state.actions.push(a);saveState();
      }else if(isNew){await portalCreateActionRemote(patch);}else await portalUpdateActionRemote(a.id,patch);
      closeDrawer();render();toast(isNew?'진행항목을 추가했습니다.':'진행항목을 업데이트했습니다.');
    }catch(e){console.error(e);alert(e.message||'저장에 실패했습니다.');}
  };
}

function nextRequestId(){return 'REQ-LOCAL-'+Date.now();}
function adminRequestResponseBlocks(r){
  return requestRecipients(r).map(name=>{const resp=requestResponse(r,name);return `<div class="admin-response-block" data-admin-response="${esc(name)}"><div class="admin-response-head"><strong>${esc(name)} 회신</strong><span>${resp.text?'회신 등록':'회신 대기'}</span></div><div class="form-field"><label>회신내용</label><textarea class="textarea response-textarea" data-response-text>${esc(resp.text||'')}</textarea></div><div class="form-grid"><div class="form-field"><label>회신일</label><input type="date" class="input" data-response-date value="${resp.date||''}"></div><div class="form-field"><label>관리자 확인 메모</label><input class="input" data-response-confirm value="${esc(resp.confirmation||'')}"></div></div><div class="inline-actions"><button type="button" class="btn secondary compact-btn" data-save-response="${esc(name)}">회신 저장</button>${resp.text?`<button type="button" class="btn danger compact-btn" data-clear-response="${esc(name)}">회신 삭제</button>`:''}</div></div>`}).join('');
}
function openRequest(id,defaultTo=''){
  let r=id?state.requests.find(x=>x.id===id):null;const isNew=!r;
  if(!r)r={id:nextRequestId(),title:'',from:profileInstitution()||'정션메드',toInstitutions:defaultTo?[defaultTo]:[],to:defaultTo||'',content:'',requestedAt:today(),due:'',status:'요청',responses:{},relatedAction:''};
  normalizeRequest(r);
  const locked=!isNew&&requestLocked(r);const editable=isNew||canEditRequest(r);const adminMode=isAdmin&&currentProfile?.role==='admin';const targets=PORTAL_ORDER.filter(name=>name!==r.from);const recipients=requestRecipients(r);
  const actionOptions=state.actions.filter(a=>a.active!==false).map(a=>`<option value="${esc(a.id)}" ${a.id===r.relatedAction?'selected':''}>${esc(actionLabel(a))}</option>`).join('');
  openDrawer(isNew?'NEW REQUEST':r.id,isNew?'요청 등록':r.title,`
    ${locked?'<div class="locked-banner"><strong>회신 등록 후 잠금</strong><span>회신이 등록된 요청은 원문 수정·삭제가 제한됩니다.</span></div>':''}
    ${r.relatedAction?`<div class="linked-action-banner"><span>관련 진행항목</span>${relatedActionHTML(r.relatedAction)}</div>`:''}
    <div class="form-field"><label>요청 제목</label><input class="input" id="rTitle" value="${esc(r.title)}" ${editable?'':'disabled'}></div>
    <div class="form-field"><label>요청기관</label><input class="input" value="${esc(r.from)}" disabled></div>
    <div class="form-field"><label>수신기관</label>${editable?recipientPickerHTML('rTarget',targets,recipients,true):`<div class="readonly-box">${esc(requestRecipientLabel(r))}</div>`}</div>
    <div class="form-field"><label>요청사항</label><textarea class="textarea" id="rContent" ${editable?'':'disabled'}>${esc(r.content)}</textarea></div>
    <div class="form-grid"><div class="form-field"><label>요청일</label><input type="date" class="input" id="rRequestedAt" value="${r.requestedAt||today()}" ${editable?'':'disabled'}></div><div class="form-field"><label>회신기한</label><input type="date" class="input" id="rDue" value="${r.due||''}" ${editable?'':'disabled'}></div></div>
    <div class="form-grid"><div class="form-field"><label>관련 진행항목</label><select class="select" id="rAction" ${editable?'':'disabled'}><option value="">미연결</option>${actionOptions}</select></div><div class="form-field"><label>상태</label><select class="select" id="rStatus" ${editable?'':'disabled'}>${REQUEST_STATUS.map(s=>`<option ${s===requestLiveStatus(r)?'selected':''}>${s}</option>`).join('')}</select></div></div>
    ${!isNew?`<div class="drawer-section-divider"><span>기관별 회신</span></div>${adminMode?adminRequestResponseBlocks(r):requestRecipients(r).map(name=>{const resp=requestResponse(r,name);return `<div class="readonly-response"><strong>${esc(name)}</strong><p>${esc(resp.text||'회신 대기')}</p>${resp.date?`<small>${fmtDate(resp.date)}</small>`:''}</div>`}).join('')}`:''}
    <div class="drawer-actions">${!isNew&&canDeleteRequest(r)?'<button class="btn danger" id="deleteReq">요청 삭제</button>':''}<button class="btn secondary" id="closeReq">닫기</button>${editable?'<button class="btn primary" id="saveReq">저장</button>':''}</div>`);
  document.getElementById('closeReq').onclick=closeDrawer;if(editable)bindRecipientPicker('rTarget');
  document.querySelectorAll('[data-go-action]').forEach(b=>b.onclick=()=>{const aid=b.dataset.goAction;closeDrawer();openAction(aid);});
  document.querySelectorAll('[data-save-response]').forEach(btn=>btn.onclick=async()=>{const block=btn.closest('[data-admin-response]'),name=btn.dataset.saveResponse;try{await adminSetRequestResponseRemote(r.id,name,block.querySelector('[data-response-text]').value.trim(),block.querySelector('[data-response-date]').value,block.querySelector('[data-response-confirm]').value.trim(),false);closeDrawer();render();toast('회신 내용을 저장했습니다.');}catch(e){alert(e.message||'저장 실패');}});
  document.querySelectorAll('[data-clear-response]').forEach(btn=>btn.onclick=async()=>{if(!confirm(`${btn.dataset.clearResponse} 회신을 삭제하시겠습니까?`))return;try{await adminSetRequestResponseRemote(r.id,btn.dataset.clearResponse,'','','',true);closeDrawer();render();toast('회신을 삭제했습니다.');}catch(e){alert(e.message||'삭제 실패');}});
  if(document.getElementById('deleteReq'))document.getElementById('deleteReq').onclick=async()=>{if(!confirm('이 요청을 삭제하시겠습니까?'))return;try{await portalDeleteRequestRemote(r.id);closeDrawer();render();toast('요청을 삭제했습니다.');}catch(e){alert(e.message||'삭제할 수 없습니다.');}};
  if(document.getElementById('saveReq'))document.getElementById('saveReq').onclick=async()=>{
    const title=document.getElementById('rTitle').value.trim(),content=document.getElementById('rContent').value.trim(),selected=selectedRecipients('rTarget');if(!title||!content){alert('요청 제목과 내용을 입력해 주십시오.');return;}if(!selected.length){alert('수신기관을 선택해 주십시오.');return;}
    r.title=title;r.content=content;r.toInstitutions=selected;r.to=selected[0]||'';r.requestedAt=document.getElementById('rRequestedAt').value||today();r.due=document.getElementById('rDue').value;r.relatedAction=document.getElementById('rAction').value;r.status=document.getElementById('rStatus').value;
    try{if(isNew)await portalCreateRequestRemote(r);else await portalUpdateRequestRemote(r);closeDrawer();render();toast(isNew?'요청을 등록했습니다.':'요청을 수정했습니다.');}catch(e){alert(e.message||'저장할 수 없습니다.');}
  };
}

function openMemo(id,defaultInstitution=''){
  let m=id?(state.memos||[]).find(x=>x.id===id):null;const isNew=!m;
  if(!m)m={id:'',title:'',institution:profileInstitution()||defaultInstitution||'',createdByInstitution:profileInstitution()||defaultInstitution||'',relatedAction:'',status:'진행',replyLocked:false,messages:[]};
  const locked=!isNew&&memoLocked(m);const editable=isNew||canEditMemo(m);const msgs=m.messages||[];const first=msgs[0]||{};
  const messages=msgs.map((msg,idx)=>{const canEdit=canEditMemoMessage(m,msg,idx)&&idx>0;return `<div class="message-item ${msg.authorInstitution==='정션메드'?'pm-message':''}" data-message-id="${esc(msg.id||'')}"><div class="message-meta"><strong>${esc(msg.authorInstitution||'-')}</strong><span>${msg.date?fmtDate(msg.date):'-'}</span></div><p>${esc(msg.text||'')}</p>${canEdit?`<div class="message-actions"><button type="button" class="text-btn" data-edit-message="${esc(msg.id)}">수정</button><button type="button" class="text-btn danger-text" data-delete-message="${esc(msg.id)}">삭제</button></div>`:''}</div>`}).join('')||'<div class="empty compact">등록된 내용이 없습니다.</div>';
  const actionOptions=state.actions.filter(a=>a.active!==false).map(a=>`<option value="${esc(a.id)}" ${a.id===m.relatedAction?'selected':''}>${esc(actionLabel(a))}</option>`).join('');
  openDrawer(isNew?'NEW MEMO':m.id,isNew?'협의사항 작성':m.title,`
    ${locked?'<div class="locked-banner"><strong>답변 등록 후 잠금</strong><span>답변이 달린 원문은 수정·삭제할 수 없습니다.</span></div>':''}
    ${m.relatedAction?`<div class="linked-action-banner"><span>관련 진행항목</span>${relatedActionHTML(m.relatedAction)}</div>`:''}
    <div class="form-field"><label>제목</label><input class="input" id="mTitle" value="${esc(m.title)}" ${editable?'':'disabled'}></div>
    <div class="form-grid"><div class="form-field"><label>작성기관</label><input class="input" value="${esc(memoCreator(m)||profileInstitution())}" disabled></div><div class="form-field"><label>상태</label><select class="select" id="mStatus" ${editable?'':'disabled'}><option ${m.status==='진행'?'selected':''}>진행</option><option ${m.status==='확인 완료'?'selected':''}>확인 완료</option><option ${m.status==='보류'?'selected':''}>보류</option></select></div></div>
    <div class="form-field"><label>관련 진행항목</label><select class="select" id="mAction" ${editable?'':'disabled'}><option value="">미연결</option>${actionOptions}</select></div>
    ${isNew?`<div class="form-field"><label>내용</label><textarea class="textarea response-textarea" id="mOriginalText" placeholder="협의 또는 확인할 내용을 입력"></textarea></div>`:`<div class="drawer-section-divider"><span>소통 기록</span></div><div class="message-thread">${messages}</div>${editable?`<div class="form-field"><label>원문 수정</label><textarea class="textarea response-textarea" id="mOriginalText">${esc(first.text||'')}</textarea></div>`:''}`}
    ${!isNew?`<div class="drawer-section-divider"><span>답변·추가 의견</span></div><div class="form-field"><label>${esc(profileInstitution())} 작성</label><textarea class="textarea response-textarea" id="mReplyText" placeholder="답변 또는 추가 협의 내용을 입력"></textarea></div>`:''}
    <div class="drawer-actions">${!isNew&&canDeleteMemo(m)?'<button class="btn danger" id="deleteMemo">삭제</button>':''}<button class="btn secondary" id="closeMemo">닫기</button>${editable?`<button class="btn primary" id="saveMemo">${isNew?'등록':'원문 저장'}</button>`:''}${!isNew?'<button class="btn primary" id="replyMemo">답변 등록</button>':''}</div>`);
  document.getElementById('closeMemo').onclick=closeDrawer;document.querySelectorAll('[data-go-action]').forEach(b=>b.onclick=()=>{const aid=b.dataset.goAction;closeDrawer();openAction(aid);});
  if(document.getElementById('deleteMemo'))document.getElementById('deleteMemo').onclick=async()=>{if(!confirm('이 협의사항을 삭제하시겠습니까?'))return;try{await portalDeleteMemoRemote(m.id);closeDrawer();render();toast('협의사항을 삭제했습니다.');}catch(e){alert(e.message||'삭제할 수 없습니다.');}};
  if(document.getElementById('saveMemo'))document.getElementById('saveMemo').onclick=async()=>{const title=document.getElementById('mTitle').value.trim(),text=document.getElementById('mOriginalText').value.trim();if(!title||!text){alert('제목과 내용을 입력해 주십시오.');return;}m.title=title;m.relatedAction=document.getElementById('mAction').value;m.status=document.getElementById('mStatus').value;try{if(isNew)await portalCreateMemoRemote(m,text);else await portalUpdateMemoRemote(m,text);closeDrawer();render();toast(isNew?'협의사항을 등록했습니다.':'원문을 수정했습니다.');}catch(e){alert(e.message||'저장할 수 없습니다.');}};
  if(document.getElementById('replyMemo'))document.getElementById('replyMemo').onclick=async()=>{const text=document.getElementById('mReplyText').value.trim();if(!text){alert('답변 내용을 입력해 주십시오.');return;}try{await portalAddMemoMessageRemote(m.id,text,today());closeDrawer();render();toast('답변을 등록했습니다.');}catch(e){alert(e.message||'답변 등록에 실패했습니다.');}};
  document.querySelectorAll('[data-edit-message]').forEach(btn=>btn.onclick=()=>{const msg=(m.messages||[]).find(x=>x.id===btn.dataset.editMessage);if(!msg)return;const text=prompt('답변 내용을 수정합니다.',msg.text||'');if(text===null||!text.trim())return;portalUpdateMemoMessageRemote(m.id,msg.id,text.trim(),msg.date||today()).then(()=>{closeDrawer();render();toast('답변을 수정했습니다.');}).catch(e=>alert(e.message||'수정할 수 없습니다.'));});
  document.querySelectorAll('[data-delete-message]').forEach(btn=>btn.onclick=()=>{if(!confirm('이 답변을 삭제하시겠습니까?'))return;portalDeleteMemoMessageRemote(m.id,btn.dataset.deleteMessage).then(()=>{closeDrawer();render();toast('답변을 삭제했습니다.');}).catch(e=>alert(e.message||'삭제할 수 없습니다.'));});
}

function nextPortalRequestId(){return 'REQ-LOCAL-'+Date.now();}
function openInstitutionNewRequest(institution){
  if(profileInstitution()!==institution){alert('요청은 로그인한 소속기관 명의로만 등록할 수 있습니다.');return;}
  const targets=PORTAL_ORDER.filter(name=>name!==institution),initial=institution==='정션메드'?[]:['정션메드'];
  const related=state.actions.filter(a=>a.active!==false&&actionTouchesInstitution(a,institution));
  openDrawer('NEW REQUEST','요청 보내기',`<div class="public-drawer-intro"><strong>${esc(institution)}</strong><p>필요한 확인·협조사항을 전달합니다.</p></div><div class="form-field"><label>수신기관</label>${recipientPickerHTML('publicReqTarget',targets,initial,true)}</div><div class="form-field"><label>요청 제목</label><input class="input" id="publicReqTitle"></div><div class="form-field"><label>요청 내용</label><textarea class="textarea response-textarea" id="publicReqContent"></textarea></div><div class="form-grid"><div class="form-field"><label>요청일</label><input type="date" class="input" id="publicReqDate" value="${today()}"></div><div class="form-field"><label>회신 희망일</label><input type="date" class="input" id="publicReqDue"></div></div><div class="form-field"><label>관련 진행항목</label><select class="select" id="publicReqAction"><option value="">미연결</option>${related.map(a=>`<option value="${esc(a.id)}">${esc(actionLabel(a))}</option>`).join('')}</select></div><div class="drawer-actions"><button class="btn secondary" id="publicNewReqCancel">취소</button><button class="btn primary" id="publicNewReqSave">요청 등록</button></div>`);
  document.getElementById('publicNewReqCancel').onclick=closeDrawer;bindRecipientPicker('publicReqTarget');
  document.getElementById('publicNewReqSave').onclick=async()=>{const title=document.getElementById('publicReqTitle').value.trim(),content=document.getElementById('publicReqContent').value.trim(),recipients=selectedRecipients('publicReqTarget');if(!title||!content){alert('요청 제목과 내용을 입력해 주십시오.');return;}if(!recipients.length){alert('수신기관을 선택해 주십시오.');return;}const r={title,from:institution,toInstitutions:recipients,content,requestedAt:document.getElementById('publicReqDate').value||today(),due:document.getElementById('publicReqDue').value,relatedAction:document.getElementById('publicReqAction').value,status:'요청'};try{await portalCreateRequestRemote(r);closeDrawer();portalRequestView='sent';render();toast('요청을 전달했습니다.');}catch(e){alert(e.message||'요청 저장에 실패했습니다.');}};
}
function openInstitutionRequest(id,viewInstitution){
  const r=state.requests.find(x=>x.id===id);if(!r)return;const mine=profileInstitution();const canReply=requestIncludesRecipient(r,mine);const resp=requestResponse(r,mine);const canEditSent=r.from===mine&&!requestLocked(r);
  openDrawer('REQUEST',r.title,`${r.relatedAction?`<div class="linked-action-banner"><span>관련 진행항목</span>${relatedActionHTML(r.relatedAction)}</div>`:''}<div class="public-drawer-readonly"><span>요청사항</span><p>${esc(r.content||'')}</p><div><strong>요청기관</strong> ${esc(r.from||'-')}</div><div><strong>수신기관</strong> ${esc(requestRecipientLabel(r))}</div><div><strong>회신기한</strong> ${r.due?fmtDate(r.due):'미정'}</div></div>${requestRecipients(r).map(name=>{const rr=requestResponse(r,name);return `<div class="readonly-response"><strong>${esc(name)} 회신</strong><p>${esc(rr.text||'회신 대기')}</p>${rr.date?`<small>${fmtDate(rr.date)}</small>`:''}</div>`}).join('')}${canReply?`<div class="drawer-section-divider"><span>${esc(mine)} 회신 작성</span></div><div class="form-field"><label>회신내용</label><textarea class="textarea response-textarea" id="publicResponse">${esc(resp.text||'')}</textarea></div><div class="form-field"><label>회신일</label><input type="date" class="input" id="publicResponseDate" value="${resp.date||today()}"></div>`:''}<div class="drawer-actions">${canEditSent?'<button class="btn secondary" id="editOwnRequest">요청 수정</button><button class="btn danger" id="deleteOwnRequest">요청 삭제</button>':''}<button class="btn secondary" id="publicReqCancel">닫기</button>${canReply?'<button class="btn primary" id="publicReqSave">회신 저장</button>':''}${canReply&&resp.text?'<button class="btn danger" id="publicReqDeleteReply">내 회신 삭제</button>':''}</div>`);
  document.getElementById('publicReqCancel').onclick=closeDrawer;document.querySelectorAll('[data-go-action]').forEach(b=>b.onclick=()=>{const aid=b.dataset.goAction;closeDrawer();openAction(aid);});
  if(document.getElementById('editOwnRequest'))document.getElementById('editOwnRequest').onclick=()=>{closeDrawer();openRequest(r.id);};
  if(document.getElementById('deleteOwnRequest'))document.getElementById('deleteOwnRequest').onclick=async()=>{if(!confirm('요청을 삭제하시겠습니까?'))return;try{await portalDeleteRequestRemote(r.id);closeDrawer();render();}catch(e){alert(e.message||'삭제할 수 없습니다.');}};
  if(document.getElementById('publicReqSave'))document.getElementById('publicReqSave').onclick=async()=>{const text=document.getElementById('publicResponse').value.trim();if(!text){alert('회신내용을 입력해 주십시오.');return;}r.responses=r.responses||{};r.responses[mine]={...resp,text,date:document.getElementById('publicResponseDate').value||today()};try{await portalReplyRequestRemote(r);closeDrawer();render();toast('회신을 저장했습니다.');}catch(e){alert(e.message||'회신 저장에 실패했습니다.');}};
  if(document.getElementById('publicReqDeleteReply'))document.getElementById('publicReqDeleteReply').onclick=async()=>{if(!confirm('내 회신을 삭제하시겠습니까?'))return;try{await portalDeleteRequestResponseRemote(r.id);closeDrawer();render();toast('회신을 삭제했습니다.');}catch(e){alert(e.message||'삭제할 수 없습니다.');}};
}
function openInstitutionMemo(id,institution){
  if(!id&&profileInstitution()!==institution){alert('협의사항은 로그인한 소속기관 명의로만 작성할 수 있습니다.');return;}
  openMemo(id,institution);
}

function openAuthSupport(title,bodyHTML){
  let bg=document.getElementById('authSupportBackdrop');
  if(!bg){bg=document.createElement('div');bg.id='authSupportBackdrop';bg.className='auth-support-backdrop';bg.innerHTML='<div class="auth-support-card"><div class="auth-support-head"><h2 id="authSupportTitle"></h2><button type="button" class="icon-btn" id="authSupportClose">×</button></div><div id="authSupportBody"></div></div>';document.body.appendChild(bg);document.getElementById('authSupportClose').onclick=closeAuthSupport;bg.onclick=e=>{if(e.target===bg)closeAuthSupport();};}
  document.getElementById('authSupportTitle').textContent=title;document.getElementById('authSupportBody').innerHTML=bodyHTML;bg.classList.add('show');
}
function closeAuthSupport(){document.getElementById('authSupportBackdrop')?.classList.remove('show');}
async function openBootstrapAdmin(){
  try{const st=await callUserAdminPublic('bootstrap_status');if(!st.needs_bootstrap){alert('최초 관리자 설정이 이미 완료되어 있습니다. 기존 관리자 계정으로 로그인해 주십시오.');return;}}
  catch(e){alert('관리자 설정 기능을 확인할 수 없습니다. ax-user-admin Edge Function 배포 상태를 확인해 주십시오.');return;}
  openAuthSupport('최초 관리자 설정',`<p class="auth-support-desc">최초 1회만 사용합니다. 생성 후 이 기능은 자동으로 잠깁니다.</p><label class="login-field"><span>관리자명</span><input class="input" id="bootstrapName" value="정션메드 관리자"></label><label class="login-field"><span>로그인 ID</span><input class="input" id="bootstrapLogin" placeholder="예: axadmin"></label><label class="login-field"><span>비밀번호</span><input type="password" class="input" id="bootstrapPassword" placeholder="8자 이상"></label><label class="login-field"><span>비밀번호 확인</span><input type="password" class="input" id="bootstrapPassword2"></label><div class="login-error" id="bootstrapError"></div><button class="btn primary login-submit" id="bootstrapSave">관리자 계정 생성</button>`);
  document.getElementById('bootstrapSave').onclick=async()=>{const name=document.getElementById('bootstrapName').value.trim(),login_id=document.getElementById('bootstrapLogin').value.trim(),p1=document.getElementById('bootstrapPassword').value,p2=document.getElementById('bootstrapPassword2').value,err=document.getElementById('bootstrapError');if(!login_id||!p1){err.textContent='로그인 ID와 비밀번호를 입력해 주십시오.';return;}if(p1!==p2){err.textContent='비밀번호 확인이 일치하지 않습니다.';return;}err.textContent='계정 생성 중...';try{await callUserAdminPublic('bootstrap_create',{display_name:name,login_id,password:p1});closeAuthSupport();document.getElementById('loginId').value=login_id;document.getElementById('loginPassword').value='';document.getElementById('loginError').textContent='관리자 계정이 생성되었습니다. 설정한 비밀번호로 로그인해 주십시오.';}catch(e){err.textContent=e.message||'관리자 생성에 실패했습니다.';}};
}
function openForgotPassword(){
  openAuthSupport('비밀번호 초기화 요청',`<p class="auth-support-desc">로그인 ID를 입력하면 관리자 화면에 초기화 요청이 전달됩니다. 관리자가 임시 비밀번호를 설정한 뒤 별도로 전달합니다.</p><label class="login-field"><span>로그인 ID</span><input class="input" id="forgotLogin" value="${esc(document.getElementById('loginId')?.value||'')}" placeholder="로그인 ID"></label><div class="login-error" id="forgotError"></div><button class="btn primary login-submit" id="forgotSubmit">초기화 요청</button>`);
  document.getElementById('forgotSubmit').onclick=async()=>{const login_id=document.getElementById('forgotLogin').value.trim(),err=document.getElementById('forgotError');if(!login_id){err.textContent='로그인 ID를 입력해 주십시오.';return;}err.textContent='요청 중...';try{const out=await callUserAdminPublic('request_password_reset',{login_id});err.style.color='#536b57';err.textContent=out.message||'초기화 요청을 전달했습니다.';}catch(e){err.textContent=e.message||'요청에 실패했습니다.';}};
}
function openMyAccount(forceChange=false){
  if(!currentProfile)return;openDrawer('ACCOUNT',forceChange?'초기 비밀번호 변경':'내 계정',`<div class="account-summary"><strong>${esc(currentProfile.display_name)}</strong><span>${esc(currentProfile.institution)} · ${esc(currentProfile.login_id)}${currentProfile.role==='admin'?' · 관리자':''}</span></div><div class="form-field"><label>새 비밀번호</label><input type="password" class="input" id="myPassword1" placeholder="8자 이상"></div><div class="form-field"><label>새 비밀번호 확인</label><input type="password" class="input" id="myPassword2"></div><div class="form-help">현재 비밀번호는 화면이나 DB에 표시되지 않습니다. 새 비밀번호를 저장하면 즉시 적용됩니다.</div><div class="drawer-actions">${forceChange?'':'<button class="btn secondary" id="myAccountCancel">취소</button>'}<button class="btn primary" id="myAccountSave">비밀번호 변경</button></div>`);if(document.getElementById('myAccountCancel'))document.getElementById('myAccountCancel').onclick=closeDrawer;document.getElementById('myAccountSave').onclick=async()=>{const p1=document.getElementById('myPassword1').value,p2=document.getElementById('myPassword2').value;if(p1!==p2){alert('비밀번호 확인이 일치하지 않습니다.');return;}try{await changeOwnPassword(p1);closeDrawer();toast('비밀번호를 변경했습니다.');}catch(e){alert(e.message||'비밀번호 변경에 실패했습니다.');}};
}

function showLogin(force=false,message=''){
  const bg=document.getElementById('loginBackdrop');if(!bg)return;bg.classList.add('show');bg.setAttribute('aria-hidden','false');document.getElementById('loginError').textContent=message||'';if(force)document.body.classList.add('login-required');setTimeout(()=>document.getElementById('loginId')?.focus(),50);
}
function hideLogin(){const bg=document.getElementById('loginBackdrop');if(!bg)return;bg.classList.remove('show');bg.setAttribute('aria-hidden','true');document.body.classList.remove('login-required');}
async function submitLogin(){
  const loginId=document.getElementById('loginId').value.trim(),password=document.getElementById('loginPassword').value;const err=document.getElementById('loginError');if(!loginId||!password){err.textContent='로그인 ID와 비밀번호를 입력해 주십시오.';return;}err.textContent='로그인 확인 중...';
  try{await signIn(loginId,password);document.getElementById('loginPassword').value='';}catch(e){console.error(e);err.textContent='로그인 ID 또는 비밀번호를 확인해 주십시오.';}
}
function enterAdmin(){if(currentProfile?.role!=='admin')return;sessionStorage.setItem('ax-admin-mode-v22','1');isAdmin=true;currentView='dashboard';render();window.scrollTo({top:0,behavior:'smooth'});}
function exitAdmin(){sessionStorage.removeItem('ax-admin-mode-v22');isAdmin=false;currentView='portal';render();window.scrollTo({top:0,behavior:'smooth'});}


function openChangelog(){
  const items=[
    ['v24.3','2026-09-01','하단 전체 항목을 반응형 카드형으로 정리하고 고유번호 태그 폭을 내용 기준으로 조정. 사례비 체크 표시를 적색으로 구분.'],
    ['v24.2','2026-09-01','실증기관별 사례비 지급 여부 체크 기능 추가. 사례비는 실증 진척률 계산에서 제외.'],
    ['v24.1','2026-09-01','신규 설치 전용 패키지로 통합하고 Supabase 신규 프로젝트 연결값, 설치·운영 매뉴얼 정비.'],
    ['v23','2026-08-31','실증관리 통합: 실증기관·책임기관·목표인원, 4단계 완료인원, 단계별 25% 진척도, 실증 관리 권한 적용.'],
    ['v22','2026-08-31','최초 관리자 생성, 비밀번호 변경·초기화 요청, 사용자 계정 복구 흐름 추가.'],
    ['v21','2026-08-31','Supabase Auth·RLS 기반 보안 구조, 기관별 계정·권한, 답변 후 원문 잠금, 진행항목 고유번호 및 변경이력 도입.'],
    ['v20','2026-08-31','요청·회신 관리 강화: 전체/받은/보낸 요청, 복수 수신기관, 관리자 수정·삭제, 기관별 회신 관리.'],
    ['v19','2026-08-31','기관이 직접 요청을 생성하고 회신·협의사항을 주고받는 협업 소통 기능 추가.'],
    ['v18','2026-08-31','Supabase 공유DB 연동, 기준일정/현재일정 분리, 세부항목 추가·복제·비활성화 등 운영 편집 기능 추가.'],
    ['v17','2026-08-31','관리자 대시보드의 글자·박스·컬럼 비율을 재조정하고 반응형 레이아웃 개선.'],
    ['v16','2026-08-31','관리자 모드 전반의 글자 크기와 줄간격을 확대해 가독성 개선.'],
    ['v15','2026-08-31','기관 표기를 경복대학교로 통일하고 기존 저장 데이터도 자동 변환.'],
    ['v14','2026-08-31','관리자 화면의 색상과 카드 밀도를 낮춰 시각 피로도 개선.'],
    ['v13','2026-08-31','전체 항목을 필터 가능한 얇은 목록으로 변경하고 상태 태그·상세 이동 기능 추가.'],
    ['v12','2026-08-31','기한경과·마감임박·회신필요를 단일 버튼형으로 정리하고 전체 항목 목록을 간결화.'],
    ['v11','2026-08-31','주요 진행사항에 D-day와 단계 진행선 시각화를 적용.'],
    ['v10','2026-08-31','상태 요약 수치를 클릭 가능한 링크로 전환하고 기관 선택 박스·초기 시각화 추가.'],
    ['v9','2026-08-31','기관 화면을 현재 주요 진행사항→협업 요청→전체 진행항목→상세 현황 구조로 정리.'],
    ['v8','2026-08-31','기관별 상황판 중심으로 단순화하고 색상·여백·모바일 반응형을 조정.'],
    ['v7','2026-08-31','기관용과 관리자용 화면을 분리하고 기관별 직접 링크 및 관리자 진입 구조 도입.'],
    ['v6','2026-08-31','완료기준 장식을 정리하고 성과목표의 정량지표를 완료기준에 반영.'],
    ['v5','2026-08-31','요청사항·기관 회신 및 소통 메모 기능 추가.'],
    ['v4','2026-08-31','기관 선택을 상단 탭으로 변경하고 사무적 문체·큰 글씨·완료기준 구체화.'],
    ['v3','2026-08-31','가독성 확대와 모바일 반응형 개선.'],
    ['v2','2026-08-31','기관이 현재 해야 할 일과 기한을 우선 확인하는 기관 업무판 중심 구조 도입.'],
    ['v1','2026-08-31','성과목표·기관·실행항목·요청·일정·문서를 통합한 최초 Control Tower MVP 구성.']
  ];
  const body=`<p class="changelog-note">주요 기능 변경 이력입니다. 세부 운영 데이터 변경 내용은 시스템 변경이력(Audit Log)에서 별도로 관리합니다.</p><div class="changelog-list">${items.map(([v,d,t])=>`<div class="changelog-item"><div class="changelog-head"><span class="changelog-version">${v}</span><span class="changelog-date">${d}</span></div><p>${t}</p></div>`).join('')}</div>`;
  openDrawer('JUNCTIONMED','버전 변경 이력',body);
}

function exportJson(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='AX_Sprint_Control_Tower_backup.json';a.click();URL.revokeObjectURL(a.href);}
document.getElementById('importInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{state=normalizeFlexibleActions(renameLegacyInstitution(JSON.parse(reader.result)));saveState();render();toast('백업 데이터를 불러왔습니다.');}catch(err){alert('올바른 JSON 백업 파일이 아닙니다.');}};reader.readAsText(f);e.target.value='';});
document.getElementById('drawerClose').onclick=closeDrawer;
document.getElementById('drawerBackdrop').onclick=closeDrawer;
document.getElementById('quickAddBtn').onclick=()=>{if(isAdmin)openAction();};
document.getElementById('pmUpdateBtn').onclick=()=>{if(isAdmin){currentView='requests';render();}};
document.getElementById('adminAccessBtn').onclick=()=>{if(currentProfile?.role!=='admin')return;if(isAdmin)exitAdmin();else enterAdmin();};
document.getElementById('accountBtn').onclick=openMyAccount;
document.getElementById('logoutBtn').onclick=()=>signOut();
document.getElementById('loginSubmit').onclick=submitLogin;
document.getElementById('forgotPasswordBtn').onclick=openForgotPassword;
document.getElementById('bootstrapAdminBtn').onclick=openBootstrapAdmin;
document.getElementById('changelogBtn').onclick=openChangelog;
['loginId','loginPassword'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')submitLogin();}));
render();
initSupabaseSync();
document.getElementById('syncStatus').onclick=()=>{if(currentProfile)refreshFromRemote(false);};
setInterval(()=>{if(supabaseReady&&currentProfile&&!isAdmin)refreshFromRemote(true);},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&supabaseReady&&currentProfile&&!isAdmin)refreshFromRemote(true);});
