import { useState, useEffect, useCallback, useRef } from "react";

const T = {
  ink: "#0f1923", paper: "#f7f3ee", warm: "#ede8df", card: "#fffcf8",
  accent: "#d94f3d", blue: "#2b6cb0", gold: "#c89b2a", sage: "#4a7c59",
  muted: "#7a7060", border: "#ddd5c5",
};

const KEYS = {
  users: "dp_users", events: "dp_events", annonces: "dp_annonces",
  resources: "dp_resources", session: "dp_session",
};

async function storeGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function storeSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); }
  catch (e) { console.error(e); }
}

// ── SEED : un seul compte admin par défaut, données vides ─────────────────
const INITIAL_ADMIN = [
  { id: "admin", name: "Administrateur", role: "Direction", email: "admin@ecole.fr",
    password: "admin123", color: "#d94f3d", initials: "AD", isAdmin: true }
];

const COLORS = ["#d94f3d","#2b6cb0","#4a7c59","#8b5cf6","#c89b2a","#0891b2","#be185d","#0f766e","#7c3aed","#b45309"];

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const EVENT_TYPES = {
  reunion:   { label:"Réunion",      color:"#2b6cb0", bg:"#ebf4ff" },
  parents:   { label:"Parents",      color:"#8b5cf6", bg:"#f3f0ff" },
  sortie:    { label:"Sortie",       color:"#4a7c59", bg:"#f0faf2" },
  vacances:  { label:"Vacances",     color:"#c89b2a", bg:"#fffbeb" },
  pedago:    { label:"Pédagogique",  color:"#d94f3d", bg:"#fff5f5" },
  evenement: { label:"Événement",    color:"#0891b2", bg:"#ecfeff" },
  autre:     { label:"Autre",        color:"#7a7060", bg:"#f5f3ef" },
};
const TAG_MAP = {
  urgent: { label:"Urgent",     textColor:"#d94f3d", bg:"#fff5f5" },
  info:   { label:"Info",       textColor:"#2b6cb0", bg:"#ebf4ff" },
  event:  { label:"Événement",  textColor:"#c89b2a", bg:"#fffbeb" },
  news:   { label:"Nouveauté",  textColor:"#4a7c59", bg:"#f0faf2" },
};

function uid() { return Math.random().toString(36).slice(2,10); }
function today() { return new Date().toISOString().slice(0,10); }
function fmtDate(iso) { if(!iso) return ""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
function daysUntil(iso) { return Math.ceil((new Date(iso)-new Date(today()))/86400000); }
function initials(name) {
  const parts = name.trim().split(" ").filter(Boolean);
  if(parts.length >= 2) return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  return name.slice(0,2).toUpperCase();
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession]     = useState(null);
  const [users, setUsers]         = useState([]);
  const [events, setEvents]       = useState([]);
  const [annonces, setAnnonces]   = useState([]);
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [toast, setToast]         = useState(null);
  const toastTimer = useRef(null);

  let u = await storeGet(KEYS.users);
if (!u || u.length === 0) { u = INITIAL_ADMIN; await storeSet(KEYS.users, u); }
      let e = await storeGet(KEYS.events);    if (!e) { e = []; await storeSet(KEYS.events, e); }
      let a = await storeGet(KEYS.annonces);  if (!a) { a = []; await storeSet(KEYS.annonces, a); }
      let r = await storeGet(KEYS.resources); if (!r) { r = []; await storeSet(KEYS.resources, r); }
      setUsers(u); setEvents(e); setAnnonces(a); setResources(r);
      const s = await storeGet(KEYS.session);
      if (s) setSession(s);
      setLoaded(true);
    })();
  }, []);

  const showToast = useCallback((msg, type="ok") => {
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const login = async (email, password) => {
    const u = users.find(x => x.email.toLowerCase()===email.toLowerCase() && x.password===password);
    if (!u) return false;
    const s = { userId: u.id };
    setSession(s); await storeSet(KEYS.session, s);
    return true;
  };
  const logout = async () => { setSession(null); await storeSet(KEYS.session, null); };

  const saveUsers     = async (v) => { setUsers(v);     await storeSet(KEYS.users, v); };
  const saveEvents    = async (v) => { setEvents(v);    await storeSet(KEYS.events, v); };
  const saveAnnonces  = async (v) => { setAnnonces(v);  await storeSet(KEYS.annonces, v); };
  const saveResources = async (v) => { setResources(v); await storeSet(KEYS.resources, v); };

  const currentUser = users.find(u => u.id === session?.userId);

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.paper,flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:`3px solid ${T.border}`,borderTop:`3px solid ${T.ink}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:T.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Chargement…</p>
    </div>
  );

  if (!session || !currentUser)
    return <LoginScreen users={users} onLogin={login} />;

  return (
    <MainApp
      currentUser={currentUser} users={users} events={events}
      annonces={annonces} resources={resources}
      onSaveUsers={saveUsers} onSaveEvents={saveEvents}
      onSaveAnnonces={saveAnnonces} onSaveResources={saveResources}
      onLogout={logout} showToast={showToast} toast={toast}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ users, onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    const ok = await onLogin(email.trim(), password);
    setLoading(false);
    if (!ok) setError("Email ou mot de passe incorrect.");
  };

  return (
    <div style={{minHeight:"100vh",background:T.ink,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input{font-family:'DM Sans',sans-serif!important}
      `}</style>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:48,marginBottom:8}}>📚</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",color:T.paper,fontSize:32,letterSpacing:"-1px"}}>
          <span style={{color:T.gold}}>EPPU</span> Fessenheim
        </h1>
        <p style={{color:"#6b6050",fontSize:13,marginTop:4,letterSpacing:".1em",textTransform:"uppercase"}}>Espace enseignants</p>
      </div>
      <div style={{background:T.card,borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:380,boxShadow:"0 24px 60px rgba(0,0,0,.35)"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:24,color:T.ink}}>Connexion</h2>
        <div style={{marginBottom:16}}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handle()}
            placeholder="votre@email.fr" style={inputStyle()} />
        </div>
        <div style={{marginBottom:8}}>
          <label style={labelStyle}>Mot de passe</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handle()}
            placeholder="••••••••" style={inputStyle()} />
        </div>
        {error && <p style={{color:T.accent,fontSize:13,marginBottom:12,background:"#fff5f5",padding:"8px 12px",borderRadius:8,border:"1px solid #fecaca"}}>{error}</p>}
        <button onClick={handle} disabled={loading}
          style={{width:"100%",padding:14,background:T.ink,color:T.paper,border:"none",borderRadius:10,fontSize:15,fontWeight:500,cursor:"pointer",marginTop:8,fontFamily:"'DM Sans',sans-serif",opacity:loading?.7:1}}>
          {loading?"Connexion…":"Se connecter"}
        </button>
        <p style={{fontSize:11,color:T.muted,marginTop:16,textAlign:"center"}}>
          Contactez l'administrateur pour obtenir vos identifiants.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function MainApp({ currentUser, users, events, annonces, resources,
  onSaveUsers, onSaveEvents, onSaveAnnonces, onSaveResources, onLogout, showToast, toast }) {
  const [tab, setTab] = useState("home");

  const upcomingReminders = events.filter(e => {
    const d = daysUntil(e.date);
    return e.remind && d >= 0 && d <= 7;
  }).sort((a,b) => a.date.localeCompare(b.date));

  const getUserById = (id) => users.find(u => u.id === id);

  return (
    <div style={{maxWidth:480,margin:"0 auto",background:T.paper,minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.ink}}
        input,textarea,select{font-family:'DM Sans',sans-serif!important}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .page{animation:slideUp .25s ease}
      `}</style>

      <TopBar currentUser={currentUser} onLogout={onLogout}
        reminderCount={upcomingReminders.length} onAdmin={()=>setTab("admin")} />

      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {tab==="home"      && <HomeTab currentUser={currentUser} users={users} events={events} annonces={annonces} getUserById={getUserById} upcomingReminders={upcomingReminders} />}
        {tab==="calendar"  && <CalendarTab currentUser={currentUser} events={events} users={users} onSaveEvents={onSaveEvents} showToast={showToast} getUserById={getUserById} />}
        {tab==="annonces"  && <AnnoncesTab currentUser={currentUser} annonces={annonces} users={users} onSaveAnnonces={onSaveAnnonces} showToast={showToast} getUserById={getUserById} />}
        {tab==="resources" && <ResourcesTab currentUser={currentUser} resources={resources} users={users} onSaveResources={onSaveResources} showToast={showToast} getUserById={getUserById} />}
        {tab==="team"      && <TeamTab users={users} currentUser={currentUser} events={events} />}
        {tab==="admin"     && <AdminTab currentUser={currentUser} users={users} events={events} annonces={annonces} resources={resources}
            onSaveUsers={onSaveUsers} onSaveEvents={onSaveEvents} onSaveAnnonces={onSaveAnnonces} onSaveResources={onSaveResources} showToast={showToast} />}
      </div>

      <BottomNav tab={tab} setTab={setTab} reminderCount={upcomingReminders.length} isAdmin={currentUser.isAdmin} />

      {toast && (
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="ok"?T.ink:T.accent,color:"white",padding:"10px 20px",
          borderRadius:24,fontSize:13,boxShadow:"0 8px 24px rgba(0,0,0,.3)",zIndex:999,
          animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",whiteSpace:"nowrap",maxWidth:"90vw"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ currentUser, onLogout, reminderCount, onAdmin }) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{background:T.ink,color:T.paper,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,letterSpacing:"-.5px"}}>
        🏫 <span style={{color:T.gold}}>EPPU</span> Fessenheim
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {reminderCount>0 && <div style={{background:T.accent,color:"white",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>{reminderCount} rappel{reminderCount>1?"s":""}</div>}
        <div onClick={()=>setMenu(!menu)}
          style={{width:34,height:34,borderRadius:"50%",background:currentUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",userSelect:"none"}}>
          {currentUser.initials}
        </div>
      </div>
      {menu && (
        <div style={{position:"absolute",top:60,right:16,background:T.card,borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,.2)",padding:8,zIndex:100,minWidth:180,animation:"fadeIn .15s ease"}}>
          <div style={{padding:"8px 12px",fontSize:13,color:T.muted,borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
            <div style={{fontWeight:600,color:T.ink}}>{currentUser.name}</div>
            <div style={{fontSize:11}}>{currentUser.role}</div>
          </div>
          {currentUser.isAdmin && (
            <button onClick={()=>{setMenu(false);onAdmin();}}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:T.blue,fontFamily:"'DM Sans',sans-serif",borderRadius:8}}>
              ⚙️ Administration
            </button>
          )}
          <button onClick={()=>{setMenu(false);onLogout();}}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:T.accent,fontFamily:"'DM Sans',sans-serif",borderRadius:8}}>
            🚪 Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

// ── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab, reminderCount, isAdmin }) {
  const items = [
    { id:"home",      icon:"🏠", label:"Accueil"    },
    { id:"calendar",  icon:"📅", label:"Calendrier" },
    { id:"annonces",  icon:"💬", label:"Annonces"   },
    { id:"resources", icon:"📁", label:"Ressources" },
    { id:"team",      icon:"👥", label:"Équipe"     },
  ];
  if(isAdmin) items.push({ id:"admin", icon:"⚙️", label:"Admin" });

  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.card,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:50}}>
      {items.map(it => (
        <button key={it.id} onClick={()=>setTab(it.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 0",border:"none",
            background: tab===it.id ? T.warm : "transparent",
            cursor:"pointer",color:tab===it.id?T.ink:T.muted,fontFamily:"'DM Sans',sans-serif",
            fontSize:9,fontWeight:tab===it.id?600:400,position:"relative",borderTop:tab===it.id?`2px solid ${T.ink}`:"2px solid transparent"}}>
          {it.id==="team" && reminderCount>0 && <div style={{position:"absolute",top:5,right:"20%",width:7,height:7,background:T.accent,borderRadius:"50%",border:"2px solid "+T.card}}/>}
          <span style={{fontSize:18}}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN TAB
// ══════════════════════════════════════════════════════════════════════════════
function AdminTab({ currentUser, users, events, annonces, resources,
  onSaveUsers, onSaveEvents, onSaveAnnonces, onSaveResources, showToast }) {

  const [section, setSection] = useState("users");
  const [modal, setModal]     = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);

  // ── Gestion utilisateurs ──
  const saveUser = async (u) => {
    const updated = editUser
      ? users.map(x => x.id===u.id ? u : x)
      : [...users, u];
    await onSaveUsers(updated);
    setModal(false);
    showToast(editUser ? "✏️ Compte modifié" : "✅ Compte créé !");
  };

  const deleteUser = async (id) => {
    if (id === currentUser.id) { showToast("❌ Impossible de supprimer votre propre compte", "err"); return; }
    await onSaveUsers(users.filter(u => u.id !== id));
    showToast("🗑️ Compte supprimé");
  };

  // ── Reset données ──
  const resetData = async (type) => {
    if(type==="events")    { await onSaveEvents([]);    showToast("🗑️ Événements effacés"); }
    if(type==="annonces")  { await onSaveAnnonces([]);  showToast("🗑️ Annonces effacées"); }
    if(type==="resources") { await onSaveResources([]); showToast("🗑️ Ressources effacées"); }
    if(type==="all") {
      await onSaveEvents([]); await onSaveAnnonces([]); await onSaveResources([]);
      showToast("🗑️ Toutes les données ont été effacées");
    }
    setConfirmReset(null);
  };

  const sections = [
    { id:"users",  label:"👤 Comptes" },
    { id:"data",   label:"🗄️ Données" },
    { id:"info",   label:"ℹ️ Infos"   },
  ];

  return (
    <div className="page" style={{padding:"16px",display:"flex",flexDirection:"column",gap:16}}>

      {/* Header */}
      <div style={{background:T.ink,borderRadius:16,padding:"16px 18px",color:T.paper}}>
        <div style={{fontSize:11,color:"#6b6050",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Panneau</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22}}>Administration ⚙️</h2>
        <p style={{fontSize:12,color:"#9a9088",marginTop:4}}>Accessible uniquement aux administrateurs</p>
      </div>

      {/* Sous-navigation */}
      <div style={{display:"flex",gap:6}}>
        {sections.map(s => (
          <button key={s.id} onClick={()=>setSection(s.id)}
            style={{flex:1,padding:"9px 6px",border:`1px solid ${section===s.id?T.ink:T.border}`,
              background:section===s.id?T.ink:"transparent",color:section===s.id?T.paper:T.muted,
              borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:section===s.id?600:400}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION COMPTES ── */}
      {section==="users" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <SectionTitle dot={T.blue} title={`Comptes enseignants (${users.length})`} />
            <button onClick={()=>{setEditUser(null);setModal(true);}}
              style={{...pillBtn(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"8px 14px"}}>
              + Nouveau compte
            </button>
          </div>

          {users.map(u => (
            <div key={u.id} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"white",flexShrink:0}}>
                {u.initials}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,fontWeight:600,color:T.ink}}>{u.name}</span>
                  {u.isAdmin && <span style={{fontSize:10,background:"#fef7e0",color:T.gold,padding:"1px 6px",borderRadius:10,fontWeight:600,border:`1px solid ${T.gold}`}}>ADMIN</span>}
                </div>
                <div style={{fontSize:12,color:T.muted}}>{u.role}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{u.email}</div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                <button onClick={()=>{setEditUser(u);setModal(true);}}
                  style={{border:`1px solid ${T.border}`,background:T.warm,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12}}>
                  ✏️
                </button>
                {u.id!==currentUser.id && (
                  <button onClick={()=>deleteUser(u.id)}
                    style={{border:`1px solid #fecaca`,background:"#fff5f5",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12}}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SECTION DONNÉES ── */}
      {section==="data" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <SectionTitle dot={T.accent} title="Gestion des données" />
          <p style={{fontSize:13,color:T.muted,lineHeight:1.5}}>
            Effacez les données de démonstration ou réinitialisez l'application. Ces actions sont irréversibles.
          </p>

          {[
            { type:"events",    icon:"📅", label:"Événements",  count: events.length,    color: T.blue   },
            { type:"annonces",  icon:"💬", label:"Annonces",    count: annonces.length,  color: T.sage   },
            { type:"resources", icon:"📁", label:"Ressources",  count: resources.length, color: T.gold   },
          ].map(item => (
            <div key={item.type} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:24}}>{item.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{item.label}</div>
                <div style={{fontSize:12,color:T.muted}}>{item.count} élément{item.count!==1?"s":""}</div>
              </div>
              <button onClick={()=>setConfirmReset(item.type)}
                style={{border:`1px solid #fecaca`,background:"#fff5f5",color:T.accent,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                Effacer
              </button>
            </div>
          ))}

          <div style={{marginTop:8,padding:"16px",background:"#fff5f5",border:`2px solid #fecaca`,borderRadius:14}}>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,marginBottom:6}}>⚠️ Réinitialisation complète</div>
            <p style={{fontSize:12,color:T.muted,marginBottom:12,lineHeight:1.5}}>
              Efface tous les événements, annonces et ressources. Les comptes utilisateurs sont conservés.
            </p>
            <button onClick={()=>setConfirmReset("all")}
              style={{background:T.accent,color:"white",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600,width:"100%"}}>
              Tout effacer
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION INFOS ── */}
      {section==="info" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <SectionTitle dot={T.sage} title="Informations" />
          {[
            ["Version", "EPPU Fessenheim v1.0"],
            ["Enseignants", `${users.length} compte${users.length>1?"s":""}`],
            ["Événements", `${events.length} au total`],
            ["Annonces", `${annonces.length} publiées`],
            ["Ressources", `${resources.length} partagées`],
            ["Stockage", "Partagé entre tous les utilisateurs"],
          ].map(([k,v]) => (
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 14px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.muted}}>{k}</span>
              <span style={{fontSize:13,fontWeight:600,color:T.ink}}>{v}</span>
            </div>
          ))}

          <div style={{marginTop:8,padding:"14px",background:T.warm,borderRadius:12,border:`1px solid ${T.border}`}}>
            <p style={{fontSize:12,color:T.muted,lineHeight:1.6}}>
              💡 <strong>Compte admin par défaut</strong><br/>
              Email : admin@ecole.fr<br/>
              Mot de passe : admin123<br/>
              <span style={{color:T.accent}}>Pensez à modifier ce mot de passe !</span>
            </p>
          </div>
        </div>
      )}

      {/* Modal création / édition compte */}
      {modal && (
        <UserModal
          user={editUser}
          currentUser={currentUser}
          onSave={saveUser}
          onClose={()=>setModal(false)}
        />
      )}

      {/* Confirmation reset */}
      {confirmReset && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:T.card,borderRadius:20,padding:24,width:"100%",maxWidth:340}}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>⚠️</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,textAlign:"center",marginBottom:8,color:T.ink}}>Confirmer la suppression</h3>
            <p style={{fontSize:13,color:T.muted,textAlign:"center",marginBottom:20,lineHeight:1.5}}>
              Cette action est <strong>irréversible</strong>. Toutes les données sélectionnées seront définitivement effacées.
            </p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmReset(null)}
                style={{flex:1,padding:12,border:`1px solid ${T.border}`,background:T.warm,borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
                Annuler
              </button>
              <button onClick={()=>resetData(confirmReset)}
                style={{flex:1,padding:12,background:T.accent,color:"white",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODAL CRÉATION / ÉDITION UTILISATEUR ─────────────────────────────────────
function UserModal({ user, currentUser, onSave, onClose }) {
  const isNew = !user;
  const [form, setForm] = useState(user ? {...user} : {
    id: uid(), name:"", role:"", email:"", password:"",
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    initials:"", isAdmin: false
  });
  const [errors, setErrors] = useState({});
  const set = (k,v) => {
    setForm(f => {
      const next = {...f,[k]:v};
      if(k==="name") next.initials = initials(v);
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if(!form.name.trim())     e.name     = "Nom requis";
    if(!form.role.trim())     e.role     = "Rôle requis";
    if(!form.email.trim())    e.email    = "Email requis";
    if(!form.password.trim()) e.password = "Mot de passe requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if(validate()) onSave(form); };

  return (
    <Modal title={isNew ? "Créer un compte" : "Modifier le compte"} onClose={onClose}>

      {/* Avatar preview */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:form.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white"}}>
          {form.initials||"?"}
        </div>
      </div>

      <FormField label="Nom complet" error={errors.name}>
        <input style={inputStyle(errors.name)} value={form.name}
          onChange={e=>set("name",e.target.value)} placeholder="Ex : Mme Dupont" />
      </FormField>

      <FormField label="Rôle / Classe" error={errors.role}>
        <input style={inputStyle(errors.role)} value={form.role}
          onChange={e=>set("role",e.target.value)} placeholder="Ex : CM2, Direction, AESH…" />
      </FormField>

      <FormField label="Email de connexion" error={errors.email}>
        <input style={inputStyle(errors.email)} type="email" value={form.email}
          onChange={e=>set("email",e.target.value)} placeholder="prenom.nom@ecole.fr" />
      </FormField>

      <FormField label="Mot de passe" error={errors.password}>
        <input style={inputStyle(errors.password)} value={form.password}
          onChange={e=>set("password",e.target.value)} placeholder="Minimum 6 caractères" />
      </FormField>

      <FormField label="Couleur de l'avatar">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"4px 0"}}>
          {COLORS.map(c => (
            <div key={c} onClick={()=>set("color",c)}
              style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",
                border:form.color===c?`3px solid ${T.ink}`:"3px solid transparent",
                boxShadow:form.color===c?"0 0 0 2px white inset":"none",transition:"all .15s"}}>
            </div>
          ))}
        </div>
      </FormField>

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderTop:`1px solid ${T.border}`,marginTop:4}}>
        <input type="checkbox" id="isAdmin" checked={form.isAdmin}
          onChange={e=>set("isAdmin",e.target.checked)}
          disabled={user?.id===currentUser.id}
          style={{width:16,height:16,accentColor:T.ink}} />
        <label htmlFor="isAdmin" style={{fontSize:13,color:T.ink,cursor:"pointer"}}>
          ⚙️ Droits administrateur
        </label>
      </div>
      {form.isAdmin && <p style={{fontSize:11,color:T.gold,marginBottom:8}}>⚠️ Cet utilisateur pourra gérer les comptes et effacer les données.</p>}

      <button onClick={handleSave}
        style={{...pillBtn(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:8}}>
        {isNew ? "Créer le compte" : "Enregistrer les modifications"}
      </button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════════════════════════════════════
function HomeTab({ currentUser, events, annonces, getUserById, upcomingReminders }) {
  const todayStr = today();
  const todayEvents = events.filter(e=>e.date===todayStr).sort((a,b)=>a.time.localeCompare(b.time));
  const nextEvents  = events.filter(e=>e.date>todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const recentAnnonces = [...annonces].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const d = new Date();

  return (
    <div className="page" style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:T.ink,borderRadius:16,padding:"20px 18px",color:T.paper}}>
        <p style={{fontSize:12,color:"#6b6050",textTransform:"capitalize",letterSpacing:".05em"}}>
          {d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginTop:4}}>
          Bonjour, {currentUser.name.split(" ").pop()} 👋
        </h2>
        <p style={{fontSize:13,color:"#9a9088",marginTop:6}}>{currentUser.role}</p>
      </div>

      {upcomingReminders.length>0 && (
        <div>
          <SectionTitle dot={T.accent} title="Rappels à venir" />
          {upcomingReminders.map(e => {
            const du = daysUntil(e.date);
            const et = EVENT_TYPES[e.type]||EVENT_TYPES.autre;
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.card,borderRadius:12,marginBottom:8,border:`1px solid ${T.border}`,borderLeft:`4px solid ${et.color}`}}>
                <div style={{textAlign:"center",minWidth:36}}>
                  <div style={{fontSize:18,fontWeight:700,color:et.color,fontFamily:"'Playfair Display',serif"}}>{du===0?"AJ":du}</div>
                  <div style={{fontSize:9,color:T.muted,textTransform:"uppercase"}}>{du===0?"auj.":"jours"}</div>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{e.title}</div>
                  <div style={{fontSize:12,color:T.muted}}>{fmtDate(e.date)}{e.time?` à ${e.time}`:""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <SectionTitle dot={T.blue} title="Aujourd'hui" />
        {todayEvents.length===0
          ? <EmptyState text="Aucun événement aujourd'hui" />
          : todayEvents.map(e=><EventRow key={e.id} event={e} getUserById={getUserById} />)}
      </div>

      <div>
        <SectionTitle dot={T.gold} title="Prochains événements" />
        {nextEvents.length===0
          ? <EmptyState text="Aucun événement à venir" />
          : nextEvents.map(e=><EventRow key={e.id} event={e} getUserById={getUserById} compact />)}
      </div>

      <div>
        <SectionTitle dot={T.sage} title="Dernières annonces" />
        {recentAnnonces.length===0
          ? <EmptyState text="Aucune annonce publiée" />
          : recentAnnonces.map(a => {
            const t = TAG_MAP[a.tag]||TAG_MAP.info;
            return (
              <div key={a.id} style={{padding:"12px 14px",background:T.card,borderRadius:12,marginBottom:8,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:600,color:t.textColor,background:t.bg,padding:"2px 8px",borderRadius:20}}>{t.label}</span>
                  <span style={{fontSize:11,color:T.muted}}>{fmtDate(a.date)}</span>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:3}}>{a.title}</div>
                <div style={{fontSize:12,color:T.muted}}>{a.body.slice(0,80)}{a.body.length>80?"…":""}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR TAB
// ══════════════════════════════════════════════════════════════════════════════
function CalendarTab({ currentUser, events, users, onSaveEvents, showToast, getUserById }) {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [modal, setModal]   = useState(false);
  const [editEvt, setEditEvt] = useState(null);
  const todayStr = today();

  const firstDow = new Date(year,month,1).getDay();
  const offset   = firstDow===0?6:firstDow-1;
  const daysInM  = new Date(year,month+1,0).getDate();

  const eventsMonth = events.filter(e=>{ const [y,m]=e.date.split("-"); return +y===year&&+m===(month+1); });
  const selectedEvts = selected ? events.filter(e=>e.date===selected).sort((a,b)=>a.time.localeCompare(b.time)) : [];

  const prevMo = ()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMo = ()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const saveEvent = async (ev) => {
    const updated = editEvt ? events.map(e=>e.id===ev.id?ev:e) : [ev,...events];
    await onSaveEvents(updated); setModal(false);
    showToast(editEvt?"✏️ Événement modifié":"✅ Événement ajouté");
  };
  const deleteEvent = async (id) => {
    await onSaveEvents(events.filter(e=>e.id!==id)); setSelected(null);
    showToast("🗑️ Événement supprimé");
  };

  return (
    <div className="page" style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={prevMo} style={navBtnStyle()}>◀</button>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>{MONTHS_FR[month]} {year}</h2>
        <button onClick={nextMo} style={navBtnStyle()}>▶</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>
        {DAYS_FR.map(d=><div key={d} style={{fontSize:11,color:T.muted,padding:"4px 0",fontWeight:500}}>{d}</div>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:daysInM}).map((_,i)=>{
          const d=i+1;
          const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const dayEvts=eventsMonth.filter(e=>e.date===iso);
          const isToday=iso===todayStr, isSel=iso===selected;
          const dow=new Date(year,month,d).getDay(), isWknd=dow===0||dow===6;
          return (
            <div key={d} onClick={()=>setSelected(iso===selected?null:iso)}
              style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                borderRadius:10,cursor:"pointer",position:"relative",fontSize:14,
                background:isSel?T.ink:isToday?"#1a2e3b":"transparent",
                color:isSel||isToday?T.paper:isWknd?T.muted:T.ink,
                fontWeight:isToday||isSel?700:400,
                border:isSel?"none":isToday?`2px solid ${T.ink}`:"none"}}>
              {d}
              {dayEvts.length>0 && (
                <div style={{display:"flex",gap:2,position:"absolute",bottom:3}}>
                  {dayEvts.slice(0,3).map((e,i)=>(
                    <div key={i} style={{width:5,height:5,borderRadius:"50%",background:(EVENT_TYPES[e.type]||EVENT_TYPES.autre).color,opacity:isSel||isToday?.8:1}}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600}}>{fmtDate(selected)}</div>
            <button onClick={()=>{setEditEvt(null);setModal(true);}}
              style={{...pillBtn(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"6px 12px"}}>
              + Ajouter
            </button>
          </div>
          {selectedEvts.length===0
            ? <EmptyState text="Aucun événement ce jour" />
            : selectedEvts.map(e=>(
              <EventCard key={e.id} event={e} getUserById={getUserById}
                onEdit={()=>{setEditEvt(e);setModal(true);}} onDelete={()=>deleteEvent(e.id)}
                canEdit={e.authorId===currentUser.id||currentUser.isAdmin} />
            ))}
        </div>
      )}

      {!selected && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <SectionTitle dot={T.blue} title="Événements à venir" />
            <button onClick={()=>{setSelected(todayStr);setEditEvt(null);setModal(true);}}
              style={{...pillBtn(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"6px 12px"}}>
              + Ajouter
            </button>
          </div>
          {events.filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8).map(e=>(
            <EventRow key={e.id} event={e} getUserById={getUserById} onClick={()=>setSelected(e.date)} />
          ))}
          {events.filter(e=>e.date>=todayStr).length===0 && <EmptyState text="Aucun événement à venir" />}
        </div>
      )}

      {modal && <EventModal event={editEvt} defaultDate={selected||todayStr} currentUser={currentUser} onSave={saveEvent} onClose={()=>setModal(false)} />}
    </div>
  );
}

function EventCard({ event, getUserById, onEdit, onDelete, canEdit }) {
  const et = EVENT_TYPES[event.type]||EVENT_TYPES.autre;
  const author = getUserById(event.authorId);
  return (
    <div style={{padding:"12px 14px",background:T.card,borderRadius:12,marginBottom:8,border:`1px solid ${T.border}`,borderLeft:`4px solid ${et.color}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:11,background:et.bg,color:et.color,padding:"1px 8px",borderRadius:20,fontWeight:600}}>{et.label}</span>
            {event.remind && <span style={{fontSize:11}}>🔔</span>}
          </div>
          <div style={{fontSize:15,fontWeight:600,color:T.ink}}>{event.title}</div>
          {event.time && <div style={{fontSize:12,color:T.muted}}>⏰ {event.time}</div>}
          {event.desc && <div style={{fontSize:12,color:T.muted,marginTop:3}}>{event.desc}</div>}
          {author && <div style={{fontSize:11,color:T.muted,marginTop:4}}>Par {author.name}</div>}
        </div>
        {canEdit && (
          <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
            <button onClick={onEdit}  style={{border:`1px solid ${T.border}`,background:T.warm,borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12}}>✏️</button>
            <button onClick={onDelete} style={{border:"1px solid #fecaca",background:"#fff5f5",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12}}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventModal({ event, defaultDate, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(event?{...event}:{
    id:uid(),title:"",date:defaultDate,time:"",type:"reunion",desc:"",authorId:currentUser.id,remind:true
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={event?"Modifier l'événement":"Nouvel événement"} onClose={onClose}>
      <FormField label="Titre"><input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Titre de l'événement"/></FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FormField label="Date"><input style={inputStyle()} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></FormField>
        <FormField label="Heure"><input style={inputStyle()} type="time" value={form.time} onChange={e=>set("time",e.target.value)}/></FormField>
      </div>
      <FormField label="Type">
        <select style={inputStyle()} value={form.type} onChange={e=>set("type",e.target.value)}>
          {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </FormField>
      <FormField label="Description"><textarea style={{...inputStyle(),minHeight:72,resize:"vertical"}} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Informations complémentaires…"/></FormField>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0"}}>
        <input type="checkbox" id="remind" checked={form.remind} onChange={e=>set("remind",e.target.checked)} style={{width:16,height:16,accentColor:T.ink}}/>
        <label htmlFor="remind" style={{fontSize:13,cursor:"pointer"}}>🔔 Activer le rappel (7 jours avant)</label>
      </div>
      <button onClick={()=>{if(form.title)onSave(form);}} style={{...pillBtn(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {event?"Enregistrer":"Ajouter l'événement"}
      </button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANNONCES TAB
// ══════════════════════════════════════════════════════════════════════════════
function AnnoncesTab({ currentUser, annonces, users, onSaveAnnonces, showToast, getUserById }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [editAnn, setEditAnn] = useState(null);

  const filtered = annonces
    .filter(a=>filter==="all"||a.tag===filter)
    .filter(a=>!search||a.title.toLowerCase().includes(search.toLowerCase())||a.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b.date.localeCompare(a.date));

  const save = async (ann) => {
    const updated = editAnn ? annonces.map(a=>a.id===ann.id?ann:a) : [ann,...annonces];
    await onSaveAnnonces(updated); setModal(false);
    showToast(editAnn?"✏️ Annonce modifiée":"📢 Annonce publiée !");
  };
  const del = async (id) => { await onSaveAnnonces(annonces.filter(a=>a.id!==id)); showToast("🗑️ Annonce supprimée"); };

  return (
    <div className="page" style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Annonces</h2>
        <button onClick={()=>{setEditAnn(null);setModal(true);}} style={{...pillBtn(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"8px 14px"}}>+ Nouveau</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px"}}>
        <span style={{color:T.muted}}>🔍</span>
        <input style={{border:"none",background:"transparent",flex:1,fontSize:14,outline:"none",color:T.ink}} placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {[["all","Tout"],["urgent","🔴 Urgent"],["info","🔵 Info"],["event","🟡 Événement"],["news","🟢 Nouveauté"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{...pillBtn(filter===k?T.ink:T.card,filter===k?T.paper:T.muted),border:`1px solid ${filter===k?T.ink:T.border}`,fontSize:12,padding:"6px 12px",whiteSpace:"nowrap",flexShrink:0}}>
            {l}
          </button>
        ))}
      </div>
      {filtered.length===0
        ? <EmptyState text="Aucune annonce" />
        : filtered.map(a=>{
          const t=TAG_MAP[a.tag]||TAG_MAP.info;
          const author=getUserById(a.authorId);
          const canEdit=a.authorId===currentUser.id||currentUser.isAdmin;
          return (
            <div key={a.id} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,borderLeft:`4px solid ${t.textColor}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,background:t.bg,color:t.textColor,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{t.label}</span>
                  <span style={{fontSize:11,color:T.muted}}>{fmtDate(a.date)}</span>
                </div>
                {canEdit && (
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{setEditAnn(a);setModal(true);}} style={{border:`1px solid ${T.border}`,background:T.warm,borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12}}>✏️</button>
                    <button onClick={()=>del(a.id)} style={{border:"1px solid #fecaca",background:"#fff5f5",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12}}>🗑️</button>
                  </div>
                )}
              </div>
              <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:4,fontFamily:"'Playfair Display',serif"}}>{a.title}</div>
              <div style={{fontSize:13,color:"#3a3530",lineHeight:1.55}}>{a.body}</div>
              {author && <div style={{fontSize:11,color:T.muted,marginTop:6}}>Par <strong>{author.name}</strong></div>}
            </div>
          );
        })}
      {modal && <AnnonceModal ann={editAnn} currentUser={currentUser} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

function AnnonceModal({ ann, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(ann?{...ann}:{id:uid(),tag:"info",title:"",body:"",authorId:currentUser.id,date:today()});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={ann?"Modifier l'annonce":"Nouvelle annonce"} onClose={onClose}>
      <FormField label="Catégorie">
        <select style={inputStyle()} value={form.tag} onChange={e=>set("tag",e.target.value)}>
          {Object.entries(TAG_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </FormField>
      <FormField label="Titre"><input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Titre de l'annonce"/></FormField>
      <FormField label="Message"><textarea style={{...inputStyle(),minHeight:100,resize:"vertical"}} value={form.body} onChange={e=>set("body",e.target.value)} placeholder="Rédigez votre message…"/></FormField>
      <button onClick={()=>{if(form.title&&form.body)onSave(form);}} style={{...pillBtn(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {ann?"Enregistrer":"Publier l'annonce"}
      </button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESOURCES TAB
// ══════════════════════════════════════════════════════════════════════════════
function ResourcesTab({ currentUser, resources, users, onSaveResources, showToast, getUserById }) {
  const [modal, setModal]   = useState(false);
  const [editRes, setEditRes] = useState(null);
  const typeIcon = {pdf:"📄",doc:"📝",link:"🔗",image:"🖼️",video:"🎬"};

  const save = async (res) => {
    const updated = editRes ? resources.map(r=>r.id===res.id?res:r) : [res,...resources];
    await onSaveResources(updated); setModal(false);
    showToast(editRes?"✏️ Ressource modifiée":"📁 Ressource ajoutée !");
  };
  const del = async (id) => { await onSaveResources(resources.filter(r=>r.id!==id)); showToast("🗑️ Ressource supprimée"); };

  return (
    <div className="page" style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Ressources</h2>
        <button onClick={()=>{setEditRes(null);setModal(true);}} style={{...pillBtn(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"8px 14px"}}>+ Ajouter</button>
      </div>
      {resources.length===0
        ? <EmptyState text="Aucune ressource partagée" />
        : resources.map(r=>{
          const author=getUserById(r.authorId);
          const canEdit=r.authorId===currentUser.id||currentUser.isAdmin;
          return (
            <div key={r.id} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:28,flexShrink:0}}>{typeIcon[r.type]||"📎"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:12,color:T.muted,marginBottom:4,lineHeight:1.4}}>{r.desc}</div>
                {r.url && <a href={r.url} target="_blank" rel="noopener" style={{fontSize:12,color:T.blue,textDecoration:"none"}}>🔗 Ouvrir le lien</a>}
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{author?`Par ${author.name}`:""}{r.date?` · ${fmtDate(r.date)}`:""}</div>
              </div>
              {canEdit && (
                <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                  <button onClick={()=>{setEditRes(r);setModal(true);}} style={{border:`1px solid ${T.border}`,background:T.warm,borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12}}>✏️</button>
                  <button onClick={()=>del(r.id)} style={{border:"1px solid #fecaca",background:"#fff5f5",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12}}>🗑️</button>
                </div>
              )}
            </div>
          );
        })}
      {modal && <ResourceModal res={editRes} currentUser={currentUser} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

function ResourceModal({ res, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(res?{...res}:{id:uid(),title:"",type:"doc",url:"",desc:"",authorId:currentUser.id,date:today()});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={res?"Modifier":"Nouvelle ressource"} onClose={onClose}>
      <FormField label="Titre"><input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Nom de la ressource"/></FormField>
      <FormField label="Type">
        <select style={inputStyle()} value={form.type} onChange={e=>set("type",e.target.value)}>
          {[["doc","📝 Document"],["pdf","📄 PDF"],["link","🔗 Lien web"],["image","🖼️ Image"],["video","🎬 Vidéo"]].map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
      </FormField>
      <FormField label="URL / Lien (optionnel)"><input style={inputStyle()} value={form.url} onChange={e=>set("url",e.target.value)} placeholder="https://…"/></FormField>
      <FormField label="Description"><textarea style={{...inputStyle(),minHeight:72,resize:"vertical"}} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Description courte…"/></FormField>
      <button onClick={()=>{if(form.title)onSave(form);}} style={{...pillBtn(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {res?"Enregistrer":"Ajouter"}
      </button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEAM TAB
// ══════════════════════════════════════════════════════════════════════════════
function TeamTab({ users, currentUser, events }) {
  const todayStr = today();
  return (
    <div className="page" style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Équipe enseignante</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {users.map(u=>{
          const nextEvt = events.filter(e=>e.authorId===u.id&&e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date))[0];
          return (
            <div key={u.id} style={{background:u.id===currentUser.id?T.ink:T.card,borderRadius:14,padding:14,border:`1px solid ${u.id===currentUser.id?T.ink:T.border}`,color:u.id===currentUser.id?T.paper:T.ink}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",flexShrink:0}}>{u.initials}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{u.name}</div>
                  <div style={{fontSize:11,opacity:.7}}>{u.role}</div>
                </div>
              </div>
              {u.isAdmin && <div style={{fontSize:10,color:T.gold,marginBottom:4,fontWeight:600}}>⚙️ Admin</div>}
              {u.id===currentUser.id && <div style={{fontSize:10,opacity:.5,marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Vous</div>}
              <div style={{fontSize:11,opacity:.6,wordBreak:"break-all"}}>{u.email}</div>
              {nextEvt && <div style={{marginTop:6,fontSize:11,opacity:.65,borderTop:`1px solid ${u.id===currentUser.id?"rgba(255,255,255,.15)":T.border}`,paddingTop:5}}>📅 {nextEvt.title}</div>}
            </div>
          );
        })}
      </div>

      <div>
        <SectionTitle dot={T.accent} title="Rappels actifs" />
        {events.filter(e=>e.remind&&e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6).map(e=>{
          const d=daysUntil(e.date);
          const et=EVENT_TYPES[e.type]||EVENT_TYPES.autre;
          return (
            <div key={e.id} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:T.card,borderRadius:10,marginBottom:6,border:`1px solid ${T.border}`}}>
              <div style={{minWidth:32,height:32,borderRadius:8,background:et.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:700}}>
                {d===0?"AJ":d+"j"}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{e.title}</div>
                <div style={{fontSize:11,color:T.muted}}>{fmtDate(e.date)}{e.time?` · ${e.time}`:""}</div>
              </div>
            </div>
          );
        })}
        {events.filter(e=>e.remind&&e.date>=today()).length===0 && <EmptyState text="Aucun rappel actif" />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function SectionTitle({ dot, title }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}}/>
      <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.ink}}>{title}</h3>
    </div>
  );
}

function EventRow({ event, getUserById, onClick, compact }) {
  const et = EVENT_TYPES[event.type]||EVENT_TYPES.autre;
  const author = getUserById ? getUserById(event.authorId) : null;
  return (
    <div onClick={onClick} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",background:T.card,borderRadius:12,marginBottom:6,border:`1px solid ${T.border}`,cursor:onClick?"pointer":"default"}}>
      <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:et.color,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{event.title}</div>
        {!compact&&event.desc&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{event.desc}</div>}
        <div style={{fontSize:11,color:T.muted,marginTop:2}}>
          {fmtDate(event.date)}{event.time?` à ${event.time}`:""}
          {author&&!compact?` · ${author.name}`:""}
        </div>
      </div>
      <span style={{fontSize:10,background:et.bg,color:et.color,padding:"2px 7px",borderRadius:20,fontWeight:600,flexShrink:0}}>{et.label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",animation:"slideUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.ink}}>{title}</h2>
          <button onClick={onClose} style={{border:"none",background:T.warm,borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:14}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,fontWeight:600,color:error?T.accent:T.muted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>
      {children}
      {error && <p style={{fontSize:11,color:T.accent,marginTop:4}}>{error}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return <p style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0",fontStyle:"italic"}}>{text}</p>;
}

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
const labelStyle = { fontSize:12,fontWeight:500,color:T.muted,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em" };
const inputStyle = (err) => ({ width:"100%",padding:"11px 12px",border:`1.5px solid ${err?T.accent:T.border}`,borderRadius:10,fontSize:14,color:T.ink,background:T.warm,outline:"none",fontFamily:"'DM Sans',sans-serif" });
const pillBtn  = (bg,color) => ({ background:bg,color,border:"none",borderRadius:20,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500 });
const navBtnStyle = () => ({ border:`1px solid ${T.border}`,background:T.card,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,color:T.ink,fontFamily:"'DM Sans',sans-serif" });
