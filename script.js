import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,signInAnonymously}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getFirestore,collection,addDoc,updateDoc,doc,onSnapshot}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// 👉 Firebase Console > Project settings > Your apps > Web app se ye config copy karke yahan paste karein
const firebaseConfig={apiKey:"PASTE_API_KEY",authDomain:"PASTE_PROJECT.firebaseapp.com",projectId:"PASTE_PROJECT_ID",storageBucket:"PASTE_PROJECT.appspot.com",messagingSenderId:"PASTE",appId:"PASTE"};
const app=initializeApp(firebaseConfig),fs=getFirestore(app);
const NEEDS=["🩹 First aid","🚑 Hospital le jana","🧗 Rescue (pahad/nadi)","💧 Paani / khana","🚗 Gaadi / transport","📞 Sampark / sandesh","🏕️ Rehne ki jagah"];
let st={need:null,skills:new Set(),hLoc:null,vLoc:null,reqs:[],vols:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function chips(id,multi){const box=$(id);NEEDS.forEach(n=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=n;b.onclick=()=>{if(multi){st.skills.has(n)?st.skills.delete(n):st.skills.add(n);b.classList.toggle("on")}else{st.need=n;[...box.children].forEach(x=>x.classList.toggle("on",x===b))}};box.appendChild(b)})}
chips("needs",false);chips("skills",true);
const tabs={help:"p-help",vol:"p-vol",dash:"p-dash"};
Object.keys(tabs).forEach(k=>{$("t-"+k).onclick=()=>{Object.keys(tabs).forEach(j=>{$("t-"+j).classList.toggle("on",j===k);$(tabs[j]).classList.toggle("hide",j!==k)})}});
function getLoc(cb,out,fail){out.textContent="Location dhundh rahe hain…";if(!navigator.geolocation){out.textContent="Is device par location available nahi.";fail&&fail();return}
navigator.geolocation.getCurrentPosition(p=>{const l={lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)};out.textContent="✅ Location mil gayi (±"+l.acc+" m)";cb(l)},()=>{out.textContent="Location nahi mil payi. Permission allow karein ya neeche haath se likhein.";fail&&fail()},{enableHighAccuracy:true,timeout:15000})}
$("h-loc").onclick=()=>getLoc(l=>{st.hLoc=l},$("h-locs"),()=>{$("h-manl").classList.remove("hide");$("h-man").classList.remove("hide")});
$("v-loc").onclick=()=>getLoc(l=>{st.vLoc=l},$("v-locs"));
function say(id,t){const e=$(id);e.textContent=t;e.classList.remove("hide")}
function dist(a,b){if(!a||!b)return null;const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng);const h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
let db=null;
async function save(col,data,resId){
 if(!db){say(resId,"Server se connection nahi hai. Seedha 112 / 108 call karein.");return false}
 try{await addDoc(collection(db,col),data);return true}catch(e){say(resId,"Save nahi ho paya: "+(e.message||e.code||"error"));return false}}
$("h-send").onclick=async()=>{
 const name=$("h-name").value.trim(),phone=$("h-phone").value.trim(),man=$("h-man").value.trim();
 if(!st.need)return say("h-res","Pehle madad ka type chunein.");
 if(!phone)return say("h-res","Phone number zaroori hai, taaki volunteer aapse baat kar sake.");
 if(!st.hLoc&&!man)return say("h-res","Location bhejein ya haath se likhein.");
 const ok=await save("requests",{need:st.need,desc:$("h-desc").value.trim(),name:name||"Anjaan",phone,loc:st.hLoc,place:man,status:"open",ts:Date.now()},"h-res");
 if(ok)say("h-res","✅ Request bhej di gayi. Paas ke volunteers ko dikhegi. Phone chalu rakhein. Khatra ho to 112 / 108 abhi call karein.")};
$("v-send").onclick=async()=>{
 const name=$("v-name").value.trim(),phone=$("v-phone").value.trim();
 if(!name||!phone)return say("v-res","Naam aur phone number daalein.");
 if(!st.skills.size)return say("v-res","Kam se kam ek madad ka type chunein.");
 const ok=await save("volunteers",{name,phone,skills:[...st.skills],area:$("v-area").value.trim(),loc:st.vLoc,ts:Date.now()},"v-res");
 if(ok)say("v-res","🙏 Shukriya! Aap volunteer list mein jud gaye.")};
function render(){
 const vols=st.vols;$("d-vc").textContent=vols.length;
 const reqs=[...st.reqs].sort((a,b)=>(a.status==="done")-(b.status==="done")||b.ts-a.ts);
 $("d-reqs").innerHTML=reqs.length?reqs.map(r=>{
  const m=vols.map(v=>({v,d:dist(r.loc,v.loc),ok:(v.skills||[]).includes(r.need)})).sort((a,b)=>(b.ok-a.ok)||((a.d??1e9)-(b.d??1e9))).slice(0,3);
  const map=r.loc?`https://www.google.com/maps?q=${r.loc.lat},${r.loc.lng}`:`https://www.google.com/maps/search/${encodeURIComponent(r.place||"")}`;
  return `<div class="card"><span class="st ${r.status}">${r.status==="open"?"● ZAROORAT":r.status==="going"?"● Volunteer ja raha hai":"✔ Ho gaya"}</span>
  <div><b>${esc(r.need)}</b> – ${esc(r.name)}</div>
  ${r.desc?`<div>${esc(r.desc)}</div>`:""}
  <div class="loc">${r.loc?"📍 Live location (±"+r.loc.acc+" m)":"📍 "+esc(r.place)} · ${new Date(r.ts).toLocaleString()}</div>
  <div class="row"><a class="btn" href="tel:${esc(r.phone)}">📞 Call</a><a class="btn alt" target="_blank" rel="noopener" href="${map}">🗺️ Map</a>
  <a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/${esc(r.phone.replace(/\D/g,""))}">💬 WhatsApp</a></div>
  <div style="margin-top:10px;font-weight:600;font-size:.9rem">Sabse paas ke volunteers:</div>
  ${m.length?m.map(x=>`<div class="vol">${x.ok?"✅":"▫️"} <b>${esc(x.v.name)}</b> ${x.d!=null?"· "+x.d.toFixed(1)+" km":(x.v.area?"· "+esc(x.v.area):"")} <a href="tel:${esc(x.v.phone)}">${esc(x.v.phone)}</a><br>${(x.v.skills||[]).map(s=>`<span class="tag">${esc(s)}</span>`).join("")}</div>`).join(""):`<div class="loc">Abhi koi volunteer registered nahi.</div>`}
  <div class="row">${r.status==="open"?`<button class="btn alt" data-a="going" data-i="${r.id}">🏃 Main ja raha hu</button>`:""}${r.status!=="done"?`<button class="btn alt" data-a="done" data-i="${r.id}">✔ Madad ho gayi</button>`:""}</div></div>`}).join(""):`<div class="loc">Abhi koi request nahi.</div>`;
 $("d-vols").innerHTML=vols.length?vols.map(v=>`<div class="card"><b>${esc(v.name)}</b> ${esc(v.area||"")}<div>${(v.skills||[]).map(s=>`<span class="tag">${esc(s)}</span>`).join("")}</div></div>`).join(""):`<div class="loc">Abhi koi volunteer nahi.</div>`}
$("d-reqs").onclick=async e=>{const b=e.target.closest("button[data-i]");if(!b||!db)return;try{await updateDoc(doc(db,"requests",b.dataset.i),{status:b.dataset.a})}catch(x){}};
(async()=>{
 if(firebaseConfig.apiKey.startsWith("PASTE")){$("d-status").textContent="Firebase config abhi nahi daala. script.js mein firebaseConfig bharein.";return}
 try{await signInAnonymously(getAuth(app));db=fs}catch(e){$("d-status").textContent="Firebase connect nahi hua: "+(e.code||e.message);return}
 $("d-status").textContent="🟢 Live – nayi requests apne aap dikhengi.";
 onSnapshot(collection(db,"requests"),q=>{st.reqs=q.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{$("d-status").textContent="Requests load nahi hui."});
 onSnapshot(collection(db,"volunteers"),q=>{st.vols=q.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{});
})();
render();
