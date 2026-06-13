import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// IM-VESTOR v3 — LEAD MARKETPLACE
// ============================================================

const SECTORS = ["Technology","Healthcare","Fintech","EdTech","CleanTech","E-Commerce","SaaS","AgriTech","PropTech","BioTech"];
const COUNTRIES = ["Portugal","Spain","France","Germany","UK","Italy","Netherlands","USA","Brazil"];
const VALUE_RANGES = ["€10K-€50K","€50K-€200K","€200K-€500K","€500K-€1M","€1M-€5M","€5M+"];

const REFERRAL_TIERS = [
  {tier:1,required:1,pokes:1,leads:0,hyperTrain:0,bonus:""},
  {tier:2,required:3,pokes:3,leads:0,hyperTrain:0,bonus:""},
  {tier:3,required:5,pokes:5,leads:1,hyperTrain:0,bonus:""},
  {tier:4,required:10,pokes:10,leads:3,hyperTrain:0,bonus:""},
  {tier:5,required:20,pokes:20,leads:5,hyperTrain:1,bonus:""},
  {tier:6,required:50,pokes:50,leads:15,hyperTrain:3,bonus:"1 month free"},
];

const initProjects = [
  {id:"p1",eid:"e1",title:"AgroSense",desc:"IoT platform for precision agriculture monitoring with real-time soil and pest data analytics across distributed farms.",sector:"AgriTech",value:"€200K-€500K",country:"Portugal",date:"2026-01-15",media:[],hyperTrain:false},
  {id:"p2",eid:"e2",title:"MedFlow",desc:"AI-powered clinical workflow automation reducing patient wait times in mid-size hospitals across Europe.",sector:"Healthcare",value:"€500K-€1M",country:"Portugal",date:"2026-02-01",media:[{id:"m-p2-1",type:"photo",url:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",name:"Medical workflow"},{id:"m-p2-2",type:"photo",url:"https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",name:"Hospital tech"}],hyperTrain:true},
  {id:"p3",eid:"e3",title:"LearnLoop",desc:"Adaptive learning platform using spaced repetition for corporate training and knowledge retention analytics.",sector:"EdTech",value:"€50K-€200K",country:"Spain",date:"2026-02-20",media:[],hyperTrain:false},
  {id:"p4",eid:"e1",title:"GreenGrid",desc:"Decentralized energy trading platform for solar panel owners enabling peer-to-peer transactions.",sector:"CleanTech",value:"€200K-€500K",country:"Portugal",date:"2026-03-01",media:[],hyperTrain:false},
  {id:"p5",eid:"e4",title:"PropMatch",desc:"Commercial real estate matching using foot traffic and demographic analytics for retail tenant placement.",sector:"PropTech",value:"€500K-€1M",country:"France",date:"2026-03-10",media:[{id:"m-p5-1",type:"photo",url:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",name:"Commercial property"}],hyperTrain:true},
  {id:"p6",eid:"e5",title:"CodeNest",desc:"Developer collaboration with AI code review and real-time pair programming for distributed teams.",sector:"SaaS",value:"€50K-€200K",country:"Germany",date:"2026-03-15",media:[],hyperTrain:false},
];

const initEnts = [
  {id:"e1",name:"Ana Costa",email:"ana@agro.pt",country:"Portugal",pokes:1,leadCredits:0,subscription:null,refCode:"ANAC-E1X2"},
  {id:"e2",name:"Miguel Santos",email:"miguel@medflow.io",country:"Portugal",pokes:3,leadCredits:0,subscription:"monthly",refCode:"MIGU-E2Y3"},
  {id:"e3",name:"Sofia Pereira",email:"sofia@learn.co",country:"Spain",pokes:1,leadCredits:0,subscription:null,refCode:"SOFI-E3Z4"},
  {id:"e4",name:"Joao Almeida",email:"joao@prop.pt",country:"France",pokes:5,leadCredits:1,subscription:null,refCode:"JOAO-E4W5"},
  {id:"e5",name:"Rita Ferreira",email:"rita@code.dev",country:"Germany",pokes:1,leadCredits:0,subscription:null,refCode:"RITA-E5V6"},
];

const initInvs = [
  {id:"i1",name:"Carlos Mendes",email:"carlos@vc.pt",country:"Portugal",sectors:["Technology","SaaS","AgriTech"],capacity:"€200K-€500K",pokes:3,leadCredits:2,subscription:"annual",refCode:"CARL-I1A2"},
  {id:"i2",name:"Beatriz Lima",email:"bea@health.eu",country:"Spain",sectors:["Healthcare","BioTech"],capacity:"€500K-€1M",pokes:1,leadCredits:0,subscription:null,refCode:"BEAT-I2B3"},
  {id:"i3",name:"Pedro Nunes",email:"pedro@early.vc",country:"Portugal",sectors:["EdTech","SaaS"],capacity:"€50K-€200K",pokes:5,leadCredits:1,subscription:"monthly",refCode:"PEDR-I3C4"},
];

const C = {bg:"#0A0E1A",card:"#111827",cardH:"#1a2236",brd:"#1e293b",brdH:"#334155",gold:"#D4A853",goldB:"#F0C66E",teal:"#2DD4BF",blue:"#3B82F6",red:"#EF4444",green:"#22C55E",purple:"#A855F7",t1:"#F1F5F9",t2:"#94A3B8",t3:"#64748B"};
const F = {d:"'Playfair Display',Georgia,serif",b:"'DM Sans','Segoe UI',sans-serif",m:"'JetBrains Mono',monospace"};

const Ico = ({d,s=20,c="currentColor"}) => {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{typeof d==="string"?<path d={d}/>:d}</svg>;
};

const I = {
  Search:(p)=><Ico {...p} d={<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>}/>,
  User:(p)=><Ico {...p} d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>,
  Brief:(p)=><Ico {...p} d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}/>,
  Cal:(p)=><Ico {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>,
  Check:(p)=><Ico {...p} d="M20 6L9 17l-5-5"/>,
  X:(p)=><Ico {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  Arrow:(p)=><Ico {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>,
  Bell:(p)=><Ico {...p} d={<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>}/>,
  Out:(p)=><Ico {...p} d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>,
  Globe:(p)=><Ico {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>}/>,
  Plus:(p)=><Ico {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>,
  Edit:(p)=><Ico {...p} d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  Camera:(p)=><Ico {...p} d={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>}/>,
  Video:(p)=><Ico {...p} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>}/>,
  Image:(p)=><Ico {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>}/>,
  Stop:(p)=><Ico {...p} d={<rect x="6" y="6" width="12" height="12" rx="1"/>}/>,
  Rec:(p)=><Ico {...p} d={<circle cx="12" cy="12" r="6" fill="currentColor"/>}/>,
  Lock:(p)=><Ico {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}/>,
  Unlock:(p)=><Ico {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>}/>,
  Zap:(p)=><Ico {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  Train:(p)=><Ico {...p} d={<><rect x="4" y="3" width="16" height="16" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/><path d="M9 19l-2 3"/><path d="M15 19l2 3"/></>}/>,
  Star:(p)=><Ico {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  Chat:(p)=><Ico {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
  Send:(p)=><Ico {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>,
  Crown:(p)=><Ico {...p} d="M2 4l4 16h12l4-16-6 5-4-7-4 7z"/>,
  Cart:(p)=><Ico {...p} d={<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></>}/>,
  Coin:(p)=><Ico {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a2 2 0 010 4H9m0 0h5"/></>}/>,
  Warning:(p)=><Ico {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>,
  Trash:(p)=><Ico {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>}/>,
  Gift:(p)=><Ico {...p} d={<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>}/>,
  Trophy:(p)=><Ico {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>}/>,
};

function Badge({children,v="default",style:s}){
  const vs = {default:{background:"rgba(212,168,83,0.15)",color:C.gold,border:"1px solid rgba(212,168,83,0.3)"},teal:{background:"rgba(45,212,191,0.12)",color:C.teal,border:"1px solid rgba(45,212,191,0.25)"},blue:{background:"rgba(59,130,246,0.12)",color:C.blue,border:"1px solid rgba(59,130,246,0.25)"},green:{background:"rgba(34,197,94,0.12)",color:C.green,border:"1px solid rgba(34,197,94,0.25)"},red:{background:"rgba(239,68,68,0.12)",color:C.red,border:"1px solid rgba(239,68,68,0.25)"},purple:{background:"rgba(168,85,247,0.12)",color:C.purple,border:"1px solid rgba(168,85,247,0.25)"},muted:{background:"rgba(100,116,139,0.15)",color:C.t2,border:"1px solid rgba(100,116,139,0.2)"}};
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:"0.03em",fontFamily:F.b,...vs[v],...s}}>{children}</span>;
}

function Btn({children,v="primary",sz="md",onClick,style:s,disabled}){
  const [h,setH] = useState(false);
  const szs = {sm:{padding:"6px 14px",fontSize:12},md:{padding:"10px 22px",fontSize:13},lg:{padding:"14px 32px",fontSize:15}};
  const vs = {primary:{background:h?C.goldB:C.gold,color:"#0A0E1A",fontWeight:700},secondary:{background:h?"rgba(45,212,191,0.15)":"transparent",color:C.teal,border:"1px solid "+(h?C.teal:"rgba(45,212,191,0.4)")},ghost:{background:h?"rgba(241,245,249,0.06)":"transparent",color:C.t2},danger:{background:h?"#dc2626":C.red,color:"#fff",fontWeight:600},purple:{background:h?"#9333ea":C.purple,color:"#fff",fontWeight:700}};
  return <button onClick={onClick} disabled={disabled} onMouseEnter={function(){setH(true)}} onMouseLeave={function(){setH(false)}} style={{display:"inline-flex",alignItems:"center",gap:8,border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontFamily:F.b,letterSpacing:"0.02em",transition:"all 0.2s",opacity:disabled?0.5:1,...szs[sz],...vs[v],...s}}>{children}</button>;
}

function Inp({label,...p}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label && <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500}}>{label}</label>}
      <input style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+C.brd,borderRadius:8,padding:"10px 14px",color:C.t1,fontFamily:F.b,fontSize:14,outline:"none"}} onFocus={function(e){e.target.style.borderColor=C.gold}} onBlur={function(e){e.target.style.borderColor=C.brd}} {...p}/>
    </div>
  );
}

function Sel({label,options,value,onChange,placeholder}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label && <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500}}>{label}</label>}
      <select value={value} onChange={function(e){onChange(e.target.value)}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+C.brd,borderRadius:8,padding:"10px 14px",color:value?C.t1:C.t3,fontFamily:F.b,fontSize:14,outline:"none",cursor:"pointer",appearance:"none"}}>
        <option value="" style={{background:C.card}}>{placeholder||"All"}</option>
        {options.map(function(o){return <option key={o} value={o} style={{background:C.card}}>{o}</option>})}
      </select>
    </div>
  );
}

function Modal({open,onClose,title,children,w}){
  if(!open) return null;
  var width = w || 560;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation()}} style={{background:C.card,border:"1px solid "+C.brd,borderRadius:16,width:"90%",maxWidth:width,maxHeight:"85vh",overflow:"auto",padding:32,position:"relative",animation:"modalIn 0.25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:F.d,fontSize:22,color:C.t1,margin:0}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.t3,padding:4}}><I.X s={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({icon:Ic,title,sub}){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(212,168,83,0.08)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Ic s={28} c={C.gold}/></div>
      <h3 style={{fontFamily:F.d,fontSize:18,color:C.t1,margin:"0 0 8px"}}>{title}</h3>
      <p style={{fontFamily:F.b,fontSize:13,color:C.t3,margin:0,maxWidth:320}}>{sub}</p>
    </div>
  );
}

function StatCard({icon:Ic,label,value,color,suffix}){
  return (
    <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:12,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><Ic s={18} c={color}/><span style={{fontFamily:F.d,fontSize:28,color:color}}>{value}{suffix||""}</span></div>
      <div style={{fontFamily:F.b,fontSize:12,color:C.t3}}>{label}</div>
    </div>
  );
}

export default function App(){
  var [user,setUser] = useState(null);
  var [page,setPage] = useState("home");
  var [selProj,setSelProj] = useState(null);
  var [selInv,setSelInv] = useState(null);
  var [chatPartner,setChatPartner] = useState(null);
  var [projects,setProjects] = useState(initProjects);
  var [ents,setEnts] = useState(initEnts);
  var [invs,setInvs] = useState(initInvs);
  var [pokes,setPokes] = useState([
    {id:"pk1",fromId:"i2",toId:"e2",pid:"p2",msg:"Very interested in MedFlow's traction. Would love to discuss.",status:"accepted",date:"2026-03-10"},
  ]);
  var [leads,setLeads] = useState([
    {id:"ld1",pid:"p2",iid:"i2",unlocked:true,date:"2026-03-12"},
  ]);
  var [messages,setMessages] = useState([
    {id:"m1",from:"i2",to:"e2",text:"Hi Miguel, loved your project!",ts:"2026-03-12T10:00"},
    {id:"m2",from:"e2",to:"i2",text:"Thanks Beatriz! Happy to share more details.",ts:"2026-03-12T10:05"},
  ]);
  var [meetings,setMeetings] = useState([]);
  var [referrals,setReferrals] = useState([]);
  var [claimedTiers,setClaimedTiers] = useState({});
  var [notif,setNotif] = useState(null);
  var [fSec,setFSec] = useState("");
  var [fCountry,setFCountry] = useState("");
  var [fValue,setFValue] = useState("");
  var [chatInput,setChatInput] = useState("");

  // Modals
  var [mLogin,setMLogin] = useState(false);
  var [mReg,setMReg] = useState(false);
  var [mPokeSend,setMPokeSend] = useState(false);
  var [mLeadUnlock,setMLeadUnlock] = useState(false);
  var [mShop,setMShop] = useState(false);
  var [mProj,setMProj] = useState(false);
  var [mMeeting,setMMeeting] = useState(false);
  var [mMeetWarning,setMMeetWarning] = useState(false);
  var [mReferral,setMReferral] = useState(false);
  var [editProj,setEditProj] = useState(null);
  var [pokeMsg,setPokeMsg] = useState("");
  var [pokeTarget,setPokeTarget] = useState(null);
  var [leadTarget,setLeadTarget] = useState(null);
  var [shopTab,setShopTab] = useState("subscriptions");
  var [inboxTab,setInboxTab] = useState("received");
  var [pendingMeetingPartner,setPendingMeetingPartner] = useState(null);

  // Forms
  var [regRole,setRegRole] = useState("entrepreneur");
  var [reg,setReg] = useState({name:"",email:"",country:"",sectors:[],capacity:"",refCode:""});
  var [pf,setPf] = useState({title:"",desc:"",sector:"",value:"",country:"",media:[]});

  // Refs for media/recording
  var [recording,setRecording] = useState(false);
  var [recTime,setRecTime] = useState(0);
  var [showWebcam,setShowWebcam] = useState(false);
  var videoRef = useRef(null);
  var mediaRecRef = useRef(null);
  var chunksRef = useRef([]);
  var timerRef = useRef(null);
  var streamRef = useRef(null);
  var fileRef = useRef(null);

  var notify = useCallback(function(msg,type){setNotif({msg:msg,type:type||"success"});setTimeout(function(){setNotif(null)},3000)},[]);
  var today = function(){return new Date().toISOString().split("T")[0]};

  // === HELPERS ===
  function getMyPokes(){return user ? user.pokes : 0}
  function getMyLeadCredits(){return user ? user.leadCredits : 0}

  function updateUser(updates){
    var newUser = Object.assign({},user,updates);
    setUser(newUser);
    if(user.role==="entrepreneur"){
      setEnts(function(p){return p.map(function(e){return e.id===user.id?Object.assign({},e,updates):e})});
    } else {
      setInvs(function(p){return p.map(function(i){return i.id===user.id?Object.assign({},i,updates):i})});
    }
  }

  function isUnlocked(pid,iid){
    var l = leads.find(function(l){return l.pid===pid && l.iid===iid && l.unlocked});
    return !!l;
  }

  function anonTitle(pr){
    // Generate stable hash-like id from project id
    var hash = 0;
    for(var i=0;i<pr.id.length;i++){hash = ((hash<<5)-hash) + pr.id.charCodeAt(i); hash = hash & hash;}
    var code = Math.abs(hash).toString(36).toUpperCase().padStart(4,"0").substring(0,4);
    return pr.sector+" Project #"+code;
  }

  function displayTitle(pr,unlocked){
    if(unlocked) return pr.title;
    if(user && user.role==="entrepreneur" && pr.eid===user.id) return pr.title;
    return anonTitle(pr);
  }

  function anonName(name){
    if(!name) return "??";
    var parts = name.trim().split(/\s+/);
    if(parts.length===1) return parts[0].charAt(0).toUpperCase()+".";
    return parts[0].charAt(0).toUpperCase()+parts[parts.length-1].charAt(0).toUpperCase();
  }

  function isInvestorUnlockedForEntrepreneur(investorId){
    if(!user || user.role!=="entrepreneur") return false;
    // Path 1: Poke accepted between this entrepreneur and the investor
    var pokeOk = pokes.some(function(p){return p.status==="accepted" && ((p.fromId===user.id && p.toId===investorId)||(p.fromId===investorId && p.toId===user.id))});
    if(pokeOk) return true;
    // Path 2: Investor unlocked any of the entrepreneur's projects (lead unlock)
    var myProjectIds = projects.filter(function(p){return p.eid===user.id}).map(function(p){return p.id});
    var leadOk = leads.some(function(l){return l.iid===investorId && myProjectIds.includes(l.pid) && l.unlocked});
    return leadOk;
  }

  function displayInvestorName(iv){
    if(!iv) return "Unknown";
    if(user && user.role==="investor" && user.id===iv.id) return iv.name;
    if(user && user.role==="entrepreneur" && isInvestorUnlockedForEntrepreneur(iv.id)) return iv.name;
    if(user && user.role==="investor") return iv.name; // investors see other investors fully (rare case)
    return anonName(iv.name);
  }

  function isPokeAccepted(uid1,uid2){
    return pokes.find(function(p){return p.status==="accepted" && ((p.fromId===uid1&&p.toId===uid2)||(p.fromId===uid2&&p.toId===uid1))});
  }

  function canChat(otherUserId){
    if(!user) return false;
    if(isPokeAccepted(user.id,otherUserId)) return true;
    if(user.role==="entrepreneur"){
      // Find investor's poke to entrepreneur and check if any lead unlocked
      var myProjects = projects.filter(function(p){return p.eid===user.id}).map(function(p){return p.id});
      return leads.some(function(l){return l.iid===otherUserId && myProjects.includes(l.pid) && l.unlocked});
    } else {
      var pids = projects.filter(function(p){return p.eid===otherUserId}).map(function(p){return p.id});
      return leads.some(function(l){return l.iid===user.id && pids.includes(l.pid) && l.unlocked});
    }
  }

  // === ACTIONS ===
  function doLogin(u){
    setUser(u);
    setMLogin(false);
    setPage(u.role==="investor"?"explore":"dashboard");
    notify("Welcome, "+u.name+"!");
  }

  function doRegister(){
    if(!reg.name||!reg.email||!reg.country){notify("Fill all required fields","warning");return}
    if(regRole==="investor"&&!reg.sectors.length){notify("Select sectors","warning");return}
    var id = regRole[0]+"-"+Date.now();
    var myRefCode = reg.name.replace(/\s/g,"").substring(0,4).toUpperCase()+"-"+Math.random().toString(36).substring(2,6).toUpperCase();
    var newUser;
    if(regRole==="entrepreneur"){
      newUser = {id:id,name:reg.name,email:reg.email,country:reg.country,pokes:1,leadCredits:0,subscription:null,refCode:myRefCode};
      setEnts(function(p){return [...p,newUser]});
    } else {
      newUser = {id:id,name:reg.name,email:reg.email,country:reg.country,sectors:reg.sectors,capacity:reg.capacity,pokes:1,leadCredits:0,subscription:null,refCode:myRefCode};
      setInvs(function(p){return [...p,newUser]});
    }
    // Track referral
    if(reg.refCode){
      var allUsers = [].concat(ents,invs);
      var referrer = allUsers.find(function(u){return u.refCode===reg.refCode.trim().toUpperCase()});
      if(referrer){
        setReferrals(function(p){return [...p,{id:"ref-"+Date.now(),referrerId:referrer.id,referredId:id,referredName:reg.name,referredRole:regRole,paid:false,profileComplete:false,date:today()}]});
        notify("Account created! Your friend earns rewards once you subscribe + complete your profile");
      } else {
        notify("Account created! You have 1 free poke");
      }
    } else {
      notify("Account created! You have 1 free poke");
    }
    setUser(Object.assign({},newUser,{role:regRole}));
    setMReg(false);
    setReg({name:"",email:"",country:"",sectors:[],capacity:"",refCode:""});
    setPage(regRole==="investor"?"explore":"dashboard");
  }

  function checkReferralQualified(uid){
    // Find the referral for this user
    var ref = referrals.find(function(r){return r.referredId===uid});
    if(!ref) return;
    // Check both conditions
    var u = ents.find(function(e){return e.id===uid}) || invs.find(function(i){return i.id===uid});
    if(!u) return;
    var paid = !!u.subscription;
    var profileComplete = false;
    if(u.role==="entrepreneur" || ents.find(function(e){return e.id===uid})){
      // Complete = at least 1 project
      profileComplete = projects.some(function(p){return p.eid===uid});
    } else {
      // Investor: sectors filled + capacity
      profileComplete = u.sectors && u.sectors.length>0 && !!u.capacity;
    }
    if(paid && profileComplete && (!ref.paid || !ref.profileComplete)){
      setReferrals(function(p){return p.map(function(r){return r.referredId===uid?Object.assign({},r,{paid:true,profileComplete:true,qualifiedDate:today()}):r})});
      notify("New qualified referral!");
    }
  }

  function getMyReferrals(){
    if(!user) return [];
    return referrals.filter(function(r){return r.referrerId===user.id});
  }

  function getMyQualifiedCount(){
    return getMyReferrals().filter(function(r){return r.paid && r.profileComplete}).length;
  }

  function getMyTier(){
    var count = getMyQualifiedCount();
    var tier = null;
    REFERRAL_TIERS.forEach(function(t){if(count>=t.required) tier=t});
    return tier;
  }

  function getNextTier(){
    var count = getMyQualifiedCount();
    return REFERRAL_TIERS.find(function(t){return count<t.required});
  }

  function claimTier(tier){
    if(!user) return;
    var key = user.id+"-t"+tier.tier;
    if(claimedTiers[key]){notify("Already claimed","warning");return}
    var updates = {};
    if(tier.pokes) updates.pokes = (user.pokes||0) + tier.pokes;
    if(tier.leads) updates.leadCredits = (user.leadCredits||0) + tier.leads;
    updateUser(updates);
    if(tier.hyperTrain){
      // Activate hyper train on first non-featured project
      var myProj = projects.find(function(p){return p.eid===user.id && !p.hyperTrain});
      if(myProj){
        setProjects(function(p){return p.map(function(x){return x.id===myProj.id?Object.assign({},x,{hyperTrain:true}):x})});
      }
    }
    setClaimedTiers(function(p){return Object.assign({},p,{[key]:true})});
    notify("Tier "+tier.tier+" rewards claimed!");
  }

  function sendPoke(toId,pid){
    if(getMyPokes()<=0){notify("No pokes left! Buy more in the shop","warning");setMPokeSend(false);setMShop(true);return}
    if(!pokeMsg.trim()){notify("Write a short message","warning");return}
    setPokes(function(p){return [...p,{id:"pk-"+Date.now(),fromId:user.id,toId:toId,pid:pid,msg:pokeMsg,status:"pending",date:today()}]});
    updateUser({pokes:user.pokes-1});
    notify("Poke sent! "+(user.pokes-1)+" pokes left");
    setPokeMsg("");
    setMPokeSend(false);
    setPokeTarget(null);
  }

  function respondPoke(pkId,accept){
    setPokes(function(p){return p.map(function(pk){return pk.id===pkId?Object.assign({},pk,{status:accept?"accepted":"rejected"}):pk})});
    notify(accept?"Poke accepted! Chat unlocked":"Poke declined");
  }

  function unlockLead(pid,iid){
    var leadCost = 23.99;
    if(getMyLeadCredits()>0){
      updateUser({leadCredits:user.leadCredits-1});
      setLeads(function(p){return [...p,{id:"ld-"+Date.now(),pid:pid,iid:iid,unlocked:true,date:today()}]});
      notify("Lead unlocked! Used 1 credit. Chat now available");
    } else {
      // Simulate payment
      setLeads(function(p){return [...p,{id:"ld-"+Date.now(),pid:pid,iid:iid,unlocked:true,date:today()}]});
      notify("Lead unlocked for "+leadCost+" EUR (simulated). Chat now available");
    }
    setMLeadUnlock(false);
    setLeadTarget(null);
  }

  function buyItem(item){
    if(item.type==="subscription"){
      updateUser({subscription:item.plan,pokes:user.pokes+(item.plan==="annual"?10:5)});
      notify("Subscription activated! "+item.label);
      // Check if this user is a referral, mark as paid
      setTimeout(function(){checkReferralQualified(user.id)},100);
    } else if(item.type==="pokes"){
      updateUser({pokes:user.pokes+item.qty});
      notify(item.qty+" pokes added!");
    } else if(item.type==="leads"){
      updateUser({leadCredits:user.leadCredits+item.qty});
      notify(item.qty+" lead credit(s) added!");
    } else if(item.type==="hyperTrain"){
      var myProj = projects.find(function(p){return p.eid===user.id});
      if(myProj){
        setProjects(function(p){return p.map(function(x){return x.id===myProj.id?Object.assign({},x,{hyperTrain:true}):x})});
        notify("Hyper Train activated for "+myProj.title+"!");
      }
    }
    setMShop(false);
  }

  function sendChat(toId){
    if(!chatInput.trim()) return;
    setMessages(function(p){return [...p,{id:"m-"+Date.now(),from:user.id,to:toId,text:chatInput,ts:new Date().toISOString()}]});
    setChatInput("");
  }

  function openMeeting(partnerId){
    setPendingMeetingPartner(partnerId);
    setMMeetWarning(true);
  }

  function confirmMeeting(){
    var partner = ents.find(function(e){return e.id===pendingMeetingPartner}) || invs.find(function(i){return i.id===pendingMeetingPartner});
    setMeetings(function(p){return [...p,{id:"mt-"+Date.now(),participants:[user.name,partner?partner.name:""],link:"https://meet.example.com/"+Date.now().toString(36),date:today()}]});
    notify("Meeting created. External platform - your responsibility.");
    setMMeetWarning(false);
    setPendingMeetingPartner(null);
  }

  // === MEDIA ===
  function handleFileUpload(e){
    var files = e.target.files;if(!files||!files.length) return;
    var current = pf.media||[];
    if(current.length>=3){notify("Max 3 files allowed","warning");return}
    var remaining = 3 - current.length;
    var toProcess = Array.from(files).slice(0,remaining);
    toProcess.forEach(function(file){
      var reader = new FileReader();
      reader.onload = function(ev){
        var isVideo = file.type.startsWith("video/");
        var item = {id:"m-"+Date.now()+Math.random(),type:isVideo?"video":"photo",url:ev.target.result,name:file.name};
        setPf(function(f){return Object.assign({},f,{media:[].concat(f.media||[],[item])})});
      };
      reader.readAsDataURL(file);
    });
    if(fileRef.current) fileRef.current.value="";
  }

  function removeMedia(mid){
    setPf(function(f){return Object.assign({},f,{media:(f.media||[]).filter(function(m){return m.id!==mid})})});
  }

  function startWebcam(){
    setShowWebcam(true);setRecTime(0);
    navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(stream){
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
    }).catch(function(){notify("Camera access denied","warning");setShowWebcam(false)});
  }

  function stopWebcam(){
    if(streamRef.current){streamRef.current.getTracks().forEach(function(t){t.stop()});streamRef.current=null;}
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}
    setShowWebcam(false);setRecording(false);setRecTime(0);
  }

  function startRec(){
    if(!streamRef.current) return;
    chunksRef.current=[];
    var mr = new MediaRecorder(streamRef.current,{mimeType:"video/webm"});
    mediaRecRef.current=mr;
    mr.ondataavailable=function(e){if(e.data.size>0) chunksRef.current.push(e.data)};
    mr.onstop=function(){
      var blob=new Blob(chunksRef.current,{type:"video/webm"});
      var url=URL.createObjectURL(blob);
      var item={id:"m-"+Date.now(),type:"video",url:url,name:"Pitch Recording"};
      setPf(function(f){return Object.assign({},f,{media:[].concat(f.media||[],[item])})});
      stopWebcam();
    };
    mr.start();setRecording(true);setRecTime(0);
    timerRef.current=setInterval(function(){
      setRecTime(function(t){
        if(t>=29){stopRec();return 30}
        return t+1;
      });
    },1000);
  }

  function stopRec(){
    if(mediaRecRef.current&&mediaRecRef.current.state==="recording"){mediaRecRef.current.stop();}
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}
    setRecording(false);
  }

  function saveProj(){
    if(!pf.title||!pf.desc||!pf.sector||!pf.value||!pf.country){notify("Fill all project fields","warning");return}
    if(editProj){setProjects(function(p){return p.map(function(x){return x.id===editProj.id?Object.assign({},x,{title:pf.title,desc:pf.desc,sector:pf.sector,value:pf.value,country:pf.country,media:pf.media}):x})});notify("Project updated!");}
    else{setProjects(function(p){return [...p,{id:"p-"+Date.now(),eid:user.id,title:pf.title,desc:pf.desc,sector:pf.sector,value:pf.value,country:pf.country,media:pf.media,date:today(),hyperTrain:false}]});notify("Project created!");}
    stopWebcam();setMProj(false);setEditProj(null);
    setTimeout(function(){checkReferralQualified(user.id)},100);
  }

  function goNav(pg){setPage(pg);setSelProj(null);setSelInv(null);setChatPartner(null)}

  useEffect(function(){
    var s=document.createElement("style");
    s.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap')",
      "@keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
      "@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}",
      "@keyframes notifIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}",
      "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}",
      "@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.4)}50%{box-shadow:0 0 30px rgba(168,85,247,0.7)}}",
      "@keyframes scrollX{from{transform:translateX(0)}to{transform:translateX(calc(-100% / 3))}}",
      ".ht-track:hover{animation-play-state:paused !important}",
      "*{box-sizing:border-box;margin:0;padding:0}",
      "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:"+C.brd+";border-radius:3px}",
      "select option{background:"+C.card+";color:"+C.t1+"}"
    ].join("\n");
    document.head.appendChild(s);
    return function(){document.head.removeChild(s)};
  },[]);

  // === VIEWS ===

  // Filtered projects for explore
  var filteredProjects = projects.filter(function(p){
    if(fSec && p.sector!==fSec) return false;
    if(fCountry && p.country!==fCountry) return false;
    if(fValue && p.value!==fValue) return false;
    return true;
  });

  // Hyper Train projects
  var hyperTrainProjects = projects.filter(function(p){return p.hyperTrain});

  // Pokes received by current user
  var pokesReceived = user ? pokes.filter(function(p){return p.toId===user.id && p.status==="pending"}) : [];

  // Leads pending for entrepreneur (investor unlocked, entrepreneur sees notification)
  var entrepreneurLeads = (user && user.role==="entrepreneur") ? leads.filter(function(l){
    var pr = projects.find(function(p){return p.id===l.pid});
    return pr && pr.eid===user.id;
  }) : [];

  // Conversations (people I can chat with)
  var conversations = user ? (function(){
    var partners = new Set();
    pokes.forEach(function(p){
      if(p.status==="accepted"){
        if(p.fromId===user.id) partners.add(p.toId);
        if(p.toId===user.id) partners.add(p.fromId);
      }
    });
    leads.forEach(function(l){
      if(l.unlocked){
        if(user.role==="investor" && l.iid===user.id){
          var pr = projects.find(function(p){return p.id===l.pid});
          if(pr) partners.add(pr.eid);
        } else if(user.role==="entrepreneur"){
          var myProj = projects.find(function(p){return p.id===l.pid && p.eid===user.id});
          if(myProj) partners.add(l.iid);
        }
      }
    });
    return Array.from(partners).map(function(pid){
      var p = ents.find(function(e){return e.id===pid}) || invs.find(function(i){return i.id===pid});
      return p;
    }).filter(Boolean);
  })() : [];

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.t1,fontFamily:F.b}}>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,14,26,0.85)",backdropFilter:"blur(16px)",borderBottom:"1px solid "+C.brd,padding:"0 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:24}}>
            <button onClick={function(){goNav("home")}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#D4A853,#F0C66E)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.Globe s={18} c="#0A0E1A"/></div>
              <span style={{fontFamily:F.d,fontSize:18,fontWeight:700,color:C.t1}}>IM-VESTOR</span>
              <Badge v="purple" style={{fontSize:9,padding:"2px 6px"}}>LEADS</Badge>
            </button>
            {user && <div style={{display:"flex",gap:4}}>
              <button onClick={function(){goNav("explore")}} style={{background:page==="explore"?"rgba(212,168,83,0.1)":"transparent",border:"none",cursor:"pointer",padding:"8px 14px",borderRadius:8,display:"flex",alignItems:"center",gap:6,color:page==="explore"?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:500}}><I.Search s={15}/>Explore</button>
              <button onClick={function(){goNav("dashboard")}} style={{background:page==="dashboard"?"rgba(212,168,83,0.1)":"transparent",border:"none",cursor:"pointer",padding:"8px 14px",borderRadius:8,display:"flex",alignItems:"center",gap:6,color:page==="dashboard"?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:500}}><I.Brief s={15}/>Dashboard</button>
              <button onClick={function(){goNav("inbox")}} style={{background:page==="inbox"?"rgba(212,168,83,0.1)":"transparent",border:"none",cursor:"pointer",padding:"8px 14px",borderRadius:8,display:"flex",alignItems:"center",gap:6,color:page==="inbox"?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:500,position:"relative"}}><I.Bell s={15}/>Inbox{(pokesReceived.length+entrepreneurLeads.length)>0&&<span style={{position:"absolute",top:4,right:4,background:C.red,color:"#fff",borderRadius:10,fontSize:9,padding:"1px 5px",fontWeight:700}}>{pokesReceived.length+entrepreneurLeads.length}</span>}</button>
              <button onClick={function(){goNav("chats")}} style={{background:page==="chats"?"rgba(212,168,83,0.1)":"transparent",border:"none",cursor:"pointer",padding:"8px 14px",borderRadius:8,display:"flex",alignItems:"center",gap:6,color:page==="chats"?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:500}}><I.Chat s={15}/>Chats</button>
            </div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {user ? (
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{display:"flex",gap:10,alignItems:"center",background:"rgba(212,168,83,0.06)",borderRadius:8,padding:"6px 12px",border:"1px solid rgba(212,168,83,0.15)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><I.Zap s={13} c={C.gold}/><span style={{fontFamily:F.m,fontSize:12,color:C.gold,fontWeight:600}}>{getMyPokes()}</span></div>
                  <div style={{width:1,height:14,background:C.brd}}/>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><I.Unlock s={13} c={C.teal}/><span style={{fontFamily:F.m,fontSize:12,color:C.teal,fontWeight:600}}>{getMyLeadCredits()}</span></div>
                </div>
                <Btn v="secondary" sz="sm" onClick={function(){setMReferral(true)}}><I.Gift s={13}/>Refer</Btn>
                <Btn v="purple" sz="sm" onClick={function(){setMShop(true)}}><I.Cart s={13}/>Shop</Btn>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:user.role==="investor"?"rgba(45,212,191,0.15)":"rgba(212,168,83,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.User s={15} c={user.role==="investor"?C.teal:C.gold}/></div>
                  <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{user.name}</div><div style={{fontSize:10,color:C.t3,textTransform:"uppercase"}}>{user.role}</div></div>
                </div>
                <Btn v="ghost" sz="sm" onClick={function(){setUser(null);goNav("home")}}><I.Out s={14}/>Sign Out</Btn>
              </div>
            ) : (
              <div style={{display:"flex",gap:8}}>
                <Btn v="secondary" sz="sm" onClick={function(){setMReg(true)}}>Create Account</Btn>
                <Btn v="primary" sz="sm" onClick={function(){setMLogin(true)}}>Sign In</Btn>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HOME */}
      {page==="home" && (
        <div style={{animation:"fadeIn 0.5s ease"}}>
          <div style={{position:"relative",overflow:"hidden",padding:"80px 24px 60px",textAlign:"center"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(212,168,83,0.08) 0%,transparent 60%)"}}/>
            <div style={{position:"relative",maxWidth:760,margin:"0 auto"}}>
              <Badge v="purple" style={{marginBottom:20}}>Lead Marketplace</Badge>
              <h1 style={{fontFamily:F.d,fontSize:52,fontWeight:700,color:C.t1,lineHeight:1.1,marginBottom:20}}>Discover <span style={{color:C.gold}}>opportunities</span><br/>Connect with <span style={{color:C.teal}}>investors</span></h1>
              <p style={{fontFamily:F.b,fontSize:18,color:C.t2,lineHeight:1.7,maxWidth:560,margin:"0 auto 36px"}}>The marketplace where entrepreneurs and investors discover qualified leads. Buy access. Skip the noise.</p>
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <Btn sz="lg" onClick={function(){user?goNav("explore"):setMReg(true)}}>Get Started <I.Arrow s={16}/></Btn>
                <Btn v="secondary" sz="lg" onClick={function(){setMLogin(true)}}>Sign In</Btn>
              </div>
            </div>
          </div>
          <div style={{maxWidth:1000,margin:"0 auto",padding:"40px 24px 80px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
              {[{i:I.Search,t:"Discover Opportunities",d:"Browse lead profiles by sector, country, and value range. No noise.",c:C.gold},{i:I.Zap,t:"Send a Poke",d:"1 free poke on signup. Send a short message to start a connection.",c:C.purple},{i:I.Unlock,t:"Buy Access to Leads",d:"Unlock full profile, media, and direct chat when both sides are aligned.",c:C.teal}].map(function(f,idx){return (
                <div key={idx} style={{background:C.card,border:"1px solid "+C.brd,borderRadius:16,padding:28}}>
                  <div style={{width:44,height:44,borderRadius:12,background:f.c+"12",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><f.i s={22} c={f.c}/></div>
                  <h3 style={{fontFamily:F.d,fontSize:17,color:C.t1,marginBottom:8}}>{f.t}</h3>
                  <p style={{fontFamily:F.b,fontSize:13,color:C.t2,lineHeight:1.6}}>{f.d}</p>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE (Investor sees projects) */}
      {page==="explore" && user && user.role==="investor" && (
        <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
          {/* Hyper Train Carousel */}
          {hyperTrainProjects.length>0 && (
            <div style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <I.Train s={18} c={C.purple}/>
                <h3 style={{fontFamily:F.d,fontSize:16,color:C.t1}}>Featured Opportunities</h3>
                <Badge v="purple">Hyper Train</Badge>
              </div>
              <div style={{position:"relative",overflow:"hidden",borderRadius:14,maskImage:"linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)"}}>
                <div className="ht-track" style={{display:"flex",gap:14,paddingBottom:8,paddingTop:4,paddingLeft:4,paddingRight:4,animation:"scrollX 30s linear infinite",width:"max-content"}}>
                  {[].concat(hyperTrainProjects,hyperTrainProjects,hyperTrainProjects).map(function(pr,idx){
                    var photos=(pr.media||[]).filter(function(m){return m.type==="photo"});
                    var cover=photos.length>0?photos[0]:(pr.media||[])[0];
                    return (
                      <div key={pr.id+"-"+idx} onClick={function(){setSelProj(pr);setPage("proj-detail")}} style={{flexShrink:0,width:320,background:"linear-gradient(135deg,rgba(168,85,247,0.12),rgba(212,168,83,0.06))",border:"1px solid rgba(168,85,247,0.3)",borderRadius:14,overflow:"hidden",cursor:"pointer",position:"relative",boxShadow:"0 4px 20px rgba(168,85,247,0.15)"}}>
                        {/* Cover Media */}
                        {cover ? (
                          <div style={{position:"relative",width:"100%",height:160,overflow:"hidden",background:"#000"}}>
                            {cover.type==="photo"?
                              <img src={cover.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              :<div style={{position:"relative",width:"100%",height:"100%"}}><video src={cover.url} muted style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)"}}><div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.Video s={22} c="#fff"/></div></div></div>
                            }
                            <div style={{position:"absolute",top:10,right:10}}><Badge v="purple" style={{fontSize:9,padding:"2px 6px",backdropFilter:"blur(8px)",background:"rgba(168,85,247,0.85)",color:"#fff",border:"none"}}><I.Star s={10} c="#fff"/>FEATURED</Badge></div>
                            {(pr.media||[]).length>1 && <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.7)",borderRadius:6,padding:"2px 8px",fontFamily:F.m,fontSize:10,color:C.t1,backdropFilter:"blur(4px)"}}>+{(pr.media||[]).length-1}</div>}
                          </div>
                        ) : (
                          <div style={{position:"relative",width:"100%",height:160,background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(212,168,83,0.1))",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <I.Image s={36} c={C.purple}/>
                            <div style={{position:"absolute",top:10,right:10}}><Badge v="purple" style={{fontSize:9,padding:"2px 6px"}}><I.Star s={10} c={C.purple}/>FEATURED</Badge></div>
                          </div>
                        )}
                        {/* Content */}
                        <div style={{padding:18}}>
                          <h4 style={{fontFamily:F.d,fontSize:18,color:C.t1,marginBottom:8}}>{pr.title}</h4>
                          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}><Badge>{pr.sector}</Badge><Badge v="teal">{pr.value}</Badge><Badge v="muted">{pr.country}</Badge></div>
                          <p style={{fontFamily:F.b,fontSize:12,color:C.t2,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pr.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
            <div><h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:6}}>Discover Leads</h1><p style={{fontFamily:F.b,fontSize:13,color:C.t3}}>Browse opportunities by your criteria</p></div>
            <div style={{display:"flex",gap:12,alignItems:"flex-end"}}>
              <Sel label="Sector" options={SECTORS} value={fSec} onChange={setFSec} placeholder="All"/>
              <Sel label="Country" options={COUNTRIES} value={fCountry} onChange={setFCountry} placeholder="All"/>
              <Sel label="Value" options={VALUE_RANGES} value={fValue} onChange={setFValue} placeholder="All"/>
              {(fSec||fCountry||fValue)&&<Btn v="ghost" sz="sm" onClick={function(){setFSec("");setFCountry("");setFValue("")}}><I.X s={14}/></Btn>}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {filteredProjects.map(function(pr){
              var unlocked = isUnlocked(pr.id,user.id);
              var pokeSent = pokes.find(function(p){return p.fromId===user.id && p.pid===pr.id});
              return (
                <div key={pr.id} style={{background:C.card,border:"1px solid "+(pr.hyperTrain?"rgba(168,85,247,0.3)":C.brd),borderRadius:14,padding:24,position:"relative"}}>
                  {pr.hyperTrain && <div style={{position:"absolute",top:12,right:12}}><Badge v="purple" style={{fontSize:9,padding:"2px 6px"}}><I.Star s={10}/>FEATURED</Badge></div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{flex:1}}><h3 style={{fontFamily:F.d,fontSize:18,color:C.t1,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>{!unlocked && <I.Lock s={14} c={C.t3}/>}{displayTitle(pr,unlocked)}</h3>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}><Badge>{pr.sector}</Badge><Badge v="teal">{pr.value}</Badge><Badge v="muted">{pr.country}</Badge></div>
                    </div>
                  </div>
                  <p style={{fontFamily:F.b,fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:16,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pr.desc}</p>
                  {!unlocked && (
                    <div style={{background:"rgba(45,212,191,0.04)",border:"1px dashed rgba(45,212,191,0.3)",borderRadius:8,padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                      <I.Lock s={14} c={C.teal}/>
                      <span style={{fontFamily:F.b,fontSize:11,color:C.t2}}>Media and full profile locked. Send a poke or unlock the lead.</span>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:F.m,fontSize:11,color:C.t3}}>{pr.date}</span>
                    <div style={{display:"flex",gap:8}}>
                      {!pokeSent && <Btn v="secondary" sz="sm" onClick={function(){setPokeTarget({type:"project",pid:pr.id,toId:pr.eid,title:displayTitle(pr,unlocked)});setMPokeSend(true)}}><I.Zap s={12}/>Poke</Btn>}
                      {pokeSent && <Badge v={pokeSent.status==="accepted"?"green":pokeSent.status==="rejected"?"red":"default"}>POKE {pokeSent.status.toUpperCase()}</Badge>}
                      {!unlocked && <Btn sz="sm" onClick={function(){setLeadTarget({pid:pr.id,iid:user.id,title:displayTitle(pr,unlocked)});setMLeadUnlock(true)}}><I.Unlock s={12}/>Unlock €24.99</Btn>}
                      {unlocked && <Btn v="secondary" sz="sm" onClick={function(){setSelProj(pr);setPage("proj-detail")}}>View Full</Btn>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProjects.length===0 && <Empty icon={I.Search} title="No leads found" sub="Try adjusting your filters."/>}
        </div>
      )}

      {/* EXPLORE (Entrepreneur sees investors) */}
      {page==="explore" && user && user.role==="entrepreneur" && (function(){
        var myProjectCount = projects.filter(function(p){return p.eid===user.id}).length;
        if(myProjectCount===0){
          return (
            <div style={{maxWidth:600,margin:"0 auto",padding:"60px 24px",animation:"fadeIn 0.4s ease"}}>
              <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:16,padding:48,textAlign:"center"}}>
                <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(212,168,83,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><I.Lock s={36} c={C.gold}/></div>
                <h2 style={{fontFamily:F.d,fontSize:24,color:C.t1,marginBottom:10}}>Create Your First Project</h2>
                <p style={{fontFamily:F.b,fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>To explore investors and send pokes, you first need to register at least one project. Investors will only be able to connect with you through your projects.</p>
                <Btn sz="lg" onClick={function(){setEditProj(null);setPf({title:"",desc:"",sector:"",value:"",country:user.country||"",media:[]});setMProj(true)}}><I.Plus s={16}/>Create Project</Btn>
              </div>
            </div>
          );
        }
        var filteredInvestors = invs.filter(function(iv){
          if(fSec && !iv.sectors.includes(fSec)) return false;
          if(fCountry && iv.country!==fCountry) return false;
          if(fValue && iv.capacity!==fValue) return false;
          return true;
        });
        return (
          <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
              <div>
                <h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:6}}>Discover Investors</h1>
                <p style={{fontFamily:F.b,fontSize:13,color:C.t3}}>Browse investor profiles. Send a poke to start a connection.</p>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"flex-end"}}>
                <Sel label="Sector" options={SECTORS} value={fSec} onChange={setFSec} placeholder="All"/>
                <Sel label="Country" options={COUNTRIES} value={fCountry} onChange={setFCountry} placeholder="All"/>
                <Sel label="Capacity" options={VALUE_RANGES} value={fValue} onChange={setFValue} placeholder="All"/>
                {(fSec||fCountry||fValue)&&<Btn v="ghost" sz="sm" onClick={function(){setFSec("");setFCountry("");setFValue("")}}><I.X s={14}/></Btn>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
              {filteredInvestors.map(function(iv){
                var pokeSent = pokes.find(function(p){return p.fromId===user.id && p.toId===iv.id});
                var unlocked = isInvestorUnlockedForEntrepreneur(iv.id);
                return (
                  <div key={iv.id} style={{background:C.card,border:"1px solid "+C.brd,borderRadius:14,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                      <div style={{width:48,height:48,borderRadius:"50%",background:unlocked?"rgba(45,212,191,0.12)":"rgba(100,116,139,0.12)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                        {unlocked ? <I.User s={22} c={C.teal}/> : <span style={{fontFamily:F.d,fontSize:16,color:C.t2,fontWeight:700,letterSpacing:"0.05em"}}>{anonName(iv.name)}</span>}
                      </div>
                      <div style={{flex:1}}>
                        <h3 style={{fontFamily:F.d,fontSize:18,color:C.t1,display:"flex",alignItems:"center",gap:8}}>
                          {!unlocked && <I.Lock s={13} c={C.t3}/>}
                          {unlocked ? iv.name : anonName(iv.name)+" - Investor"}
                        </h3>
                        <span style={{fontFamily:F.b,fontSize:12,color:C.t3}}>{iv.country}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{iv.sectors.map(function(s){return <Badge key={s}>{s}</Badge>})}</div>
                    {iv.capacity && <div style={{fontFamily:F.b,fontSize:12,color:C.t2,marginBottom:14}}>Capacity: <strong style={{color:C.teal}}>{iv.capacity}</strong></div>}
                    {!unlocked && (
                      <div style={{background:"rgba(100,116,139,0.06)",border:"1px dashed "+C.brd,borderRadius:8,padding:"8px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                        <I.Lock s={12} c={C.t3}/>
                        <span style={{fontFamily:F.b,fontSize:11,color:C.t3}}>Full identity unlocked when poke is accepted or lead is purchased</span>
                      </div>
                    )}
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      {!pokeSent && <Btn v="secondary" sz="sm" onClick={function(){setPokeTarget({type:"investor",toId:iv.id,title:unlocked?iv.name:anonName(iv.name)+" - Investor"});setMPokeSend(true)}}><I.Zap s={12}/>Send Poke</Btn>}
                      {pokeSent && <Badge v={pokeSent.status==="accepted"?"green":pokeSent.status==="rejected"?"red":"default"}>POKE {pokeSent.status.toUpperCase()}</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
            {!filteredInvestors.length&&<Empty icon={I.Search} title="No investors found" sub="Try adjusting your filters."/>}
          </div>
        );
      })()}

      {/* PROJECT DETAIL (Investor only - if unlocked or own) */}
      {page==="proj-detail" && selProj && user && (function(){
        var unlocked = user.role==="investor" ? isUnlocked(selProj.id,user.id) : (selProj.eid===user.id);
        var en = ents.find(function(e){return e.id===selProj.eid});
        return (
          <div style={{maxWidth:800,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
            <button onClick={function(){goNav("explore")}} style={{background:"none",border:"none",cursor:"pointer",color:C.t3,fontFamily:F.b,fontSize:13,marginBottom:24}}>Back</button>
            <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:16,padding:36}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <h1 style={{fontFamily:F.d,fontSize:32,color:C.t1,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>{!unlocked && <I.Lock s={22} c={C.t3}/>}{displayTitle(selProj,unlocked)}</h1>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Badge>{selProj.sector}</Badge><Badge v="teal">{selProj.value}</Badge><Badge v="muted">{selProj.country}</Badge></div>
                </div>
                {unlocked && <Badge v="green"><I.Unlock s={11}/>UNLOCKED</Badge>}
              </div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+C.brd,borderRadius:12,padding:24,marginBottom:24}}>
                <p style={{fontFamily:F.b,fontSize:15,color:C.t2,lineHeight:1.8}}>{selProj.desc}</p>
              </div>
              {unlocked ? (
                <>
                  {(selProj.media||[]).length>0 && (
                    <div style={{marginBottom:24}}>
                      <h3 style={{fontFamily:F.b,fontSize:12,color:C.t3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Media</h3>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                        {selProj.media.map(function(m){return (
                          <div key={m.id} style={{width:200,height:140,borderRadius:12,overflow:"hidden",border:"1px solid "+C.brd,background:"#000"}}>
                            {m.type==="photo"?<img src={m.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<video src={m.url} controls style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                  {en && (
                    <div style={{background:"rgba(212,168,83,0.06)",border:"1px solid rgba(212,168,83,0.15)",borderRadius:12,padding:20,marginBottom:20}}>
                      <h3 style={{fontFamily:F.b,fontSize:12,color:C.t3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Entrepreneur Contact</h3>
                      <div style={{fontFamily:F.b,fontSize:15,color:C.t1,fontWeight:600,marginBottom:4}}>{en.name}</div>
                      <div style={{fontFamily:F.b,fontSize:13,color:C.t2}}>{en.email}</div>
                      <div style={{fontFamily:F.b,fontSize:13,color:C.t2}}>{en.country}</div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8}}>
                    {user.role==="investor" && en && <Btn onClick={function(){setChatPartner(en);goNav("chats")}}><I.Chat s={14}/>Open Chat</Btn>}
                    {user.role==="investor" && en && <Btn v="secondary" onClick={function(){openMeeting(en.id)}}><I.Cal s={14}/>Schedule Meeting</Btn>}
                  </div>
                </>
              ) : (
                <div style={{background:"rgba(45,212,191,0.04)",border:"1px dashed rgba(45,212,191,0.3)",borderRadius:12,padding:24,textAlign:"center"}}>
                  <I.Lock s={32} c={C.teal}/>
                  <h3 style={{fontFamily:F.d,fontSize:18,color:C.t1,marginTop:12,marginBottom:6}}>Content Locked</h3>
                  <p style={{fontFamily:F.b,fontSize:13,color:C.t2,marginBottom:16}}>Unlock to view media, entrepreneur contact, and start chatting.</p>
                  <Btn onClick={function(){setLeadTarget({pid:selProj.id,iid:user.id,title:displayTitle(selProj,unlocked)});setMLeadUnlock(true)}}><I.Unlock s={14}/>Unlock for €24.99</Btn>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* DASHBOARD */}
      {page==="dashboard" && user && (function(){
        if(user.role==="entrepreneur"){
          var mp = projects.filter(function(p){return p.eid===user.id});
          var mpIds = mp.map(function(p){return p.id});
          var pendingLeads = leads.filter(function(l){return mpIds.includes(l.pid) && !l.unlocked});
          var unlockedLeads = leads.filter(function(l){return mpIds.includes(l.pid) && l.unlocked});
          return (
            <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
              <h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:32}}>Dashboard</h1>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
                <StatCard icon={I.Brief} label="Projects" value={mp.length} color={C.gold}/>
                <StatCard icon={I.Zap} label="Pokes" value={user.pokes} color={C.purple}/>
                <StatCard icon={I.Unlock} label="Lead Credits" value={user.leadCredits} color={C.teal}/>
                <StatCard icon={I.Crown} label="Plan" value={user.subscription||"Free"} color={C.green}/>
              </div>
              <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"18px 24px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <h2 style={{fontFamily:F.d,fontSize:16,color:C.t1}}>My Projects</h2>
                  <Btn sz="sm" onClick={function(){setEditProj(null);setPf({title:"",desc:"",sector:"",value:"",country:user.country||"",media:[]});setMProj(true)}}><I.Plus s={14}/>New Project</Btn>
                </div>
                {!mp.length?<Empty icon={I.Brief} title="No projects yet" sub="Create your first project."/>:mp.map(function(pr){
                  var isFeatured = pr.hyperTrain;
                  return (
                    <div key={pr.id} style={{padding:"16px 24px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontFamily:F.b,fontSize:15,fontWeight:600,color:C.t1}}>{pr.title}</div>
                          {isFeatured && <Badge v="purple"><I.Star s={10}/>FEATURED</Badge>}
                        </div>
                        <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginTop:2}}>{pr.sector} - {pr.value} - {pr.country}</div>
                      </div>
                      <Btn v="ghost" sz="sm" onClick={function(){setEditProj(pr);setPf({title:pr.title,desc:pr.desc,sector:pr.sector,value:pr.value,country:pr.country,media:pr.media||[]});setMProj(true)}}><I.Edit s={13}/>Edit</Btn>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          var myUnlocked = leads.filter(function(l){return l.iid===user.id && l.unlocked});
          var sentPokes = pokes.filter(function(p){return p.fromId===user.id});
          return (
            <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
              <h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:32}}>Dashboard</h1>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
                <StatCard icon={I.Zap} label="Pokes Available" value={user.pokes} color={C.purple}/>
                <StatCard icon={I.Unlock} label="Leads Unlocked" value={myUnlocked.length} color={C.teal}/>
                <StatCard icon={I.Coin} label="Lead Credits" value={user.leadCredits} color={C.gold}/>
                <StatCard icon={I.Crown} label="Plan" value={user.subscription||"Free"} color={C.green}/>
              </div>
              <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:14,padding:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:42,height:42,borderRadius:10,background:"rgba(45,212,191,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.Send s={20} c={C.teal}/></div>
                  <div><div style={{fontFamily:F.b,fontSize:14,fontWeight:600,color:C.t1}}>Sent Pokes ({sentPokes.length})</div><div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginTop:2}}>Track all pokes you've sent in your Inbox</div></div>
                </div>
                <Btn v="secondary" sz="sm" onClick={function(){setInboxTab("sent");goNav("inbox")}}><I.Bell s={13}/>Open Inbox</Btn>
              </div>
            </div>
          );
        }
      })()}

      {/* INBOX */}
      {page==="inbox" && user && (function(){
        var sentPokes = pokes.filter(function(p){return p.fromId===user.id});
        var entInterest = user.role==="entrepreneur"?entrepreneurLeads:[];
        var receivedCount = pokesReceived.length+entInterest.length;
        return (
          <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
            <h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:20}}>Inbox</h1>

            {/* Tabs */}
            <div style={{display:"flex",gap:6,marginBottom:24,borderBottom:"1px solid "+C.brd}}>
              {[{k:"received",l:"Received",count:receivedCount,icon:I.Bell},{k:"sent",l:"Sent",count:sentPokes.length,icon:I.Send}].map(function(t){return (
                <button key={t.k} onClick={function(){setInboxTab(t.k)}} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:inboxTab===t.k?"2px solid "+C.gold:"2px solid transparent",color:inboxTab===t.k?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                  <t.icon s={14}/>{t.l}
                  {t.count>0 && <span style={{background:inboxTab===t.k?C.gold:C.brd,color:inboxTab===t.k?"#0A0E1A":C.t2,borderRadius:10,fontSize:10,padding:"1px 7px",fontWeight:700}}>{t.count}</span>}
                </button>
              )})}
            </div>

            {/* RECEIVED TAB */}
            {inboxTab==="received" && (
              <>
                {/* Pokes received */}
                <div style={{marginBottom:28}}>
                  <h3 style={{fontFamily:F.d,fontSize:16,color:C.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><I.Zap s={16} c={C.purple}/>Pokes Received ({pokesReceived.length})</h3>
                  {pokesReceived.length===0?<Empty icon={I.Bell} title="No pokes" sub="Pokes received will appear here."/>:pokesReceived.map(function(pk){
                    var sender = ents.find(function(e){return e.id===pk.fromId}) || invs.find(function(i){return i.id===pk.fromId});
                    var pr = pk.pid ? projects.find(function(p){return p.id===pk.pid}) : null;
                    return (
                      <div key={pk.id} style={{background:C.card,border:"1px solid "+C.brd,borderRadius:12,padding:18,marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:F.b,fontSize:14,color:C.t1,fontWeight:600}}>{sender?sender.name:"Unknown"}</div>
                            {pr && <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginTop:2}}>About: {displayTitle(pr,true)}</div>}
                          </div>
                          <span style={{fontFamily:F.m,fontSize:11,color:C.t3}}>{pk.date}</span>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:12,marginBottom:12,fontFamily:F.b,fontSize:13,color:C.t2,fontStyle:"italic"}}>"{pk.msg}"</div>
                        <div style={{display:"flex",gap:8}}>
                          <Btn sz="sm" onClick={function(){respondPoke(pk.id,true)}}><I.Check s={13}/>Accept (Unlock Chat)</Btn>
                          <Btn v="danger" sz="sm" onClick={function(){respondPoke(pk.id,false)}}><I.X s={13}/>Decline</Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Investor Interest (entrepreneur only) */}
                {user.role==="entrepreneur" && entInterest.length>0 && (
                  <div>
                    <h3 style={{fontFamily:F.d,fontSize:16,color:C.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><I.Star s={16} c={C.gold}/>Investor Interest ({entInterest.length})</h3>
                    {entInterest.map(function(l){
                      var iv = invs.find(function(i){return i.id===l.iid});
                      var pr = projects.find(function(p){return p.id===l.pid});
                      return (
                        <div key={l.id} style={{background:"rgba(212,168,83,0.04)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:12,padding:18,marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontFamily:F.b,fontSize:14,color:C.t1,fontWeight:600}}>Investor interested in {pr?pr.title:""}</div>
                              <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginTop:2}}>{iv?iv.name:""} unlocked your lead. Chat is now open.</div>
                            </div>
                            <Btn v="secondary" sz="sm" onClick={function(){if(iv){setChatPartner(iv);goNav("chats")}}}><I.Chat s={13}/>Open Chat</Btn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* SENT TAB */}
            {inboxTab==="sent" && (
              <div>
                <h3 style={{fontFamily:F.d,fontSize:16,color:C.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><I.Send s={16} c={C.teal}/>Pokes Sent ({sentPokes.length})</h3>
                {sentPokes.length===0?<Empty icon={I.Send} title="No pokes sent" sub="Pokes you send will appear here."/>:sentPokes.map(function(pk){
                  var target = ents.find(function(e){return e.id===pk.toId}) || invs.find(function(i){return i.id===pk.toId});
                  var pr = pk.pid ? projects.find(function(p){return p.id===pk.pid}) : null;
                  var canChatNow = pk.status==="accepted" && target;
                  return (
                    <div key={pk.id} style={{background:C.card,border:"1px solid "+C.brd,borderRadius:12,padding:18,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div style={{fontFamily:F.b,fontSize:14,color:C.t1,fontWeight:600}}>To: {target?target.name:"Unknown"}</div>
                          {pr && <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginTop:2}}>About: {displayTitle(pr,isUnlocked(pr.id,user.id)||pr.eid===user.id)}</div>}
                        </div>
                        <Badge v={pk.status==="accepted"?"green":pk.status==="rejected"?"red":"default"}>{pk.status.toUpperCase()}</Badge>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:12,marginBottom:pk.status==="accepted"?12:0,fontFamily:F.b,fontSize:13,color:C.t2,fontStyle:"italic"}}>"{pk.msg}"</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                        <span style={{fontFamily:F.m,fontSize:11,color:C.t3}}>{pk.date}</span>
                        {canChatNow && <Btn v="secondary" sz="sm" onClick={function(){setChatPartner(target);goNav("chats")}}><I.Chat s={13}/>Open Chat</Btn>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* CHATS */}
      {page==="chats" && user && (
        <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease"}}>
          <h1 style={{fontFamily:F.d,fontSize:28,color:C.t1,marginBottom:28}}>Chats</h1>
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16,minHeight:500}}>
            <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:14,overflow:"hidden"}}>
              {conversations.length===0?<Empty icon={I.Chat} title="No chats" sub="Accept a poke or unlock a lead."/>:conversations.map(function(p){return (
                <button key={p.id} onClick={function(){setChatPartner(p)}} style={{width:"100%",padding:"14px 18px",borderBottom:"1px solid "+C.brd,background:chatPartner&&chatPartner.id===p.id?"rgba(212,168,83,0.08)":"transparent",border:"none",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(45,212,191,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.User s={16} c={C.teal}/></div>
                  <div><div style={{fontFamily:F.b,fontSize:13,fontWeight:600,color:C.t1}}>{p.name}</div></div>
                </button>
              )})}
            </div>
            <div style={{background:C.card,border:"1px solid "+C.brd,borderRadius:14,display:"flex",flexDirection:"column"}}>
              {!chatPartner?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><Empty icon={I.Chat} title="Select a chat" sub="Choose a conversation."/></div>:(
                <>
                  <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(45,212,191,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.User s={16} c={C.teal}/></div>
                      <div style={{fontFamily:F.b,fontSize:14,fontWeight:600,color:C.t1}}>{chatPartner.name}</div>
                    </div>
                    <Btn v="secondary" sz="sm" onClick={function(){openMeeting(chatPartner.id)}}><I.Cal s={13}/>Schedule Meeting</Btn>
                  </div>
                  <div style={{flex:1,padding:20,overflow:"auto",display:"flex",flexDirection:"column",gap:10}}>
                    {messages.filter(function(m){return (m.from===user.id&&m.to===chatPartner.id)||(m.from===chatPartner.id&&m.to===user.id)}).map(function(m){
                      var mine = m.from===user.id;
                      return (
                        <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"70%",background:mine?"rgba(212,168,83,0.15)":"rgba(45,212,191,0.1)",border:"1px solid "+(mine?"rgba(212,168,83,0.3)":"rgba(45,212,191,0.2)"),borderRadius:12,padding:"10px 14px"}}>
                          <div style={{fontFamily:F.b,fontSize:13,color:C.t1}}>{m.text}</div>
                          <div style={{fontFamily:F.m,fontSize:9,color:C.t3,marginTop:4}}>{new Date(m.ts).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{padding:14,borderTop:"1px solid "+C.brd,display:"flex",gap:8}}>
                    <input value={chatInput} onChange={function(e){setChatInput(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")sendChat(chatPartner.id)}} placeholder="Type a message..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid "+C.brd,borderRadius:8,padding:"10px 14px",color:C.t1,fontFamily:F.b,fontSize:14,outline:"none"}}/>
                    <Btn onClick={function(){sendChat(chatPartner.id)}}><I.Send s={14}/></Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal open={mLogin} onClose={function(){setMLogin(false)}} title="Sign In" w={500}>
        <p style={{fontFamily:F.b,fontSize:13,color:C.t2,marginBottom:20}}>Demo accounts:</p>
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:F.b,fontSize:12,color:C.gold,fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Investors</div>
          {invs.map(function(iv){return <button key={iv.id} onClick={function(){doLogin(Object.assign({},iv,{role:"investor"}))}} style={{width:"100%",background:"rgba(45,212,191,0.04)",border:"1px solid "+C.brd,borderRadius:10,padding:"12px 16px",cursor:"pointer",marginBottom:8,textAlign:"left"}}><div style={{fontFamily:F.b,fontSize:14,fontWeight:600,color:C.t1}}>{iv.name}</div><div style={{fontFamily:F.b,fontSize:12,color:C.t3}}>{iv.country} - {iv.pokes} pokes - {iv.subscription||"Free"}</div></button>})}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:F.b,fontSize:12,color:C.gold,fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Entrepreneurs</div>
          {ents.map(function(en){return <button key={en.id} onClick={function(){doLogin(Object.assign({},en,{role:"entrepreneur"}))}} style={{width:"100%",background:"rgba(212,168,83,0.04)",border:"1px solid "+C.brd,borderRadius:10,padding:"12px 16px",cursor:"pointer",marginBottom:8,textAlign:"left"}}><div style={{fontFamily:F.b,fontSize:14,fontWeight:600,color:C.t1}}>{en.name}</div><div style={{fontFamily:F.b,fontSize:12,color:C.t3}}>{en.country} - {en.pokes} pokes</div></button>})}
        </div>
        <div style={{borderTop:"1px solid "+C.brd,paddingTop:20,textAlign:"center"}}>
          <Btn v="secondary" onClick={function(){setMLogin(false);setMReg(true)}} style={{width:"100%"}}>Create Account</Btn>
        </div>
      </Modal>

      <Modal open={mReg} onClose={function(){setMReg(false)}} title="Create Account" w={520}>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {["entrepreneur","investor"].map(function(r){return <button key={r} onClick={function(){setRegRole(r);setReg({name:"",email:"",country:"",sectors:[],capacity:""})}} style={{flex:1,padding:"14px 16px",borderRadius:10,cursor:"pointer",textAlign:"center",background:regRole===r?"rgba(212,168,83,0.12)":"rgba(255,255,255,0.02)",border:"1px solid "+(regRole===r?"rgba(212,168,83,0.4)":C.brd),color:regRole===r?C.t1:C.t3}}><div style={{fontFamily:F.b,fontSize:14,fontWeight:600,textTransform:"capitalize"}}>{r}</div></button>})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          <Inp label="Name *" placeholder="Your name" value={reg.name} onChange={function(e){setReg(function(f){return Object.assign({},f,{name:e.target.value})})}}/>
          <Inp label="Email *" placeholder="your@email.com" value={reg.email} onChange={function(e){setReg(function(f){return Object.assign({},f,{email:e.target.value})})}}/>
          <Sel label="Country *" options={COUNTRIES} value={reg.country} onChange={function(v){setReg(function(f){return Object.assign({},f,{country:v})})}} placeholder="Select"/>
          {regRole==="investor" && (
            <>
              <div>
                <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500,display:"block",marginBottom:6}}>Sectors of Interest *</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{SECTORS.map(function(s){var sel=reg.sectors.includes(s);return <button key={s} onClick={function(){setReg(function(f){return Object.assign({},f,{sectors:sel?f.sectors.filter(function(x){return x!==s}):[].concat(f.sectors,[s])})})}} style={{padding:"6px 12px",borderRadius:20,fontSize:12,cursor:"pointer",background:sel?"rgba(212,168,83,0.15)":"rgba(255,255,255,0.03)",border:"1px solid "+(sel?"rgba(212,168,83,0.4)":C.brd),color:sel?C.gold:C.t3}}>{s}</button>})}</div>
              </div>
              <Sel label="Investment Capacity (optional)" options={VALUE_RANGES} value={reg.capacity} onChange={function(v){setReg(function(f){return Object.assign({},f,{capacity:v})})}} placeholder="Select"/>
            </>
          )}
          <Inp label="Referral Code (optional)" placeholder="e.g. ANAC-E1X2" value={reg.refCode} onChange={function(e){setReg(function(f){return Object.assign({},f,{refCode:e.target.value.toUpperCase()})})}}/>
        </div>
        <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:8,padding:12,marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <I.Zap s={18} c={C.purple}/>
          <span style={{fontFamily:F.b,fontSize:12,color:C.t2}}>You'll receive <strong style={{color:C.purple}}>1 free poke</strong> on signup</span>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn v="ghost" onClick={function(){setMReg(false)}}>Cancel</Btn>
          <Btn onClick={doRegister}><I.Check s={14}/>Create Account</Btn>
        </div>
      </Modal>

      {/* POKE SEND MODAL */}
      <Modal open={mPokeSend} onClose={function(){setMPokeSend(false);setPokeMsg("")}} title="Send a Poke" w={500}>
        {pokeTarget && (
          <>
            <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,padding:14,marginBottom:18}}>
              <div style={{fontFamily:F.b,fontSize:14,color:C.t1,fontWeight:600}}>To: {pokeTarget.title}</div>
              <div style={{fontFamily:F.b,fontSize:12,color:C.t2,marginTop:4}}>You have <strong style={{color:C.purple}}>{getMyPokes()}</strong> poke(s) available</div>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500,display:"block",marginBottom:6}}>Short Message *</label>
              <textarea value={pokeMsg} onChange={function(e){setPokeMsg(e.target.value)}} placeholder="Why do you want to connect?" rows={3} maxLength={200} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid "+C.brd,borderRadius:8,padding:"10px 14px",color:C.t1,fontFamily:F.b,fontSize:14,outline:"none",resize:"vertical"}}/>
              <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginTop:4,textAlign:"right"}}>{pokeMsg.length}/200</div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn v="ghost" onClick={function(){setMPokeSend(false);setPokeMsg("")}}>Cancel</Btn>
              <Btn v="purple" onClick={function(){sendPoke(pokeTarget.toId,pokeTarget.pid)}} disabled={getMyPokes()<=0}><I.Zap s={14}/>Send Poke</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* LEAD UNLOCK MODAL */}
      <Modal open={mLeadUnlock} onClose={function(){setMLeadUnlock(false)}} title="Unlock Lead" w={460}>
        {leadTarget && (
          <>
            <div style={{background:"rgba(45,212,191,0.06)",border:"1px solid rgba(45,212,191,0.2)",borderRadius:10,padding:16,marginBottom:18}}>
              <div style={{fontFamily:F.b,fontSize:14,color:C.t1,fontWeight:600,marginBottom:6}}>{leadTarget.title}</div>
              <div style={{fontFamily:F.b,fontSize:12,color:C.t2}}>Unlocking gives you full access to the project media, entrepreneur contact, and direct chat.</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {getMyLeadCredits()>0 && (
                <button onClick={function(){unlockLead(leadTarget.pid,leadTarget.iid)}} style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:10,padding:14,cursor:"pointer",textAlign:"left"}}>
                  <div style={{fontFamily:F.b,fontSize:13,color:C.t1,fontWeight:600}}>Use Lead Credit ({getMyLeadCredits()} available)</div>
                  <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginTop:2}}>Free with credit</div>
                </button>
              )}
              <button onClick={function(){unlockLead(leadTarget.pid,leadTarget.iid)}} style={{background:"rgba(212,168,83,0.06)",border:"1px solid rgba(212,168,83,0.3)",borderRadius:10,padding:14,cursor:"pointer",textAlign:"left"}}>
                <div style={{fontFamily:F.b,fontSize:13,color:C.t1,fontWeight:600}}>Pay One-Time</div>
                <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginTop:2}}>€24.99 (simulated)</div>
              </button>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn v="ghost" onClick={function(){setMLeadUnlock(false)}}>Cancel</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* SHOP MODAL */}
      <Modal open={mShop} onClose={function(){setMShop(false)}} title="Shop" w={680}>
        <div style={{display:"flex",gap:6,marginBottom:24,borderBottom:"1px solid "+C.brd}}>
          {[{k:"subscriptions",l:"Subscriptions"},{k:"pokesSingle",l:"Poke Packs"},{k:"pokesMonthly",l:"Monthly Packs"},{k:"leads",l:"Leads"},{k:"hyperTrain",l:"Hyper Train"}].map(function(t){return (
            <button key={t.k} onClick={function(){setShopTab(t.k)}} style={{padding:"10px 16px",background:"none",border:"none",borderBottom:shopTab===t.k?"2px solid "+C.gold:"2px solid transparent",color:shopTab===t.k?C.gold:C.t3,fontFamily:F.b,fontSize:13,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
          )})}
        </div>

        {shopTab==="subscriptions" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{background:"rgba(212,168,83,0.04)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:14,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={{fontFamily:F.d,fontSize:18,color:C.t1}}>Monthly</h3><Badge>POPULAR</Badge></div>
              <div style={{fontFamily:F.d,fontSize:32,color:C.gold,marginBottom:4}}>€19.99<span style={{fontSize:13,color:C.t3}}>/mo</span></div>
              <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginBottom:14}}>Min 6 months (€119.94 + IVA)</div>
              <ul style={{listStyle:"none",fontFamily:F.b,fontSize:12,color:C.t2,marginBottom:18}}><li style={{marginBottom:6}}>5 pokes/month</li><li style={{marginBottom:6}}>Priority support</li><li>Profile boost</li></ul>
              <Btn onClick={function(){buyItem({type:"subscription",plan:"monthly",label:"Monthly €19.99/mo"})}} style={{width:"100%"}}>Subscribe</Btn>
            </div>
            <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:14,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={{fontFamily:F.d,fontSize:18,color:C.t1}}>Annual</h3><Badge v="purple">BEST VALUE</Badge></div>
              <div style={{fontFamily:F.d,fontSize:32,color:C.purple,marginBottom:4}}>€14.99<span style={{fontSize:13,color:C.t3}}>/mo</span></div>
              <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginBottom:14}}>€179.88 single payment - save 25%</div>
              <ul style={{listStyle:"none",fontFamily:F.b,fontSize:12,color:C.t2,marginBottom:18}}><li style={{marginBottom:6}}>10 pokes/month</li><li style={{marginBottom:6}}>Priority support</li><li>Profile boost</li></ul>
              <Btn v="purple" onClick={function(){buyItem({type:"subscription",plan:"annual",label:"Annual €179.88"})}} style={{width:"100%"}}>Subscribe</Btn>
            </div>
          </div>
        )}

        {shopTab==="pokesSingle" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {[{qty:3,price:39.99},{qty:5,price:49.99},{qty:10,price:69.99}].map(function(p,i){return (
              <div key={i} style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:14,padding:20,textAlign:"center"}}>
                <I.Zap s={32} c={C.purple} style={{marginBottom:8}}/>
                <div style={{fontFamily:F.d,fontSize:32,color:C.t1}}>{p.qty}</div>
                <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginBottom:14}}>Pokes</div>
                <div style={{fontFamily:F.d,fontSize:22,color:C.gold,marginBottom:14}}>€{p.price}</div>
                <Btn sz="sm" onClick={function(){buyItem({type:"pokes",qty:p.qty})}} style={{width:"100%"}}>Buy Pack</Btn>
              </div>
            )})}
          </div>
        )}

        {shopTab==="pokesMonthly" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {[{qty:3,price:29.99},{qty:5,price:39.99},{qty:10,price:49.99}].map(function(p,i){return (
              <div key={i} style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:14,padding:20,textAlign:"center"}}>
                <I.Zap s={32} c={C.teal} style={{marginBottom:8}}/>
                <div style={{fontFamily:F.d,fontSize:32,color:C.t1}}>{p.qty}</div>
                <div style={{fontFamily:F.b,fontSize:12,color:C.t3,marginBottom:14}}>Pokes / month</div>
                <div style={{fontFamily:F.d,fontSize:22,color:C.teal,marginBottom:14}}>€{p.price}<span style={{fontSize:12,color:C.t3}}>/mo</span></div>
                <Btn v="secondary" sz="sm" onClick={function(){buyItem({type:"pokes",qty:p.qty})}} style={{width:"100%"}}>Subscribe</Btn>
              </div>
            )})}
          </div>
        )}

        {shopTab==="leads" && (
          <div style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:14,padding:32,textAlign:"center"}}>
            <I.Unlock s={48} c={C.teal}/>
            <h3 style={{fontFamily:F.d,fontSize:24,color:C.t1,marginTop:14,marginBottom:6}}>Single Lead Unlock</h3>
            <p style={{fontFamily:F.b,fontSize:13,color:C.t2,marginBottom:18}}>Buy a single lead unlock credit to use anytime</p>
            <div style={{fontFamily:F.d,fontSize:36,color:C.teal,marginBottom:20}}>€24.99</div>
            <Btn v="secondary" onClick={function(){buyItem({type:"leads",qty:1})}}>Buy 1 Lead Credit</Btn>
          </div>
        )}

        {shopTab==="hyperTrain" && (
          <div style={{background:"linear-gradient(135deg,rgba(168,85,247,0.1),rgba(212,168,83,0.05))",border:"1px solid rgba(168,85,247,0.3)",borderRadius:14,padding:32,textAlign:"center"}}>
            <I.Train s={48} c={C.purple}/>
            <h3 style={{fontFamily:F.d,fontSize:24,color:C.t1,marginTop:14,marginBottom:6}}>Hyper Train</h3>
            <p style={{fontFamily:F.b,fontSize:13,color:C.t2,marginBottom:18}}>Feature your project at the top of the marketplace with a premium badge</p>
            <div style={{fontFamily:F.d,fontSize:36,color:C.purple,marginBottom:8}}>€89.99</div>
            <div style={{fontFamily:F.b,fontSize:11,color:C.t3,marginBottom:20}}>One-time featured spot</div>
            {user&&user.role==="entrepreneur"?<Btn v="purple" onClick={function(){buyItem({type:"hyperTrain"})}}><I.Star s={14}/>Activate Hyper Train</Btn>:<div style={{fontFamily:F.b,fontSize:12,color:C.t3}}>Available for entrepreneurs only</div>}
          </div>
        )}
      </Modal>

      {/* PROJECT MODAL */}
      <Modal open={mProj} onClose={function(){stopWebcam();setMProj(false);setEditProj(null)}} title={editProj?"Edit Project":"New Project"} w={620}>
        <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:12,marginBottom:18,display:"flex",alignItems:"flex-start",gap:10}}>
          <I.Warning s={16} c={C.red} style={{marginTop:2}}/>
          <div style={{fontFamily:F.b,fontSize:11,color:C.t2,lineHeight:1.5}}>Don't include identifiable keywords, brand names, or external links. Keep your project description neutral.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          <Inp label="Project Name *" placeholder="e.g. AgroSense" value={pf.title} onChange={function(e){setPf(function(f){return Object.assign({},f,{title:e.target.value})})}}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500}}>Description *</label>
            <textarea value={pf.desc} onChange={function(e){setPf(function(f){return Object.assign({},f,{desc:e.target.value})})}} placeholder="Free text description of your project..." rows={4} style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+C.brd,borderRadius:8,padding:"10px 14px",color:C.t1,fontFamily:F.b,fontSize:14,outline:"none",resize:"vertical"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Sel label="Sector *" options={SECTORS} value={pf.sector} onChange={function(v){setPf(function(f){return Object.assign({},f,{sector:v})})}} placeholder="Select"/>
            <Sel label="Value Sought *" options={VALUE_RANGES} value={pf.value} onChange={function(v){setPf(function(f){return Object.assign({},f,{value:v})})}} placeholder="Select"/>
          </div>
          <Sel label="Country *" options={COUNTRIES} value={pf.country} onChange={function(v){setPf(function(f){return Object.assign({},f,{country:v})})}} placeholder="Select"/>

          {/* Media */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={{fontSize:12,color:C.t2,fontFamily:F.b,fontWeight:500}}>Photos & Videos ({(pf.media||[]).length}/3) - Only visible to investors who unlock the lead</label>
            {(pf.media||[]).length<3 && !showWebcam && (
              <div style={{display:"flex",gap:8}}>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} style={{display:"none"}}/>
                <Btn v="secondary" sz="sm" onClick={function(){if(fileRef.current)fileRef.current.click()}}><I.Image s={14}/>Upload</Btn>
                <Btn v="secondary" sz="sm" onClick={startWebcam}><I.Camera s={14}/>Record Pitch (30s)</Btn>
              </div>
            )}
            {showWebcam && (
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,overflow:"hidden",position:"relative"}}>
                <video ref={videoRef} muted style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block",borderRadius:12}}/>
                <div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.6)",borderRadius:8,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
                  {recording && <div style={{width:8,height:8,borderRadius:"50%",background:C.red,animation:"pulse 1s infinite"}}/>}
                  <span style={{fontFamily:F.m,fontSize:13,color:C.t1}}>{recTime}s / 30s</span>
                </div>
                <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8}}>
                  {!recording && <Btn v="danger" sz="sm" onClick={startRec}><I.Rec s={14}/>Record</Btn>}
                  {recording && <Btn v="danger" sz="sm" onClick={stopRec}><I.Stop s={14}/>Stop</Btn>}
                  <Btn v="ghost" sz="sm" onClick={stopWebcam} style={{background:"rgba(0,0,0,0.5)"}}><I.X s={14}/>Cancel</Btn>
                </div>
              </div>
            )}
            {(pf.media||[]).length>0 && (
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {(pf.media||[]).map(function(m){return (
                  <div key={m.id} style={{position:"relative",width:120,height:90,borderRadius:10,overflow:"hidden",border:"1px solid "+C.brd,background:"#000"}}>
                    {m.type==="photo"?<img src={m.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{position:"relative",width:"100%",height:"100%"}}><video src={m.url} style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><I.Video s={24} c={C.t1}/></div></div>}
                    <button onClick={function(){removeMedia(m.id)}} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",background:"rgba(239,68,68,0.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={12} c="#fff"/></button>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn v="ghost" onClick={function(){stopWebcam();setMProj(false);setEditProj(null)}}>Cancel</Btn>
          <Btn onClick={saveProj}>{editProj?"Save Changes":"Create Project"}</Btn>
        </div>
      </Modal>

      {/* REFERRAL MODAL */}
      <Modal open={mReferral} onClose={function(){setMReferral(false)}} title="Refer & Earn" w={640}>
        {(function(){
          if(!user) return null;
          var refCode = user.refCode || "USER-CODE";
          var myRefs = getMyReferrals();
          var qualified = myRefs.filter(function(r){return r.paid && r.profileComplete});
          var pending = myRefs.filter(function(r){return !r.paid || !r.profileComplete});
          var currentTier = getMyTier();
          var nextTier = getNextTier();
          var qCount = qualified.length;
          return (
            <>
              {/* QR & Code */}
              <div style={{background:"rgba(212,168,83,0.06)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:14,padding:24,marginBottom:24,textAlign:"center"}}>
                <div style={{fontFamily:F.b,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Your Referral Code</div>
                <div style={{fontFamily:F.m,fontSize:26,color:C.gold,fontWeight:700,marginBottom:14,letterSpacing:"0.08em"}}>{refCode}</div>
                <div style={{display:"inline-block",background:"#fff",borderRadius:10,padding:12,marginBottom:14}}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    {(function(){
                      var els=[];var size=7;
                      for(var row=0;row<20;row++){
                        for(var col=0;col<20;col++){
                          var hash=(refCode.charCodeAt((row*20+col)%refCode.length)*17+row*31+col*13)%100;
                          var isCorner=(row<5&&col<5)||(row<5&&col>14)||(row>14&&col<5);
                          if(isCorner||(hash<40)){els.push(<rect key={row+"-"+col} x={col*size} y={row*size} width={size} height={size} fill="#0A0E1A" rx="0.5"/>)}
                        }
                      }
                      [{x:0,y:0},{x:105,y:0},{x:0,y:105}].forEach(function(c,i){
                        els.push(<rect key={"co-"+i} x={c.x} y={c.y} width="35" height="35" fill="none" stroke="#0A0E1A" strokeWidth="3.5"/>);
                        els.push(<rect key={"ci-"+i} x={c.x+8} y={c.y+8} width="19" height="19" fill="#0A0E1A"/>);
                      });
                      return els;
                    })()}
                  </svg>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <Btn v="secondary" sz="sm" onClick={function(){if(navigator.clipboard){navigator.clipboard.writeText(refCode);notify("Code copied!")}}}><I.Plus s={12}/>Copy Code</Btn>
                </div>
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                <div style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontFamily:F.d,fontSize:24,color:C.green}}>{qCount}</div>
                  <div style={{fontFamily:F.b,fontSize:10,color:C.t3,marginTop:2}}>Qualified</div>
                </div>
                <div style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontFamily:F.d,fontSize:24,color:C.gold}}>{pending.length}</div>
                  <div style={{fontFamily:F.b,fontSize:10,color:C.t3,marginTop:2}}>Pending</div>
                </div>
                <div style={{background:C.cardH,border:"1px solid "+C.brd,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontFamily:F.d,fontSize:24,color:C.purple}}>{currentTier?currentTier.tier:0}</div>
                  <div style={{fontFamily:F.b,fontSize:10,color:C.t3,marginTop:2}}>Current Tier</div>
                </div>
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,padding:14,marginBottom:24}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontFamily:F.b,fontSize:12,color:C.t2}}>Progress to Tier {nextTier.tier}</span>
                    <span style={{fontFamily:F.m,fontSize:12,color:C.purple}}>{qCount}/{nextTier.required}</span>
                  </div>
                  <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:Math.min(100,(qCount/nextTier.required)*100)+"%",background:"linear-gradient(90deg,"+C.purple+","+C.gold+")",transition:"width 0.4s"}}/>
                  </div>
                </div>
              )}

              {/* Tiers */}
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:F.b,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Reward Tiers</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {REFERRAL_TIERS.map(function(t){
                    var unlocked = qCount>=t.required;
                    var claimed = !!claimedTiers[user.id+"-t"+t.tier];
                    var rewardParts = [];
                    if(t.pokes) rewardParts.push(t.pokes+" pokes");
                    if(t.leads) rewardParts.push(t.leads+" lead"+(t.leads>1?"s":""));
                    if(t.hyperTrain) rewardParts.push(t.hyperTrain+" hyper train"+(t.hyperTrain>1?"s":""));
                    if(t.bonus) rewardParts.push(t.bonus);
                    return (
                      <div key={t.tier} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:unlocked?(claimed?"rgba(34,197,94,0.04)":"rgba(168,85,247,0.06)"):"rgba(255,255,255,0.02)",border:"1px solid "+(unlocked?(claimed?"rgba(34,197,94,0.3)":"rgba(168,85,247,0.3)"):C.brd),borderRadius:10}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:unlocked?(claimed?"rgba(34,197,94,0.15)":"rgba(168,85,247,0.15)"):"rgba(100,116,139,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {claimed?<I.Check s={16} c={C.green}/>:unlocked?<I.Trophy s={16} c={C.purple}/>:<I.Lock s={14} c={C.t3}/>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontFamily:F.b,fontSize:13,fontWeight:600,color:C.t1}}>Tier {t.tier}</span>
                            <Badge v="muted" style={{fontSize:9}}>{t.required} referral{t.required>1?"s":""}</Badge>
                          </div>
                          <div style={{fontFamily:F.b,fontSize:11,color:C.t2,marginTop:2}}>{rewardParts.join(" + ")}</div>
                        </div>
                        {unlocked && !claimed && <Btn sz="sm" onClick={function(){claimTier(t)}}><I.Gift s={12}/>Claim</Btn>}
                        {claimed && <Badge v="green" style={{fontSize:9}}>CLAIMED</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referral History */}
              <div>
                <div style={{fontFamily:F.b,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Referral History</div>
                {myRefs.length===0?<div style={{textAlign:"center",padding:"20px 0",color:C.t3,fontSize:13,fontFamily:F.b}}>No referrals yet. Share your code to start earning!</div>:myRefs.map(function(r){
                  var isQual = r.paid && r.profileComplete;
                  return (
                    <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,marginBottom:6,border:"1px solid "+C.brd}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:isQual?"rgba(34,197,94,0.1)":"rgba(212,168,83,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.User s={13} c={isQual?C.green:C.gold}/></div>
                        <div>
                          <div style={{fontFamily:F.b,fontSize:13,color:C.t1,fontWeight:600}}>{r.referredName}</div>
                          <div style={{fontFamily:F.m,fontSize:10,color:C.t3}}>{r.date} - {r.referredRole}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                        {r.paid?<Badge v="green" style={{fontSize:9}}>PAID</Badge>:<Badge v="muted" style={{fontSize:9}}>NOT PAID</Badge>}
                        {r.profileComplete?<Badge v="green" style={{fontSize:9}}>PROFILE</Badge>:<Badge v="muted" style={{fontSize:9}}>NO PROFILE</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Modal>

      {/* MEETING WARNING */}
      <Modal open={mMeetWarning} onClose={function(){setMMeetWarning(false)}} title="External Platform Notice" w={500}>
        <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:20,marginBottom:20,display:"flex",alignItems:"flex-start",gap:12}}>
          <I.Warning s={24} c={C.red} style={{flexShrink:0,marginTop:2}}/>
          <div>
            <div style={{fontFamily:F.b,fontSize:14,fontWeight:600,color:C.t1,marginBottom:8}}>You are leaving the platform</div>
            <p style={{fontFamily:F.b,fontSize:13,color:C.t2,lineHeight:1.7}}>IM-VESTOR's responsibility ends here. All negotiations are the responsibility of the parties involved. We recommend that you record the session on your own device for security.</p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn v="ghost" onClick={function(){setMMeetWarning(false)}}>Cancel</Btn>
          <Btn onClick={confirmMeeting}><I.Cal s={14}/>I Understand - Generate Link</Btn>
        </div>
      </Modal>

      {notif&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:2000,background:C.card,border:"1px solid "+(notif.type==="success"?C.green:notif.type==="warning"?C.gold:C.red),borderRadius:10,padding:"12px 24px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"notifIn 0.3s ease",display:"flex",alignItems:"center",gap:10}}><I.Check s={16} c={notif.type==="success"?C.green:C.gold}/><span style={{fontFamily:F.b,fontSize:13,color:C.t1}}>{notif.msg}</span></div>}

      <footer style={{borderTop:"1px solid "+C.brd,padding:"32px 24px",marginTop:60}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:F.b,fontSize:12,color:C.t3}}>2026 IM-VESTOR - Lead Marketplace</div>
          <div style={{fontFamily:F.b,fontSize:11,color:C.t3}}>No advice. No intermediation. No deal participation. Marketplace only.</div>
        </div>
      </footer>
    </div>
  );
}
