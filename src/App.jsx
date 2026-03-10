
import { useState, useEffect, useCallback, useRef } from "react";

// ── PALETTE & DESIGN TOKENS ──────────────────────────────────────────────────
const T = {
  ink: "#0f1923",
  paper: "#f7f3ee",
  warm: "#ede8df",
  card: "#fffcf8",
  accent: "#d94f3d",
  blue: "#2b6cb0",
  gold: "#c89b2a",
  sage: "#4a7c59",
  muted: "#7a7060",
  border: "#ddd5c5",
};

// ── STORAGE HELPERS ──────────────────────────────────────────────────────────
const KEYS = {
  users: "dp_users",
  events: "dp_events",
  annonces: "dp_annonces",
  resources: "dp_resources",
  session: "dp_session",
};

async function storeGet(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function storeSet(key, val) {
  try {
    await window.storage.set(key, JSON.stringify(val), true);
  } catch (e) { console.error(e); }
}

// ── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id: "u1", name: "M. Moreau", role: "Direction", email: "moreau@ecole.fr", password: "direct123", color: "#d94f3d", initials: "MM" },
  { id: "u2", name: "Mme Bertrand", role: "CM1", email: "bertrand@ecole.fr", password: "cm1pass", color: "#2b6cb0", initials: "LB" },
  { id: "u3", name: "M. Lefèvre", role: "CM2", email: "lefevre@ecole.fr", password: "cm2pass", color: "#4a7c59", initials: "TL" },
  { id: "u4", name: "Mme Martin", role: "CE2", email: "martin@ecole.fr", password: "ce2pass", color: "#8b5cf6", initials: "AM" },
  { id: "u5", name: "Mme Dupont", role: "CE1", email: "dupont@ecole.fr", password: "ce1pass", color: "#c89b2a", initials: "SD" },
];

const SEED_EVENTS = [
  { id: "e1", title: "Conseil des maîtres", date: "2026-03-26", time: "17:00", type: "reunion", desc: "Ordre du jour à transmettre avant le 20/03", authorId: "u1", remind: true },
  { id: "e2", title: "Réunion de parents CP", date: "2026-03-18", time: "18:00", type: "parents", desc: "Salle polyvalente — 18h à 19h30", authorId: "u1", remind: true },
  { id: "e3", title: "Sortie musée CE2/CM1", date: "2026-03-19", time: "08:30", type: "sortie", desc: "Musée des Sciences. Retour 16h.", authorId: "u2", remind: true },
  { id: "e4", title: "Vacances de printemps", date: "2026-04-04", time: "", type: "vacances", desc: "Du 4 au 20 avril", authorId: "u1", remind: false },
  { id: "e5", title: "Journée pédagogique", date: "2026-04-28", time: "09:00", type: "pedago", desc: "Formation numérique — école fermée", authorId: "u1", remind: true },
  { id: "e6", title: "Kermesse de l'école", date: "2026-05-15", time: "14:00", type: "evenement", desc: "14h – 18h, avec les familles", authorId: "u1", remind: true },
];

const SEED_ANNONCES = [
  { id: "a1", tag: "urgent", title: "Fermeture exceptionnelle vendredi 14 mars", body: "Suite à des travaux urgents, l'école sera fermée vendredi 14 mars. Les parents ont été informés par SMS.", authorId: "u1", date: "2026-03-10" },
  { id: "a2", tag: "event", title: "Sortie pédagogique — Musée des Sciences", body: "La sortie est confirmée pour le jeudi 19 mars. Départ 8h30. Retour 16h. Autorisations avant le 16/03.", authorId: "u2", date: "2026-03-09" },
  { id: "a3", tag: "info", title: "Nouveau protocole ENT Classe", body: "À partir du 16 mars, l'ENT Classe remplace l'ancien cahier de textes. Formation mardi 11/03 à 17h.", authorId: "u3", date: "2026-03-08" },
];

const SEED_RESOURCES = [
  { id: "r1", title: "Calendrier scolaire 2025-2026", type: "pdf", url: "https://www.education.gouv.fr", desc: "Calendrier officiel Education nationale", authorId: "u1", date: "2026-09-01" },
  { id: "r2", title: "Règlement intérieur de l'école", type: "doc", url: "", desc: "Version mise à jour — septembre 2025", authorId: "u1", date: "2026-09-01" },
  { id: "r3", title: "Projet d'école 2024-2027", type: "doc", url: "", desc: "Axes pédagogiques et objectifs", authorId: "u1", date: "2026-09-01" },
];

// ── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  home:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  calendar:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  bell:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  chat:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  folder:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  plus:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:18,height:18}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  trash:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  link:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>,
};

const EVENT_TYPES = {
  reunion:   { label: "Réunion",        color: "#2b6cb0", bg: "#ebf4ff" },
  parents:   { label: "Parents",        color: "#8b5cf6", bg: "#f3f0ff" },
  sortie:    { label: "Sortie",         color: "#4a7c59", bg: "#f0faf2" },
  vacances:  { label: "Vacances",       color: "#c89b2a", bg: "#fffbeb" },
  pedago:    { label: "Pédagogique",    color: "#d94f3d", bg: "#fff5f5" },
  evenement: { label: "Événement",      color: "#0891b2", bg: "#ecfeff" },
  autre:     { label: "Autre",          color: "#7a7060", bg: "#f5f3ef" },
};

const TAG_MAP = {
  urgent: { label: "Urgent",    textColor: "#d94f3d", bg: "#fff5f5" },
  info:   { label: "Info",      textColor: "#2b6cb0", bg: "#ebf4ff" },
  event:  { label: "Événement", textColor: "#c89b2a", bg: "#fffbeb" },
  news:   { label: "Nouveauté", textColor: "#4a7c59", bg: "#f0faf2" },
};

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// ── UTILITIES ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,10); }
function today() { return new Date().toISOString().slice(0,10); }
function fmtDate(iso) {
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function daysUntil(iso) {
  const diff = new Date(iso) - new Date(today());
  return Math.ceil(diff / 86400000);
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null); // {userId}
  const [users, setUsers]     = useState([]);
  const [events, setEvents]   = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded]   = useState(false);
  const [toast, setToast]     = useState(null);
  const toastTimer = useRef(null);

  // ── INIT ──
  useEffect(() => {
    (async () => {
      let u = await storeGet(KEYS.users);
      if (!u || u.length === 0) { u = SEED_USERS; await storeSet(KEYS.users, u); }
      let e = await storeGet(KEYS.events);
      if (!e) { e = SEED_EVENTS; await storeSet(KEYS.events, e); }
      let a = await storeGet(KEYS.annonces);
      if (!a) { a = SEED_ANNONCES; await storeSet(KEYS.annonces, a); }
      let r = await storeGet(KEYS.resources);
      if (!r) { r = SEED_RESOURCES; await storeSet(KEYS.resources, r); }
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

  // ── AUTH ──
  const login = async (email, password) => {
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) return false;
    const s = { userId: u.id };
    setSession(s);
    await storeSet(KEYS.session, s);
    return true;
  };

  const logout = async () => {
    setSession(null);
    await storeSet(KEYS.session, null);
  };

  // ── SHARED MUTATIONS ──
  const saveEvents = async (ev) => { setEvents(ev); await storeSet(KEYS.events, ev); };
  const saveAnnonces = async (an) => { setAnnonces(an); await storeSet(KEYS.annonces, an); };
  const saveResources = async (rs) => { setResources(rs); await storeSet(KEYS.resources, rs); };

  const currentUser = users.find(u => u.id === session?.userId);

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.paper,flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:`3px solid ${T.border}`,borderTop:`3px solid ${T.ink}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:T.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Chargement…</p>
    </div>
  );

  if (!session || !currentUser) return (
    <LoginScreen users={users} onLogin={login} />
  );

  return (
    <MainApp
      currentUser={currentUser}
      users={users}
      events={events}
      annonces={annonces}
      resources={resources}
      onSaveEvents={saveEvents}
      onSaveAnnonces={saveAnnonces}
      onSaveResources={saveResources}
      onLogout={logout}
      showToast={showToast}
      toast={toast}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ users, onLogin }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const ok = await onLogin(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!ok) setError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
  };

  return (
    <div style={{minHeight:"100vh",background:T.ink,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.ink}; }
        input { font-family: 'DM Sans', sans-serif !important; }
      `}</style>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:48,marginBottom:8}}>📚</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",color:T.paper,fontSize:32,letterSpacing:"-1px"}}>
          Digi<span style={{color:T.gold}}>Pad</span>
        </h1>
        <p style={{color:"#6b6050",fontSize:13,marginTop:4,letterSpacing:".1em",textTransform:"uppercase"}}>Espace enseignants</p>
      </div>

      {/* Card */}
      <div style={{background:T.card,borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:380,boxShadow:"0 24px 60px rgba(0,0,0,.35)"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:24,color:T.ink}}>Connexion</h2>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:500,color:T.muted,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Email</label>
          <input
            type="email" value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="prenom.nom@ecole.fr"
            style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.border}`,borderRadius:10,fontSize:15,color:T.ink,background:T.warm,outline:"none"}}
          />
        </div>

        <div style={{marginBottom:8}}>
          <label style={{fontSize:12,fontWeight:500,color:T.muted,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Mot de passe</label>
          <input
            type="password" value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="••••••••"
            style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.border}`,borderRadius:10,fontSize:15,color:T.ink,background:T.warm,outline:"none"}}
          />
        </div>

        {error && <p style={{color:T.accent,fontSize:13,marginBottom:12,background:"#fff5f5",padding:"8px 12px",borderRadius:8,border:`1px solid #fecaca`}}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{width:"100%",padding:"14px",background:T.ink,color:T.paper,border:"none",borderRadius:10,fontSize:15,fontWeight:500,cursor:"pointer",marginTop:8,fontFamily:"'DM Sans',sans-serif",opacity:loading?.7:1}}
        >{loading ? "Connexion…" : "Se connecter"}</button>

        <div style={{marginTop:20,padding:"14px",background:T.warm,borderRadius:10,border:`1px solid ${T.border}`}}>
          <p style={{fontSize:11,color:T.muted,marginBottom:8,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em"}}>Comptes de démonstration :</p>
          {users.slice(0,3).map(u => (
            <p key={u.id} style={{fontSize:12,color:T.muted,lineHeight:1.6}}>
              <span style={{color:T.ink,fontWeight:500}}>{u.email}</span> / <span>{u.password}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP (authenticated)
// ══════════════════════════════════════════════════════════════════════════════
function MainApp({ currentUser, users, events, annonces, resources, onSaveEvents, onSaveAnnonces, onSaveResources, onLogout, showToast, toast }) {
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
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background: ${T.ink}; }
        input, textarea, select { font-family: 'DM Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        @keyframes slideUp { from { transform: translateY(16px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .page { animation: slideUp .25s ease; }
      `}</style>

      {/* TOP BAR */}
      <TopBar currentUser={currentUser} onLogout={onLogout} reminderCount={upcomingReminders.length} />

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {tab === "home"      && <HomeTab currentUser={currentUser} users={users} events={events} annonces={annonces} getUserById={getUserById} upcomingReminders={upcomingReminders} />}
        {tab === "calendar"  && <CalendarTab currentUser={currentUser} events={events} users={users} onSaveEvents={onSaveEvents} showToast={showToast} getUserById={getUserById} />}
        {tab === "annonces"  && <AnnoncesTab currentUser={currentUser} annonces={annonces} users={users} onSaveAnnonces={onSaveAnnonces} showToast={showToast} getUserById={getUserById} />}
        {tab === "resources" && <ResourcesTab currentUser={currentUser} resources={resources} users={users} onSaveResources={onSaveResources} showToast={showToast} getUserById={getUserById} />}
        {tab === "team"      && <TeamTab users={users} currentUser={currentUser} events={events} />}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav tab={tab} setTab={setTab} reminderCount={upcomingReminders.length} />

      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
          background: toast.type==="ok" ? T.ink : T.accent,
          color:"white",padding:"10px 20px",borderRadius:24,fontSize:13,
          boxShadow:"0 8px 24px rgba(0,0,0,.3)",zIndex:999,
          animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",
          whiteSpace:"nowrap",maxWidth:"90vw",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ currentUser, onLogout, reminderCount }) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{background:T.ink,color:T.paper,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,letterSpacing:"-.5px"}}>
        📚 Digi<span style={{color:T.gold}}>Pad</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {reminderCount > 0 && (
          <div style={{background:T.accent,color:"white",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>
            {reminderCount} rappel{reminderCount>1?"s":""}
          </div>
        )}
        <div
          onClick={() => setMenu(!menu)}
          style={{width:34,height:34,borderRadius:"50%",background:currentUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",userSelect:"none"}}
        >{currentUser.initials}</div>
      </div>
      {menu && (
        <div style={{position:"absolute",top:60,right:16,background:T.card,borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,.2)",padding:"8px",zIndex:100,minWidth:160,animation:"fadeIn .15s ease"}}>
          <div style={{padding:"8px 12px",fontSize:13,color:T.muted,borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
            <div style={{fontWeight:600,color:T.ink}}>{currentUser.name}</div>
            <div style={{fontSize:11}}>{currentUser.role}</div>
          </div>
          <button
            onClick={() => { setMenu(false); onLogout(); }}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:T.accent,fontFamily:"'DM Sans',sans-serif",borderRadius:8}}
          ><Icon.logout /> Déconnexion</button>
        </div>
      )}
    </div>
  );
}

// ── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab, reminderCount }) {
  const items = [
    { id:"home",      icon:<Icon.home />,     label:"Accueil"   },
    { id:"calendar",  icon:<Icon.calendar />, label:"Calendrier" },
    { id:"annonces",  icon:<Icon.chat />,     label:"Annonces"  },
    { id:"resources", icon:<Icon.folder />,   label:"Ressources" },
    { id:"team",      icon:<Icon.bell />,     label:"Équipe"    },
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.card,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,0)"}}>
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => setTab(it.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0",border:"none",background:"transparent",cursor:"pointer",color: tab===it.id ? T.ink : T.muted,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:tab===it.id?600:400,position:"relative"}}
        >
          {it.id==="team" && reminderCount>0 && (
            <div style={{position:"absolute",top:6,right:"25%",width:8,height:8,background:T.accent,borderRadius:"50%",border:"2px solid "+T.card}}/>
          )}
          <div style={{opacity:tab===it.id?1:.6}}>{it.icon}</div>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════════════════════════════════════
function HomeTab({ currentUser, events, annonces, getUserById, upcomingReminders }) {
  const todayStr = today();
  const todayEvents = events.filter(e => e.date === todayStr).sort((a,b)=>a.time.localeCompare(b.time));
  const nextEvents  = events.filter(e => e.date > todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const recentAnnonces = [...annonces].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);

  const d = new Date();
  const dayName = d.toLocaleDateString("fr-FR",{weekday:"long"});
  const dateFmt = d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"});

  return (
    <div className="page" style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:20}}>
      {/* Header greeting */}
      <div style={{background:T.ink,borderRadius:16,padding:"20px 18px",color:T.paper}}>
        <p style={{fontSize:12,color:"#6b6050",textTransform:"capitalize",letterSpacing:".05em"}}>{dayName} {dateFmt}</p>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginTop:4}}>Bonjour, {currentUser.name.split(" ").pop()} 👋</h2>
        <p style={{fontSize:13,color:"#9a9088",marginTop:6}}>{currentUser.role} — École primaire</p>
      </div>

      {/* Rappels urgents */}
      {upcomingReminders.length > 0 && (
        <div>
          <SectionTitle dot={T.accent} title="Rappels à venir" />
          {upcomingReminders.map(e => {
            const d = daysUntil(e.date);
            const et = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.card,borderRadius:12,marginBottom:8,border:`1px solid ${T.border}`,borderLeft:`4px solid ${et.color}`}}>
                <div style={{textAlign:"center",minWidth:36}}>
                  <div style={{fontSize:18,fontWeight:700,color:et.color,fontFamily:"'Playfair Display',serif"}}>{d===0?"AJ":d}</div>
                  <div style={{fontSize:9,color:T.muted,textTransform:"uppercase"}}>{d===0?"aujourd'hui":"jours"}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{e.title}</div>
                  <div style={{fontSize:12,color:T.muted}}>{fmtDate(e.date)}{e.time ? ` à ${e.time}`:""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Aujourd'hui */}
      <div>
        <SectionTitle dot={T.blue} title="Aujourd'hui" />
        {todayEvents.length === 0
          ? <EmptyState text="Aucun événement aujourd'hui" />
          : todayEvents.map(e => <EventRow key={e.id} event={e} getUserById={getUserById} />)
        }
      </div>

      {/* Prochains événements */}
      <div>
        <SectionTitle dot={T.gold} title="Prochains événements" />
        {nextEvents.length === 0
          ? <EmptyState text="Aucun événement à venir" />
          : nextEvents.map(e => <EventRow key={e.id} event={e} getUserById={getUserById} compact />)
        }
      </div>

      {/* Annonces récentes */}
      <div>
        <SectionTitle dot={T.sage} title="Dernières annonces" />
        {recentAnnonces.map(a => {
          const t = TAG_MAP[a.tag] || TAG_MAP.info;
          const author = getUserById(a.authorId);
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
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null); // iso date
  const [modal, setModal] = useState(false);
  const [editEvt, setEditEvt] = useState(null);

  const firstDow = new Date(year, month, 1).getDay();
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = today();

  const eventsThisMonth = events.filter(e => {
    const [y,m] = e.date.split("-");
    return parseInt(y)===year && parseInt(m)===(month+1);
  });

  const selectedEvents = selected
    ? events.filter(e => e.date === selected).sort((a,b)=>a.time.localeCompare(b.time))
    : [];

  const prevMo = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMo = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const openAdd = () => { setEditEvt(null); setModal(true); };
  const openEdit = (ev) => { setEditEvt(ev); setModal(true); };

  const saveEvent = async (ev) => {
    let updated;
    if (editEvt) {
      updated = events.map(e => e.id===ev.id ? ev : e);
    } else {
      updated = [ev, ...events];
    }
    await onSaveEvents(updated);
    setModal(false);
    showToast(editEvt ? "✏️ Événement modifié" : "✅ Événement ajouté");
  };

  const deleteEvent = async (id) => {
    await onSaveEvents(events.filter(e=>e.id!==id));
    setSelected(null);
    showToast("🗑️ Événement supprimé");
  };

  return (
    <div className="page" style={{padding:"16px",display:"flex",flexDirection:"column",gap:16}}>
      {/* Cal nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={prevMo} style={navBtn()}>◀</button>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>{MONTHS_FR[month]} {year}</h2>
        <button onClick={nextMo} style={navBtn()}>▶</button>
      </div>

      {/* Day names */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>
        {DAYS_FR.map(d=><div key={d} style={{fontSize:11,color:T.muted,padding:"4px 0",fontWeight:500}}>{d}</div>)}
      </div>

      {/* Days */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const d = i+1;
          const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const dayEvts = eventsThisMonth.filter(e=>e.date===iso);
          const isToday = iso === todayStr;
          const isSel   = iso === selected;
          const dow = new Date(year,month,d).getDay();
          const isWknd = dow===0||dow===6;

          return (
            <div
              key={d}
              onClick={()=>setSelected(iso===selected?null:iso)}
              style={{
                aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                borderRadius:10,cursor:"pointer",position:"relative",
                background: isSel ? T.ink : isToday ? "#1a2e3b" : "transparent",
                color: isSel||isToday ? T.paper : isWknd ? T.muted : T.ink,
                fontWeight: isToday||isSel ? 700 : 400,
                fontSize:14,
                border: isSel ? "none" : isToday ? `2px solid ${T.ink}` : "none",
              }}
            >
              {d}
              {dayEvts.length>0 && (
                <div style={{display:"flex",gap:2,position:"absolute",bottom:3}}>
                  {dayEvts.slice(0,3).map((e,i)=>(
                    <div key={i} style={{width:5,height:5,borderRadius:"50%",background:(EVENT_TYPES[e.type]||EVENT_TYPES.autre).color,opacity: isSel||isToday?.8:1}}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Events of selected day */}
      {selected && (
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{fmtDate(selected)}</div>
            <button onClick={openAdd} style={{...pill(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"6px 12px"}}><Icon.plus/>Ajouter</button>
          </div>
          {selectedEvents.length===0
            ? <EmptyState text="Aucun événement ce jour" />
            : selectedEvents.map(e=>(
              <EventCard key={e.id} event={e} getUserById={getUserById} onEdit={()=>openEdit(e)} onDelete={()=>deleteEvent(e.id)} canEdit={e.authorId===currentUser.id||currentUser.role==="Direction"} />
            ))
          }
        </div>
      )}

      {!selected && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <SectionTitle dot={T.blue} title="Tous les événements" />
            <button onClick={()=>{setSelected(todayStr);openAdd();}} style={{...pill(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"6px 12px"}}><Icon.plus/>Ajouter</button>
          </div>
          {events.sort((a,b)=>a.date.localeCompare(b.date)).filter(e=>e.date>=todayStr).slice(0,8).map(e=>(
            <EventRow key={e.id} event={e} getUserById={getUserById} onClick={()=>setSelected(e.date)} />
          ))}
        </div>
      )}

      {modal && (
        <EventModal
          event={editEvt}
          defaultDate={selected||todayStr}
          currentUser={currentUser}
          onSave={saveEvent}
          onClose={()=>setModal(false)}
        />
      )}
    </div>
  );
}

function EventCard({ event, getUserById, onEdit, onDelete, canEdit }) {
  const et = EVENT_TYPES[event.type] || EVENT_TYPES.autre;
  const author = getUserById(event.authorId);
  return (
    <div style={{padding:"12px 14px",background:T.card,borderRadius:12,marginBottom:8,border:`1px solid ${T.border}`,borderLeft:`4px solid ${et.color}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:11,background:et.bg,color:et.color,padding:"1px 8px",borderRadius:20,fontWeight:600}}>{et.label}</span>
            {event.remind && <span style={{fontSize:11,color:T.muted}}>🔔</span>}
          </div>
          <div style={{fontSize:15,fontWeight:600,color:T.ink}}>{event.title}</div>
          {event.time && <div style={{fontSize:12,color:T.muted}}>⏰ {event.time}</div>}
          {event.desc  && <div style={{fontSize:12,color:T.muted,marginTop:3}}>{event.desc}</div>}
          {author && <div style={{fontSize:11,color:T.muted,marginTop:4}}>Par {author.name}</div>}
        </div>
        {canEdit && (
          <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
            <button onClick={onEdit}  style={{...iconBtn(),color:T.blue}}>✏️</button>
            <button onClick={onDelete} style={{...iconBtn(),color:T.accent}}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventModal({ event, defaultDate, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(event ? {...event} : {
    id: uid(), title:"", date: defaultDate, time:"", type:"reunion", desc:"", authorId: currentUser.id, remind: true
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <Modal title={event?"Modifier l'événement":"Nouvel événement"} onClose={onClose}>
      <FormField label="Titre">
        <input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Titre de l'événement" />
      </FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FormField label="Date">
          <input style={inputStyle()} type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
        </FormField>
        <FormField label="Heure">
          <input style={inputStyle()} type="time" value={form.time} onChange={e=>set("time",e.target.value)} />
        </FormField>
      </div>
      <FormField label="Type">
        <select style={inputStyle()} value={form.type} onChange={e=>set("type",e.target.value)}>
          {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </FormField>
      <FormField label="Description">
        <textarea style={{...inputStyle(),minHeight:72,resize:"vertical"}} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Informations complémentaires…"/>
      </FormField>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0"}}>
        <input type="checkbox" id="remind" checked={form.remind} onChange={e=>set("remind",e.target.checked)} style={{width:16,height:16,accentColor:T.ink}}/>
        <label htmlFor="remind" style={{fontSize:13,color:T.ink,cursor:"pointer"}}>🔔 Activer le rappel (7 jours avant)</label>
      </div>
      <button onClick={()=>{if(form.title)onSave(form);}} style={{...pill(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {event?"Enregistrer les modifications":"Ajouter l'événement"}
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
    .filter(a => filter==="all" || a.tag===filter)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b.date.localeCompare(a.date));

  const save = async (ann) => {
    let updated = editAnn
      ? annonces.map(a=>a.id===ann.id?ann:a)
      : [ann, ...annonces];
    await onSaveAnnonces(updated);
    setModal(false);
    showToast(editAnn ? "✏️ Annonce modifiée" : "📢 Annonce publiée !");
  };

  const del = async (id) => {
    await onSaveAnnonces(annonces.filter(a=>a.id!==id));
    showToast("🗑️ Annonce supprimée");
  };

  return (
    <div className="page" style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Annonces</h2>
        <button onClick={()=>{setEditAnn(null);setModal(true);}} style={{...pill(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"8px 14px"}}><Icon.plus/>Nouveau</button>
      </div>

      {/* Search */}
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px"}}>
        <span style={{color:T.muted}}>🔍</span>
        <input style={{border:"none",background:"transparent",flex:1,fontSize:14,outline:"none",color:T.ink}} placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {[["all","Tout"],["urgent","🔴 Urgent"],["info","🔵 Info"],["event","🟡 Événement"],["news","🟢 Nouveauté"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{...pill(filter===k?T.ink:T.card, filter===k?T.paper:T.muted),border:`1px solid ${filter===k?T.ink:T.border}`,fontSize:12,padding:"6px 12px",whiteSpace:"nowrap",flexShrink:0}}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length===0
        ? <EmptyState text="Aucune annonce trouvée" />
        : filtered.map(a=>{
          const t = TAG_MAP[a.tag] || TAG_MAP.info;
          const author = getUserById(a.authorId);
          const canEdit = a.authorId===currentUser.id || currentUser.role==="Direction";
          return (
            <div key={a.id} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,borderLeft:`4px solid ${t.textColor}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,background:t.bg,color:t.textColor,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{t.label}</span>
                  <span style={{fontSize:11,color:T.muted}}>{fmtDate(a.date)}</span>
                </div>
                {canEdit && (
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{setEditAnn(a);setModal(true);}} style={{...iconBtn(),color:T.blue}}>✏️</button>
                    <button onClick={()=>del(a.id)} style={{...iconBtn(),color:T.accent}}>🗑️</button>
                  </div>
                )}
              </div>
              <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:4,fontFamily:"'Playfair Display',serif"}}>{a.title}</div>
              <div style={{fontSize:13,color:"#3a3530",lineHeight:1.55}}>{a.body}</div>
              {author && <div style={{fontSize:11,color:T.muted,marginTop:6}}>Publié par <strong>{author.name}</strong></div>}
            </div>
          );
        })
      }

      {modal && <AnnonceModal ann={editAnn} currentUser={currentUser} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

function AnnonceModal({ ann, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(ann ? {...ann} : { id:uid(), tag:"info", title:"", body:"", authorId:currentUser.id, date:today() });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <Modal title={ann?"Modifier l'annonce":"Nouvelle annonce"} onClose={onClose}>
      <FormField label="Catégorie">
        <select style={inputStyle()} value={form.tag} onChange={e=>set("tag",e.target.value)}>
          {Object.entries(TAG_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </FormField>
      <FormField label="Titre">
        <input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Titre de l'annonce" />
      </FormField>
      <FormField label="Message">
        <textarea style={{...inputStyle(),minHeight:100,resize:"vertical"}} value={form.body} onChange={e=>set("body",e.target.value)} placeholder="Rédigez votre message…" />
      </FormField>
      <button onClick={()=>{if(form.title&&form.body)onSave(form);}} style={{...pill(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {ann?"Enregistrer":"Publier l'annonce"}
      </button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESOURCES TAB
// ══════════════════════════════════════════════════════════════════════════════
function ResourcesTab({ currentUser, resources, users, onSaveResources, showToast, getUserById }) {
  const [modal, setModal] = useState(false);
  const [editRes, setEditRes] = useState(null);

  const save = async (res) => {
    let updated = editRes
      ? resources.map(r=>r.id===res.id?res:r)
      : [res, ...resources];
    await onSaveResources(updated);
    setModal(false);
    showToast(editRes?"✏️ Ressource modifiée":"📁 Ressource ajoutée !");
  };

  const del = async (id) => {
    await onSaveResources(resources.filter(r=>r.id!==id));
    showToast("🗑️ Ressource supprimée");
  };

  const typeIcon = { pdf:"📄", doc:"📝", link:"🔗", image:"🖼️", video:"🎬" };

  return (
    <div className="page" style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Ressources</h2>
        <button onClick={()=>{setEditRes(null);setModal(true);}} style={{...pill(T.ink,T.paper),display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"8px 14px"}}><Icon.plus/>Ajouter</button>
      </div>

      <p style={{fontSize:13,color:T.muted}}>Partagez documents, liens et fichiers utiles avec l'équipe.</p>

      {resources.length===0
        ? <EmptyState text="Aucune ressource partagée" />
        : resources.map(r=>{
          const author = getUserById(r.authorId);
          const canEdit = r.authorId===currentUser.id || currentUser.role==="Direction";
          return (
            <div key={r.id} style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:28,flexShrink:0}}>{typeIcon[r.type]||"📎"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:12,color:T.muted,marginBottom:4,lineHeight:1.4}}>{r.desc}</div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12,color:T.blue,textDecoration:"none"}}>
                    <Icon.link/> Ouvrir le lien
                  </a>
                )}
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>
                  {author ? `Par ${author.name}` : ""}{r.date ? ` · ${fmtDate(r.date)}`:""}
                </div>
              </div>
              {canEdit && (
                <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                  <button onClick={()=>{setEditRes(r);setModal(true);}} style={{...iconBtn(),color:T.blue}}>✏️</button>
                  <button onClick={()=>del(r.id)} style={{...iconBtn(),color:T.accent}}>🗑️</button>
                </div>
              )}
            </div>
          );
        })
      }

      {modal && <ResourceModal res={editRes} currentUser={currentUser} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

function ResourceModal({ res, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(res ? {...res} : { id:uid(), title:"", type:"doc", url:"", desc:"", authorId:currentUser.id, date:today() });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <Modal title={res?"Modifier la ressource":"Nouvelle ressource"} onClose={onClose}>
      <FormField label="Titre">
        <input style={inputStyle()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Nom de la ressource" />
      </FormField>
      <FormField label="Type">
        <select style={inputStyle()} value={form.type} onChange={e=>set("type",e.target.value)}>
          {[["doc","📝 Document"],["pdf","📄 PDF"],["link","🔗 Lien web"],["image","🖼️ Image"],["video","🎬 Vidéo"]].map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
      </FormField>
      <FormField label="URL / Lien (optionnel)">
        <input style={inputStyle()} value={form.url} onChange={e=>set("url",e.target.value)} placeholder="https://…" />
      </FormField>
      <FormField label="Description">
        <textarea style={{...inputStyle(),minHeight:72,resize:"vertical"}} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Description courte…"/>
      </FormField>
      <button onClick={()=>{if(form.title)onSave(form);}} style={{...pill(T.ink,T.paper),width:"100%",padding:14,fontSize:14,justifyContent:"center",display:"flex",marginTop:4}}>
        {res?"Enregistrer":"Ajouter la ressource"}
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
    <div className="page" style={{padding:"16px",display:"flex",flexDirection:"column",gap:16}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Équipe enseignante</h2>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {users.map(u=>{
          const userEvents = events.filter(e=>e.authorId===u.id&&e.date>=todayStr).slice(0,1);
          return (
            <div key={u.id} style={{background:u.id===currentUser.id?T.ink:T.card,borderRadius:14,padding:"14px",border:`1px solid ${u.id===currentUser.id?T.ink:T.border}`,color:u.id===currentUser.id?T.paper:T.ink}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",flexShrink:0}}>{u.initials}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{u.name}</div>
                  <div style={{fontSize:11,opacity:.7}}>{u.role}</div>
                </div>
              </div>
              {u.id===currentUser.id && <div style={{fontSize:10,opacity:.6,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em"}}>Vous</div>}
              <div style={{fontSize:11,opacity:.6}}>{u.email}</div>
              {userEvents.length>0 && (
                <div style={{marginTop:8,fontSize:11,opacity:.7,borderTop:`1px solid ${u.id===currentUser.id?"rgba(255,255,255,.15)":T.border}`,paddingTop:6}}>
                  Prochain : {userEvents[0].title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rappels actifs */}
      <div>
        <SectionTitle dot={T.accent} title="Rappels actifs" />
        {events.filter(e=>e.remind&&e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6).map(e=>{
          const d = daysUntil(e.date);
          const et = EVENT_TYPES[e.type]||EVENT_TYPES.autre;
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
  const et = EVENT_TYPES[event.type] || EVENT_TYPES.autre;
  const author = getUserById(event.authorId);
  return (
    <div onClick={onClick} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",background:T.card,borderRadius:12,marginBottom:6,border:`1px solid ${T.border}`,cursor:onClick?"pointer":"default"}}>
      <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:et.color,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{event.title}</div>
        {!compact && event.desc && <div style={{fontSize:11,color:T.muted,marginTop:2}}>{event.desc}</div>}
        <div style={{fontSize:11,color:T.muted,marginTop:2}}>
          {fmtDate(event.date)}{event.time ? ` à ${event.time}` : ""}
          {author && !compact ? ` · ${author.name}` : ""}
        </div>
      </div>
      <span style={{fontSize:10,background:et.bg,color:et.color,padding:"2px 7px",borderRadius:20,fontWeight:600,flexShrink:0}}>{et.label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"20px 18px 32px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",animation:"slideUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.ink}}>{title}</h2>
          <button onClick={onClose} style={{border:"none",background:T.warm,borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.muted}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,fontWeight:600,color:T.muted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <p style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0",fontStyle:"italic"}}>{text}</p>;
}

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
const navBtn = () => ({ border:`1px solid ${T.border}`, background:T.card, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:12, color:T.ink, fontFamily:"'DM Sans',sans-serif" });
const pill   = (bg,color) => ({ background:bg, color, border:"none", borderRadius:20, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500 });
const iconBtn = () => ({ border:"none", background:"transparent", cursor:"pointer", padding:"4px 6px", fontSize:14, borderRadius:6, fontFamily:"'DM Sans',sans-serif" });
const inputStyle = () => ({ width:"100%", padding:"11px 12px", border:`1.5px solid ${T.border}`, borderRadius:10, fontSize:14, color:T.ink, background:T.warm, outline:"none", fontFamily:"'DM Sans',sans-serif" });
