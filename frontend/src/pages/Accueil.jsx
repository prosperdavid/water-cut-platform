import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Droplet, Clock3, CircleCheck, UsersRound, Plus, ArrowRight, MapPin, TrendingUp, AlertCircle, Search, ArrowUpRight } from "lucide-react";
import MiniMap from "../components/MiniMap";
import { API_BASE_URL } from "../services/apiConfig";

const STATUS = {
  ACTIF: { label: "Coupure confirmée", tone: "danger" },
  A_CONFIRMER: { label: "À confirmer", tone: "warning" },
  RETABLISSEMENT_PROBABLE: { label: "Rétablissement probable", tone: "warning" },
  RETABLI: { label: "Eau rétablie", tone: "success" },
  REJETE: { label: "Signalement rejeté", tone: "neutral" },
};

function formatElapsed(input) {
  if (!input) return "Date inconnue";
  const time = new Date(input).getTime();
  const elapsed = Math.max(0, Date.now() - time);
  if (elapsed < 3600000) return `Il y a ${Math.max(1, Math.floor(elapsed / 60000))} min`;
  if (elapsed < 86400000) return `Il y a ${Math.floor(elapsed / 3600000)} h`;
  return new Date(input).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Metric({Icon,value,label,tone,hint}) {
  return (
    <div className="reference-metric">
      <div className={`reference-metric-icon tone-${tone}`}><Icon size={25} fill={tone==="danger" ? "currentColor" : "none"} aria-hidden="true"/></div>
      <div className="reference-metric-copy"><strong>{value}</strong><span>{label}</span><small>{hint}</small></div>
    </div>
  );
}

function IncidentRow({incident,onClick}) {
  const meta=STATUS[incident.statut]||STATUS.A_CONFIRMER;
  return (
    <button type="button" className="reference-incident-row" onClick={onClick}>
      <MapPin className={`reference-incident-marker tone-${meta.tone}`} size={21} aria-hidden="true"/>
      <span className="reference-incident-row-body">
        <span className="reference-incident-row-heading"><strong>{incident.zone_nom || "Quartier non précisé"}</strong><span className={`reference-status tone-${meta.tone}`}>{meta.label}</span></span>
        <span className="reference-incident-row-details">Confiance : {Math.round(Number(incident.score_confiance)||0)} % · {Number(incident.nombre_signalements)||0} signalement(s)</span>
      </span>
      <small>{formatElapsed(incident.date_creation||incident.date_debut)}</small>
      <ArrowRight size={16} className="reference-incident-arrow" aria-hidden="true"/>
    </button>
  );
}

function SignalChart({incidents}) {
  const days=Array.from({length:7},(_,index)=>{
    const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-6+index);
    const key=date.toLocaleDateString("en-CA");
    const items=incidents.filter(i=> {
      const d=new Date(i.date_creation||i.date_debut);
      return !Number.isNaN(d.getTime()) && d.toLocaleDateString("en-CA")===key;
    });
    return {
      key,
      label:date.toLocaleDateString("fr-FR",{day:"numeric",month:"short"}),
      active:items.filter(i=>i.statut==="ACTIF").length,
      pending:items.filter(i=>i.statut==="A_CONFIRMER"||i.statut==="RETABLISSEMENT_PROBABLE").length,
      restored:items.filter(i=>i.statut==="RETABLI").length,
    };
  });
  const maximum=Math.max(1,...days.map(d=>d.active+d.pending+d.restored));
  return (
    <div className="reference-chart" role="img" aria-label="Répartition des incidents enregistrés chaque jour sur les sept derniers jours">
      <div className="reference-chart-grid" aria-hidden="true"><span/><span/><span/><span/></div>
      <div className="reference-chart-bars">
        {days.map(d=>(
          <div className="reference-chart-day" key={d.key} title={`${d.label} : ${d.active} confirmé(s), ${d.pending} à confirmer, ${d.restored} rétabli(s)`}>
            <div className="reference-chart-bar" style={{height:`${100*(d.active+d.pending+d.restored)/maximum}%`}}>
              {d.restored>0&&<span className="reference-bar-green" style={{flex:d.restored}}/>}
              {d.pending>0&&<span className="reference-bar-orange" style={{flex:d.pending}}/>}
              {d.active>0&&<span className="reference-bar-red" style={{flex:d.active}}/>}
            </div>
            <span className="reference-chart-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Accueil() {
  const navigate=useNavigate();
  const [incidents,setIncidents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [reload,setReload]=useState(0);

  useEffect(()=>{
    let mounted=true;
    const token=localStorage.getItem("access_token");
    if(!token){navigate("/connexion");return undefined;}
    axios.get(`${API_BASE_URL}/api/incidents/`,{headers:{Authorization:`Bearer ${token}`}})
      .then(({data})=>{if(mounted)setIncidents(Array.isArray(data)?data:(data?.results||[]));})
      .catch(err=>{
        if(!mounted)return;
        if(err.response?.status===401){navigate("/connexion");}
        else setError("Impossible de charger les signalements. Vérifiez la connexion au serveur.");
      })
      .finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[navigate,reload]);

  const stats=useMemo(()=>{
    const active=incidents.filter(i=>i.statut==="ACTIF").length;
    const pending=incidents.filter(i=>i.statut==="A_CONFIRMER"||i.statut==="RETABLISSEMENT_PROBABLE").length;
    const restored=incidents.filter(i=>i.statut==="RETABLI").length;
    const reports=incidents.reduce((n,i)=>n+(Number(i.nombre_signalements)||0),0);
    return {active,pending,restored,reports};
  },[incidents]);

  const zones=useMemo(()=>{
    const grouped=new Map();
    incidents.filter(i=>i.statut!=="REJETE").forEach(i=>{
      const zone=i.zone_nom||"Autre quartier";
      grouped.set(zone,(grouped.get(zone)||0)+1);
    });
    return [...grouped].sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[incidents]);
  const maxZone=Math.max(1,...zones.map(([,count])=>count));
  const recent=incidents.filter(i=>i.statut!=="REJETE").slice(0,5);

  if(loading) return <div className="reference-loading" role="status">Chargement des informations de Toliara...</div>;
  if(error) return (
    <div className="reference-feedback" role="alert"><AlertCircle size={26}/><strong>Informations indisponibles</strong><p>{error}</p><button onClick={()=>{setError("");setLoading(true);setReload(i=>i+1);}}>Réessayer</button></div>
  );

  return (
    <div className="reference-dashboard">
      <div className="reference-dashboard-heading">
        <div>
          <div className="reference-overline">SUIVI CITOYEN · TOLIARA</div>
          <h1>L'eau, quartier<br className="reference-desktop-break"/> par quartier.</h1>
          <p>Informez, consultez, agissons ensemble.</p>
        </div>
        <button className="reference-primary reference-dashboard-cta" onClick={()=>navigate("/signaler")}><Plus size={22}/>Signaler une coupure</button>
      </div>

      <div className="reference-kpi-grid">
        <Metric Icon={Droplet} value={stats.active} label="Coupures confirmées" tone="danger" hint="Situation actuelle"/>
        <Metric Icon={Clock3} value={stats.pending} label="À confirmer" tone="warning" hint="Vérification en cours"/>
        <Metric Icon={CircleCheck} value={stats.restored} label="Eau rétablie" tone="success" hint="Incidents rétablis"/>
        <Metric Icon={UsersRound} value={stats.reports} label="Signalements citoyens" tone="info" hint="Total enregistré"/>
      </div>

      <div className="reference-primary-grid">
        <section className="reference-panel reference-map-panel">
          <div className="reference-panel-heading"><h2>Situation des coupures à Toliara</h2><button type="button" onClick={()=>navigate("/carte")}>Voir la carte complète <ArrowRight size={16}/></button></div>
          <div className="reference-home-map">
            <MiniMap incidents={incidents.filter(i=>i.statut!=="REJETE")} height={350} interactive onIncidentClick={i=>navigate(`/incidents/${i.id}`)}/>
            <div className="reference-map-legend"><span><i className="danger"/> Coupure confirmée</span><span><i className="warning"/> À confirmer</span><span><i className="success"/> Eau rétablie</span></div>
          </div>
        </section>

        <section className="reference-panel reference-feed-panel">
          <div className="reference-panel-heading"><h2>Derniers signalements</h2><button type="button" onClick={()=>navigate("/carte")}>Tout voir <ArrowRight size={16}/></button></div>
          <div className="reference-feed-items">
            {recent.length ? recent.map(incident=><IncidentRow key={incident.id} incident={incident} onClick={()=>navigate(`/incidents/${incident.id}`)}/>) :
              <div className="reference-empty"><Search size={27}/><strong>Aucun incident signalé</strong><p>Les déclarations de la communauté apparaîtront ici.</p></div>}
          </div>
        </section>
      </div>

      <div className="reference-secondary-grid">
        <section className="reference-panel reference-trends-panel">
          <div className="reference-panel-heading"><h2>Évolution des signalements</h2><span className="reference-time-chip">7 derniers jours</span></div>
          <SignalChart incidents={incidents}/>
          <div className="reference-chart-legend"><span><i className="danger"/> Coupures confirmées</span><span><i className="warning"/> À confirmer</span><span><i className="success"/> Eau rétablie</span></div>
        </section>

        <section className="reference-panel reference-ranking-panel">
          <div className="reference-panel-heading"><h2>Quartiers les plus concernés</h2><span className="reference-time-chip">Signalements enregistrés</span></div>
          {zones.length ? <div className="reference-ranking">
            {zones.map(([zone,count],index)=>(
              <button key={zone} className="reference-ranking-row" type="button" onClick={()=>navigate(`/carte?q=${encodeURIComponent(zone)}`)}>
                <span className="reference-rank">{index+1}</span><span className="reference-rank-name">{zone}</span>
                <span className="reference-rank-track"><span style={{width:`${100*count/maxZone}%`}}/></span>
                <small>{count} incident{count>1?"s":""}</small>
              </button>
            ))}
          </div> : <p className="reference-ranking-empty">Aucun quartier concerné actuellement.</p>}
        </section>
      </div>
    </div>
  );
}
