#!/bin/bash
set -e
echo "[DEPLOY] Phase2 Epic1 Start"
TS=$(date +%Y%m%d_%H%M%S)

# 1. Backup
cp /www/xuewaiyu-backend/src/server/controllers/aiController.js /www/xuewaiyu-backend/src/server/controllers/aiController.js.bak.$TS 2>/dev/null
cp /www/xuewaiyu-backend/src/server/routes/ai.js /www/xuewaiyu-backend/src/server/routes/ai.js.bak.$TS 2>/dev/null
cp /www/xuewaiyu-backend/src/services/aiGateway.js /www/xuewaiyu-backend/src/services/aiGateway.js.bak.$TS 2>/dev/null
cp /www/xuewaiyu/chat.html /www/xuewaiyu/chat.html.bak.$TS 2>/dev/null
cp /www/xuewaiyu/home.html /www/xuewaiyu/home.html.bak.$TS 2>/dev/null
cp /www/xuewaiyu/profile.html /www/xuewaiyu/profile.html.bak.$TS 2>/dev/null
echo "[DEPLOY] Backup done"

# 2. Install axios
cd /www/xuewaiyu-backend && npm install axios --save 2>/dev/null || true
echo "[DEPLOY] axios installed"

# 3. Create aiQuotaService.js if not exists
if [ ! -f /www/xuewaiyu-backend/src/services/aiQuotaService.js ]; then
cat > /www/xuewaiyu-backend/src/services/aiQuotaService.js << 'EOF'
const redis=require('../config/redis');const prisma=require('../config/database');const logger=require('../../utils/logger');
const FREE_QUOTA={conversation:5,correction:3};
const MEMBER_QUOTA={free:{conversation:5,correction:3},basic:{conversation:20,correction:20},premium:{conversation:50,correction:50},flagship:{conversation:100,correction:100}};
function getToday(){return new Date().toISOString().slice(0,10);}
function getResetAt(){const d=new Date();d.setDate(d.getDate()+1);d.setHours(0,0,0,0);return d.toISOString();}
function buildKey(userId,date,type){return'ailos:quota:'+userId+':'+date+':'+type;}
function getQuotaLimit(user,type){if(user&&user.membershipLevel&&MEMBER_QUOTA[user.membershipLevel]){return MEMBER_QUOTA[user.membershipLevel][type]||FREE_QUOTA[type];}return FREE_QUOTA[type];}
async function checkQuota(userId,type){try{const today=getToday();const key=buildKey(userId,today,type);const usedStr=await redis.get(key);const used=usedStr?parseInt(usedStr,10):0;let user=null;try{user=await prisma.user.findUnique({where:{id:userId},select:{membershipLevel:true}});}catch(e){}const total=getQuotaLimit(user,type);const remaining=Math.max(0,total-used);return{allowed:remaining>0,remaining,total,resetAt:getResetAt()};}catch(err){logger.error('checkQuota error:',err.message);return{allowed:true,remaining:1,total:1,resetAt:getResetAt()};}}
async function consumeQuota(userId,type){try{const today=getToday();const key=buildKey(userId,today,type);const used=await redis.incr(key);if(used===1){const now=new Date();const eod=new Date(now);eod.setHours(23,59,59,999);const ttl=Math.ceil((eod.getTime()-now.getTime())/1000);await redis.expire(key,ttl);}let user=null;try{user=await prisma.user.findUnique({where:{id:userId},select:{membershipLevel:true}});}catch(e){}const total=getQuotaLimit(user,type);return{success:true,used,remaining:Math.max(0,total-used),total};}catch(err){logger.error('consumeQuota error:',err.message);return{success:false,used:0,remaining:0,total:0};}}
async function getQuota(userId){try{const today=getToday();let user=null;try{user=await prisma.user.findUnique({where:{id:userId},select:{membershipLevel:true}});}catch(e){}const types=['conversation','correction'];const result={userId,membershipLevel:user&&user.membershipLevel?user.membershipLevel:'free',resetAt:getResetAt(),quotas:{}};for(const type of types){const key=buildKey(userId,today,type);const usedStr=await redis.get(key);const used=usedStr?parseInt(usedStr,10):0;const total=getQuotaLimit(user,type);result.quotas[type]={used,total,remaining:Math.max(0,total-used),allowed:(total-used)>0};}return result;}catch(err){logger.error('getQuota error:',err.message);return{userId,membershipLevel:'free',resetAt:getResetAt(),quotas:{conversation:{used:0,total:5,remaining:5,allowed:true},correction:{used:0,total:3,remaining:3,allowed:true}}};}}
module.exports={checkQuota,consumeQuota,getQuota,FREE_QUOTA,MEMBER_QUOTA};
EOF
echo "[DEPLOY] aiQuotaService.js created"
else
echo "[DEPLOY] aiQuotaService.js already exists"
fi

# 4. Patch aiController.js
python3 << 'PYEOF'
import re
p='/www/xuewaiyu-backend/src/server/controllers/aiController.js'
with open(p,'r',encoding='utf-8') as f:c=f.read()

# Add imports
if 'aiQuotaService' not in c:
    c=c.replace("const logger = require('../../utils/logger');","const logger = require('../../utils/logger');\nconst quotaService = require('../../services/aiQuotaService');\nconst prisma = require('../../config/database');")

# Add quota check before userInput
if 'Phase2: Daily AI quota check' not in c:
    qc="""    // Phase2: Daily AI quota check
    const quota = await quotaService.checkQuota(req.userId, 'conversation');
    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: 'AI-CONNECTION-PENDING',
        code: 'QUOTA_EXCEEDED',
        message: '今日AI额度已用完，请在明天00:00后重试，或升级会员获取更多额度',
        message_en: 'Daily AI quota exhausted. Please try again after 00:00 or upgrade your membership.',
        quota,
      });
    }

"""
    c=c.replace("    if (!userInput || !userInput.trim()) {",qc+"    if (!userInput || !userInput.trim()) {")

# Add quota consume + cost log
if 'Phase2: Consume quota' not in c:
    con="""
    // Phase2: Consume quota and save cost log
    await quotaService.consumeQuota(req.userId, 'conversation');
    try {
      const requestId = 'req_' + Date.now() + '_' + str(Math.random())[2:11];
      const inputTokens = result.usage && result.usage.promptTokens ? result.usage.promptTokens : (result.usage && result.usage.prompt_tokens ? result.usage.prompt_tokens : 0);
      const outputTokens = result.usage && result.usage.completionTokens ? result.usage.completionTokens : (result.usage && result.usage.completion_tokens ? result.usage.completion_tokens : 0);
      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = ((inputTokens * 0.003) + (outputTokens * 0.006)) / 1000;
      await prisma.aiRequestLog.create({
        data: {
          userId: parseInt(req.userId, 10),
          module: 'conversation',
          promptId: 'conversation_default_v1',
          tokenUsed: totalTokens,
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          estimatedCost: estimatedCost,
          timestamp: new Date(),
          status: 'success',
          requestId: requestId,
          scene: 'conversation',
          requestType: 'conversation',
          model: result.model || 'hy3',
          latencyMs: 0,
          success: true,
        },
      });
    } catch (logErr) {
      logger.warn('AI cost log write failed:', logErr.message);
    }
"""
    pat=r'(\s+res\.json\(\{\s*success:\s*true,)'
    c=re.sub(pat,con+r'\1',c,count=1)

# Add getQuota function
if 'async function getQuota' not in c:
    gq="""
// Phase2: Get user AI quota
async function getQuota(req, res) {
  try {
    const quota = await quotaService.getQuota(req.userId);
    res.json({ success: true, data: quota });
  } catch (err) {
    logger.error('getQuota error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get quota', message: err.message });
  }
}
"""
    if 'module.exports = { chat, getStats' in c:
        c=c.replace('module.exports = { chat, getStats };',gq+'\nmodule.exports = { chat, getStats, getQuota };')
    elif 'module.exports' in c and 'getQuota' not in c:
        c=c.replace('module.exports = {','module.exports = {\n  getQuota,')

with open(p,'w',encoding='utf-8') as f:f.write(c)
print('[DEPLOY] aiController.js patched')
PYEOF

# 5. Patch ai.js routes
python3 << 'PYEOF'
p='/www/xuewaiyu-backend/src/server/routes/ai.js'
with open(p,'r',encoding='utf-8') as f:c=f.read()
if '/quota' not in c:
    if "router.get('/stats'" in c:
        c=c.replace("router.get('/stats', authenticate, getStats);","router.get('/stats', authenticate, getStats);\nrouter.get('/quota', authenticate, aiController.getQuota);")
    elif 'module.exports' in c:
        c=c.replace('module.exports',"router.get('/quota', authenticate, aiController.getQuota);\n\nmodule.exports")
    with open(p,'w',encoding='utf-8') as f:f.write(c)
    print('[DEPLOY] ai.js routes patched')
else:
    print('[DEPLOY] ai.js already has /quota')
PYEOF

# 6. Patch aiGateway.js
python3 << 'PYEOF'
p='/www/xuewaiyu-backend/src/services/aiGateway.js'
with open(p,'r',encoding='utf-8') as f:c=f.read()

if 'const axios' not in c:
    if 'const logger' in c:
        c=c.replace("const logger = require('../utils/logger');","const logger = require('../utils/logger');\nconst axios = require('axios');\nconst config = require('../../config');")
    else:
        c="const axios = require('axios');\nconst config = require('../../config');\n"+c

marker='  async _callAI('
idx=c.find(marker)
if idx>=0:
    start=idx
    brace=c.find('{',idx)
    depth=0
    end=brace
    for i in range(brace,len(c)):
        if c[i]=='{':depth+=1
        elif c[i]=='}':
            depth-=1
            if depth==0:
                end=i+1
                break
    new_m="""  async _callAI(messages, options = {}) {
    const apiUrl = (config.hunyuan && config.hunyuan.apiUrl) || 'https://tokenhub.tencentmaas.com/v1/chat/completions';
    const apiKey = (config.hunyuan && config.hunyuan.apiKey) || process.env.HUNYUAN_API_KEY;
    const model = (config.hunyuan && config.hunyuan.model) || 'hunyuan-lite';
    const { temperature = 0.7, maxTokens = 2048, stream = false } = options;
    if (!apiKey) { throw new Error('Hunyuan API key not configured'); }
    try {
      const response = await axios({ method: 'POST', url: apiUrl, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, data: { model, messages, temperature, max_tokens: maxTokens, stream }, timeout: 30000, responseType: 'json' });
      const data = response.data;
      const usage = data.usage || {};
      return { success: true, content: data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || '' : '', model: data.model || model, usage: { promptTokens: usage.prompt_tokens || 0, completionTokens: usage.completion_tokens || 0, totalTokens: usage.total_tokens || 0 }, raw: data };
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') { throw new Error('AI-CONNECTION-PENDING: Request timeout'); }
      if (error.response) { throw new Error('AI-CONNECTION-PENDING: Upstream ' + str(error.response.status)); }
      throw new Error('AI-CONNECTION-PENDING: ' + error.message);
    }
  }"""
    c=c[:start]+new_m+c[end:]
    with open(p,'w',encoding='utf-8') as f:f.write(c)
    print('[DEPLOY] aiGateway.js patched')
else:
    print('[DEPLOY] aiGateway.js already patched')
PYEOF

# 7. Patch chat.html
python3 << 'PYEOF'
# coding: utf-8
p='/www/xuewaiyu/chat.html'
with open(p,'r',encoding='utf-8') as f:c=f.read()

# Add CSS
if 'quota-bar' not in c:
    css="""  .quota-bar{display:flex;align-items:center;gap:10px;padding:8px 14px;margin-top:8px;background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius-sm);flex-shrink:0}
  .quota-text{font-size:12px;font-weight:600;color:var(--text-secondary);white-space:nowrap}
  .quota-progress{flex:1;height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden}
  .quota-fill{height:100%;border-radius:3px;background:var(--primary);transition:width .4s ease}
  .quota-fill.low{background:var(--warning)}.quota-fill.exhausted{background:var(--error)}
  .quota-warning{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;margin-top:6px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm)}
  .quota-warning.hidden{display:none}
  .btn-upgrade{padding:6px 16px;border-radius:14px;border:none;background:var(--primary);color:#fff;font-size:12px;font-weight:600;cursor:pointer}
  .toast{position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:1000;padding:12px 24px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;box-shadow:var(--shadow-md);animation:toastIn .3s ease,toastOut .3s ease 3.7s forwards}
  .toast.error{background:#FEF2F2;color:#991B1B;border:1px solid #FECACA}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  @keyframes toastOut{from{opacity:1}to{opacity:0}}
"""
    c=c.replace('</style>',css+'\n</style>')

# Add HTML
if 'quotaBar' not in c:
    html='''  <div class="quota-bar" id="quotaBar" style="display:none"><span class="quota-text" id="quotaText">今日剩余: -/- 次对话</span><div class="quota-progress"><div class="quota-fill" id="quotaFill" style="width:100%"></div></div></div>
  <div class="quota-warning hidden" id="quotaWarning"><span>额度已用完，00:00 自动重置</span><button class="btn-upgrade" onclick="window.location.href=\'/xuewaiyu/growth-center.html\'">升级会员</button></div>
'''
    if '<div id="chat-messages">' in c:
        c=c.replace('<div id="chat-messages">',html+'<div id="chat-messages">')
    elif '<div class="chat-messages">' in c:
        c=c.replace('<div class="chat-messages">',html+'<div class="chat-messages">')

# Add JS
if 'fetchQuota' not in c:
    js="""var quotaRemaining=null,quotaTotal=null;
async function fetchQuota(){var t=localStorage.getItem('yandao_token_v1');if(!t)return;try{var r=await fetch('/api/ai/quota',{headers:{'Authorization':'Bearer '+t}});if(!r.ok)return;var d=await r.json();if(d.success&&d.data){var cv=d.data.quotas.conversation;quotaRemaining=cv.remaining;quotaTotal=cv.total}else{quotaRemaining=d.remaining;quotaTotal=d.total}updateQuotaDisplay()}catch(e){}}
function updateQuotaDisplay(){var bar=document.getElementById('quotaBar'),text=document.getElementById('quotaText'),fill=document.getElementById('quotaFill'),warn=document.getElementById('quotaWarning'),btn=document.getElementById('btnSend');if(quotaRemaining===null||quotaTotal===null){if(bar)bar.style.display='none';return}if(bar)bar.style.display='flex';var pct=quotaTotal>0?(quotaRemaining/quotaTotal)*100:0;if(fill){fill.style.width=pct+'%';fill.classList.remove('low','exhausted')}if(quotaRemaining===0&&fill)fill.classList.add('exhausted');else if(pct<=20&&fill)fill.classList.add('low');if(text)text.textContent='今日剩余: '+quotaRemaining+'/'+quotaTotal+' 次对话';if(quotaRemaining===0){if(warn)warn.classList.remove('hidden');if(btn)btn.disabled=true}else{if(warn)warn.classList.add('hidden');if(btn&&typeof isSending!=='undefined'&&!isSending)btn.disabled=false}}
function showToast(text,type){var existing=document.querySelector('.toast');if(existing)existing.remove();var toast=document.createElement('div');toast.className='toast '+(type||'info');toast.textContent=text;document.body.appendChild(toast);setTimeout(function(){if(toast.parentNode)toast.remove()},4000)}
"""
    c=c.replace('async function apiCall',js+'\nasync function apiCall')

# Forward error code
if 'err.code' not in c:
    c=c.replace("var err = new Error(data.error || data.message || 'Request failed');\n        throw err;","var err = new Error(data.error || data.message || 'Request failed');\n        err.code = data.code || null;\n        throw err;")

# Patch catch block
if 'AI-CONNECTION-PENDING' not in c:
    old1="  } catch (e) {\n    removeTypingIndicator();\n    setAIStatus('disconnected');\n\n    if (e.message === 'Failed to fetch' || e.message.indexOf('NetworkError') > -1) {"
    old2="  } catch (e) {\n    removeTypingIndicator();\n    setAIStatus('disconnected');\n    if (e.message === 'Failed to fetch' || e.message.indexOf('NetworkError') > -1) {"
    newc="""  } catch (e) {
    removeTypingIndicator();
    setAIStatus('disconnected');
    var errorCode=e.code||'';
    if(errorCode==='AI-CONNECTION-PENDING'||errorCode==='AI_TIMEOUT'||errorCode==='AI_NETWORK_ERROR'||errorCode==='AI_RATE_LIMITED'||errorCode==='AI_UPSTREAM_ERROR'){
      showToast('AI服务暂时繁忙，请稍后重试 (AI-CONNECTION-PENDING)','error');
      if(typeof showBanner==='function'){showBanner('AI服务暂时繁忙，请稍后重试','error');setTimeout(function(){showBanner('','')},5000)}
    }else if(errorCode==='QUOTA_EXCEEDED'){
      quotaRemaining=0;updateQuotaDisplay();
      if(typeof showBanner==='function')showBanner('今日对话次数已用完','error');showToast('今日对话次数已用完','error');
    }else if(e.message==='Failed to fetch'||(e.message&&e.message.indexOf('NetworkError')>-1)){"""
    if old1 in c:c=c.replace(old1,newc)
    elif old2 in c:c=c.replace(old2,newc)

# Add fetchQuota to finally
if 'fetchQuota()' not in c:
    if "    document.getElementById('chatInput').focus();\n  }" in c:
        c=c.replace("    document.getElementById('chatInput').focus();\n  }","    document.getElementById('chatInput').focus();\n    fetchQuota();\n  }")

# Add fetchQuota to init
if "fetchQuota();" not in c:
    if "// Initial language check" in c:
        c=c.replace("// Initial language check","fetchQuota();\n\n  // Initial language check")
    elif "function init()" in c:
        c=c.replace("function init() {","function init() {\n  fetchQuota();")

with open(p,'w',encoding='utf-8') as f:f.write(c)
print('[DEPLOY] chat.html patched')
PYEOF

# 8. Patch home.html
python3 << 'PYEOF'
# coding: utf-8
p='/www/xuewaiyu/home.html'
with open(p,'r',encoding='utf-8') as f:c=f.read()

if 'ai-quota-card' not in c:
    css="""  .ai-quota-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px;padding:20px;color:white;margin-bottom:20px;box-shadow:0 4px 15px rgba(102,126,234,0.3)}
  .ai-quota-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .ai-quota-title{font-size:14px;font-weight:600;opacity:0.9}
  .ai-quota-icon{font-size:20px}
  .ai-quota-numbers{display:flex;align-items:baseline;gap:4px;margin-bottom:8px}
  .ai-quota-remaining{font-size:32px;font-weight:700}
  .ai-quota-total{font-size:14px;opacity:0.8}
  .ai-quota-bar{height:6px;background:rgba(255,255,255,0.25);border-radius:3px;overflow:hidden;margin-bottom:8px}
  .ai-quota-fill{height:100%;background:rgba(255,255,255,0.9);border-radius:3px;transition:width 0.5s ease}
  .ai-quota-reset{font-size:11px;opacity:0.75}
  .ai-quota-upgrade{display:inline-block;margin-top:10px;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.3);transition:all 0.2s}
  .ai-quota-upgrade:hover{background:rgba(255,255,255,0.35)}
  .ai-quota-exhausted{background:linear-gradient(135deg,#e53e3e 0%,#c53030 100%)!important}
"""
    c=c.replace('</style>',css+'\n</style>')

if 'aiQuotaCard' not in c:
    html='''  <div class="ai-quota-card" id="aiQuotaCard"><div class="ai-quota-header"><span class="ai-quota-title">今日AI额度</span><span class="ai-quota-icon">AI</span></div><div class="ai-quota-numbers"><span class="ai-quota-remaining" id="homeQuotaRemaining">-</span><span class="ai-quota-total" id="homeQuotaTotal">/ - 次对话</span></div><div class="ai-quota-bar"><div class="ai-quota-fill" id="homeQuotaFill" style="width:100%"></div></div><div class="ai-quota-reset" id="homeQuotaReset">00:00 自动重置</div><div class="ai-quota-upgrade" id="homeQuotaUpgrade" style="display:none" onclick="window.location.href=\'/xuewaiyu/growth-center.html\'">升级会员获取更多额度</div></div>
'''
    if '<div class="dashboard-content">' in c:
        c=c.replace('<div class="dashboard-content">','<div class="dashboard-content">\n'+html)
    elif '<div class="content">' in c:
        c=c.replace('<div class="content">','<div class="content">\n'+html)
    elif '<main>' in c:
        c=c.replace('<main>','<main>\n'+html)
    else:
        c=c.replace('<body>','<body>\n'+html)

if 'fetchHomeQuota' not in c:
    js="""  async function fetchHomeQuota(){var t=localStorage.getItem('yandao_token_v1');if(!t)return;try{var r=await fetch('/api/ai/quota',{headers:{'Authorization':'Bearer '+t}});if(!r.ok)return;var d=await r.json();if(!d.success||!d.data)return;var cv=d.data.quotas.conversation;var remaining=cv.remaining;var total=cv.total;var resetAt=new Date(d.data.resetAt);document.getElementById('homeQuotaRemaining').textContent=remaining;document.getElementById('homeQuotaTotal').textContent='/ '+total+' 次对话';var pct=total>0?(remaining/total)*100:0;document.getElementById('homeQuotaFill').style.width=pct+'%';var rs=resetAt.getHours().toString().padStart(2,'0')+':'+resetAt.getMinutes().toString().padStart(2,'0');document.getElementById('homeQuotaReset').textContent=rs+' 自动重置';var card=document.getElementById('aiQuotaCard');if(remaining===0){card.classList.add('ai-quota-exhausted');document.getElementById('homeQuotaUpgrade').style.display='inline-block'}else{card.classList.remove('ai-quota-exhausted');document.getElementById('homeQuotaUpgrade').style.display='none'}}catch(e){console.warn('fetchHomeQuota error:',e)}}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fetchHomeQuota)}else{fetchHomeQuota()}
"""
    if '</script>' in c:
        c=c.replace('</script>',js+'\n</script>')
    else:
        c=c.replace('</body>','<script>'+js+'\n</script>\n</body>')

with open(p,'w',encoding='utf-8') as f:f.write(c)
print('[DEPLOY] home.html patched')
PYEOF

# 9. Patch profile.html
python3 << 'PYEOF'
# coding: utf-8
p='/www/xuewaiyu/profile.html'
with open(p,'r',encoding='utf-8') as f:c=f.read()

if 'profile-quota-section' not in c:
    css="""  .profile-quota-section{background:var(--card-bg);border-radius:12px;padding:16px;margin:16px 0;border:1px solid var(--border)}
  .profile-quota-title{font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px;display:flex;align-items:center;gap:6px}
  .profile-quota-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .profile-quota-item{text-align:center;padding:10px;background:var(--bg-secondary);border-radius:8px}
  .profile-quota-value{font-size:20px;font-weight:700;color:var(--primary)}
  .profile-quota-label{font-size:11px;color:var(--text-secondary);margin-top:4px}
  .profile-quota-reset{font-size:11px;color:var(--text-secondary);margin-top:10px;text-align:center}
  .profile-quota-bar{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:8px}
  .profile-quota-fill{height:100%;background:var(--primary);border-radius:2px;transition:width 0.5s ease}
  .profile-quota-fill.low{background:var(--warning)}.profile-quota-fill.exhausted{background:var(--error)}
"""
    c=c.replace('</style>',css+'\n</style>')

if 'profileQuotaSection' not in c:
    html='''  <div class="profile-quota-section" id="profileQuotaSection"><div class="profile-quota-title"><span>AI额度</span></div><div class="profile-quota-grid"><div class="profile-quota-item"><div class="profile-quota-value" id="profileQuotaTotal">-</div><div class="profile-quota-label">今日总额度</div></div><div class="profile-quota-item"><div class="profile-quota-value" id="profileQuotaUsed">-</div><div class="profile-quota-label">已使用</div></div><div class="profile-quota-item"><div class="profile-quota-value" id="profileQuotaRemaining">-</div><div class="profile-quota-label">剩余</div></div></div><div class="profile-quota-bar"><div class="profile-quota-fill" id="profileQuotaFill" style="width:100%"></div></div><div class="profile-quota-reset" id="profileQuotaReset">下次重置: 00:00</div></div>
'''
    c=c.replace('</body>',html+'\n</body>')

if 'fetchProfileQuota' not in c:
    js="""  async function fetchProfileQuota(){var t=localStorage.getItem('yandao_token_v1');if(!t)return;try{var r=await fetch('/api/ai/quota',{headers:{'Authorization':'Bearer '+t}});if(!r.ok)return;var d=await r.json();if(!d.success||!d.data)return;var cv=d.data.quotas.conversation;var remaining=cv.remaining;var total=cv.total;var used=cv.used;var resetAt=new Date(d.data.resetAt);document.getElementById('profileQuotaTotal').textContent=total;document.getElementById('profileQuotaUsed').textContent=used;document.getElementById('profileQuotaRemaining').textContent=remaining;var pct=total>0?(remaining/total)*100:0;var fillEl=document.getElementById('profileQuotaFill');fillEl.style.width=pct+'%';fillEl.classList.remove('low','exhausted');if(remaining===0)fillEl.classList.add('exhausted');else if(pct<=20)fillEl.classList.add('low');var rs=resetAt.getHours().toString().padStart(2,'0')+':'+resetAt.getMinutes().toString().padStart(2,'0');document.getElementById('profileQuotaReset').textContent='下次重置: '+rs}catch(e){console.warn('fetchProfileQuota error:',e)}}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fetchProfileQuota)}else{fetchProfileQuota()}
"""
    if '</script>' in c:
        c=c.replace('</script>',js+'\n</script>')
    else:
        c=c.replace('</body>','<script>'+js+'\n</script>\n</body>')

with open(p,'w',encoding='utf-8') as f:f.write(c)
print('[DEPLOY] profile.html patched')
PYEOF

# 10. Restart PM2
cd /www/xuewaiyu-backend && pm2 restart xuewaiyu-backend
sleep 3
pm2 status
echo "[DEPLOY] Phase2 Epic1 Deployment Complete!"
