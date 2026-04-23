import React, { useEffect, useMemo, useState } from "react";

// --- Configuration ---
const APP_BASE = "https://umabotapp-production-c99a.up.railway.app";
const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const mainStats = [
  { key: "speed", label: "Speed", icon: "⚡" },
  { key: "stamina", label: "Stamina", icon: "🤍" },
  { key: "power", label: "Power", icon: "💪" },
  { key: "gut", label: "Guts", icon: "🔥" },
  { key: "wit", label: "Wit", icon: "🎓" },
];

const aptitudeRows = [
  { title: "Track", items: [{ key: "turf", label: "Turf" }, { key: "dirt", label: "Dirt" }] },
  { title: "Distance", items: [{ key: "sprint", label: "Sprint" }, { key: "mile", label: "Mile" }, { key: "medium", label: "Medium" }, { key: "long", label: "Long" }] },
  { title: "Style", items: [{ key: "front", label: "Front" }, { key: "pace", label: "Pace" }, { key: "late", label: "Late" }, { key: "end_style", label: "End" }] },
];

const zoneBuildMeta = {
  flat: { label: "Flat Bonus", icon: "✨", format: (v) => `+${v} total` },
  add_dkh: { label: "Extra Dice", icon: "🎲", format: (v) => `+${v} d/kh` },
  floor: { label: "Roll Floor", icon: "🧱", format: (v) => `Floor +${v}` },
  selected_die: { label: "Selected Die", icon: "🎯", format: (v) => `+${v} selected die` },
  cap: { label: "Roll Cap", icon: "📈", format: (v) => `Cap +${v}` },
  self_heal_stamina: { label: "Stamina Heal", icon: "💚", format: (v) => `Heal ${v} STA` },
};

// --- Helpers ---
function statLetter(value = 0) {
  const v = Number(value) || 0;
  if (v >= 9) return "SS"; if (v >= 8) return "S"; if (v >= 7) return "A";
  if (v >= 6) return "B"; if (v >= 5) return "C"; if (v >= 4) return "D";
  if (v >= 3) return "E"; if (v >= 2) return "F"; return "G";
}

function gradeColor(letter) {
  const map = {
    SS: "from-yellow-300 to-orange-400 text-zinc-900",
    S: "from-orange-300 to-amber-400 text-zinc-900",
    A: "from-emerald-300 to-green-400 text-zinc-900",
    B: "from-cyan-300 to-sky-400 text-zinc-900",
    C: "from-lime-300 to-green-300 text-zinc-900",
    D: "from-sky-300 to-blue-400 text-zinc-900",
    E: "from-fuchsia-300 to-pink-400 text-zinc-900",
    F: "from-violet-300 to-purple-400 text-zinc-900",
    G: "from-zinc-300 to-zinc-400 text-zinc-900",
  };
  return map[letter] || map.G;
}

// --- Components ---
function ResourcePill({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md shadow-lg transition-transform hover:scale-105">
      <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-white">{value ?? 0}</span>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value }) {
  const letter = statLetter(value);
  return (
    <div className="flex flex-col items-center justify-center p-6 min-w-[120px] transition-colors hover:bg-white/5">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradeColor(letter)} text-2xl font-black shadow-lg mb-3`}>
        {letter}
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-white/40 uppercase">
          <span>{icon}</span> <span>{label}</span>
        </div>
        <div className="text-2xl font-black text-white mt-1">{value ?? 0}</div>
      </div>
    </div>
  );
}

function AptitudeItem({ label, value }) {
  const letter = statLetter(value);
  return (
    <div className="flex items-center justify-between min-w-[150px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-sm hover:border-white/30 transition-all">
      <span className="text-sm font-bold text-white/80">{label}</span>
      <span className={`rounded-lg px-2 py-1 text-lg font-black bg-gradient-to-br ${gradeColor(letter)}`}>
        {letter}
      </span>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const query = new URLSearchParams(window.location.search);
  const username = query.get("username");
  const userId = query.get("id");
  const avatarHash = query.get("avatar");

  const [player, setPlayer] = useState(null);
  const [statsSummary, setStatsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !userId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${BOT_API_BASE}/player/${userId}`),
          fetch(`${APP_BASE}/api/bot-stats`)
        ]);
        if (pRes.ok) setPlayer(await pRes.json());
        if (sRes.ok) setStatsSummary(await sRes.json());
      } catch (err) { setError("Failed to fetch data"); }
      setLoading(false);
    };
    loadData();
  }, [username, userId]);

  const avatarUrl = useMemo(() => userId && avatarHash ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png` : null, [userId, avatarHash]);

  if (!username) return <div className="text-white p-10 text-center">Please login via Discord.</div>;
  if (loading) return <div className="text-white p-10 text-center animate-pulse tracking-widest uppercase">Loading Stats...</div>;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white p-4 md:p-8 font-sans selection:bg-fuchsia-500/30">
      <div className="mx-auto max-w-6xl space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic">
              UMA DND <span className="text-fuchsia-500 font-normal not-italic text-2xl ml-2">DASHBOARD</span>
            </h1>
            <p className="text-white/40 mt-2 font-medium">Player identity and performance metrics</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowRaw(!showRaw)} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">
              {showRaw ? "HIDE DEBUG" : "SHOW DEBUG"}
            </button>
            <button onClick={() => window.location.href = '/'} className="px-5 py-2 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold hover:bg-red-500/40 transition-all">
              LOGOUT
            </button>
          </div>
        </header>

        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8 md:p-12 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-400 blur-lg opacity-40 animate-pulse"></div>
              <img src={avatarUrl || "https://via.placeholder.com/150"} alt="Avatar" className="relative h-40 w-40 rounded-full border-4 border-white/20 object-cover shadow-2xl" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-6xl font-black tracking-tight text-white mb-6 uppercase">{player?.username || username}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ResourcePill label="Uma Coins" value={player?.uma_coin} icon="🪙" />
                <ResourcePill label="Stats Points" value={player?.stats_point} icon="📈" />
                <ResourcePill label="Skill Points" value={player?.skill_point} icon="🎯" />
              </div>
            </div>
          </div>
        </section>

        {/* Main Stats - Horizontal Scroll */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.3em] pl-2">Core Attributes</h3>
          <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-md custom-scrollbar">
            <div className="flex flex-row divide-x divide-white/5">
              {mainStats.map((item) => (
                <StatCell key={item.key} icon={item.icon} label={item.label} value={player?.[item.key]} />
              ))}
            </div>
          </div>
        </section>

        {/* Aptitudes - The Fixed Part */}
        <section className="grid grid-cols-1 gap-8">
          {aptitudeRows.map((row) => (
            <div key={row.title} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.3em] whitespace-nowrap">{row.title} Aptitude</h3>
                <div className="h-[1px] w-full bg-white/5"></div>
              </div>
              <div className="flex flex-row gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {row.items.map((item) => (
                  <AptitudeItem key={item.key} label={item.label} value={player?.[item.key]} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Zone Section */}
        <section className="rounded-[3rem] border border-cyan-500/20 bg-cyan-500/5 p-8 md:p-12">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3 space-y-6">
              <div>
                <span className="text-cyan-400 text-xs font-black tracking-widest uppercase italic">Current Location</span>
                <h3 className="text-4xl font-black text-white mt-1">{player?.zone?.name || "The Frontier"}</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-white/40 uppercase font-bold">Zone Points</div>
                  <div className="text-4xl font-black text-cyan-400 mt-1">{player?.zone?.points ?? 0}</div>
                </div>
                <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-white/40 uppercase font-bold">Total Players in Region</div>
                  <div className="text-4xl font-black text-white mt-1">{statsSummary?.total_players ?? "--"}</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              {player?.zone?.image_url && (
                <img src={player.zone.image_url} alt="Zone" className="w-full h-64 object-cover rounded-[2rem] border border-white/10 shadow-2xl" />
              )}
              {/* Reuse your existing ZoneEffectsGrid or style it similarly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {Object.entries(player?.zone?.build || {}).map(([key, value]) => {
                   const meta = zoneBuildMeta[key];
                   if(!meta || Number(value) === 0) return null;
                   return (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase">
                        {meta.icon} {meta.label}
                      </div>
                      <div className="text-lg font-black text-cyan-300 mt-2">{meta.format(Number(value))}</div>
                    </div>
                   );
                 })}
              </div>
            </div>
          </div>
        </section>

        {/* Debug View */}
        {showRaw && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <pre className="p-8 rounded-[2rem] bg-black border border-white/10 text-emerald-400 text-xs overflow-x-auto shadow-2xl">
              {JSON.stringify(player, null, 2)}
            </pre>
          </div>
        )}

      </div>
      
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}