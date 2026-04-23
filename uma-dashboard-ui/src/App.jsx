import React, { useEffect, useMemo, useState } from "react";

const APP_BASE = "https://umabotapp-production-c99a.up.railway.app"
const BOT_API_BASE  = "https://umadndbot-production.up.railway.app";

const mainStats = [
  { key: "speed", label: "Speed", icon: "⚡" },
  { key: "stamina", label: "Stamina", icon: "❤️" },
  { key: "power", label: "Power", icon: "💪" },
  { key: "gut", label: "Gut", icon: "🔥" },
  { key: "wit", label: "Wit", icon: "🧠" },
];

const aptitudeGroups = [
  {
    title: "Surface",
    items: [
      { key: "turf", label: "Turf" },
      { key: "dirt", label: "Dirt" },
    ],
  },
  {
    title: "Distance",
    items: [
      { key: "sprint", label: "Sprint" },
      { key: "mile", label: "Mile" },
      { key: "medium", label: "Medium" },
      { key: "long", label: "Long" },
    ],
  },
  {
    title: "Style",
    items: [
      { key: "front", label: "Front" },
      { key: "pace", label: "Pace" },
      { key: "late", label: "Late" },
      { key: "end_style", label: "End" },
    ],
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ title, accent = "indigo", children, action }) {
  const accentMap = {
    indigo: "text-indigo-300",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    fuchsia: "text-fuchsia-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className={cn("text-xl font-bold", accentMap[accent])}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function MiniBox({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-xs text-white/50">
        {icon ? <span>{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-white">{value ?? 0}</div>
    </div>
  );
}

function getStatGrade(value = 0) {
  if (value >= 1200) return "SS";
  if (value >= 1000) return "S";
  if (value >= 800) return "A";
  if (value >= 600) return "B";
  if (value >= 400) return "C";
  if (value >= 200) return "D";
  return "E";
}

function StatBar({ label, value = 0, icon, max = 1200 }) {
  const safeValue = Number(value) || 0;
  const percent = Math.min((safeValue / max) * 100, 100);
  const grade = getStatGrade(safeValue);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <span className="text-base">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/60">{grade}</span>
          <span className="text-lg font-bold text-white">{safeValue}</span>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AptitudeBadge({ label, value = 0 }) {
  const safeValue = Number(value) || 0;

  let color = "bg-zinc-700/60 text-zinc-100 border-zinc-500/30";
  if (safeValue >= 8) color = "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
  else if (safeValue >= 6) color = "bg-cyan-500/20 text-cyan-200 border-cyan-400/30";
  else if (safeValue >= 4) color = "bg-indigo-500/20 text-indigo-200 border-indigo-400/30";
  else if (safeValue >= 2) color = "bg-amber-500/20 text-amber-200 border-amber-400/30";

  return (
    <div className={cn("rounded-xl border px-3 py-2", color)}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-base font-bold">{safeValue}</div>
    </div>
  );
}

function ZoneBuildList({ build }) {
  const entries = Object.entries(build || {}).filter(([, value]) => Number(value) !== 0);

  if (!entries.length) {
    return <p className="text-sm text-white/50">ยังไม่มีการอัปเกรด Zone Build</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <span className="text-white/50">{key}</span>
          <span className="ml-2 font-bold text-cyan-300">+{value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_40%,#05030a_100%)] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-fuchsia-400" />
        <p className="text-white/70">Loading player data...</p>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_45%,#05030a_100%)] px-4 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-fuchsia-500/20 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 text-sm text-fuchsia-200">
          UmaDnD Dashboard
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
          Connect your
          <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            {" "}Discord Account
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-white/60">
          เข้าสู่ระบบเพื่อดูค่าสเตตัส โปรไฟล์ Zone และข้อมูลผู้เล่นของคุณใน UmaDnD
        </p>

        <button
          onClick={() => {
            window.location.href = `${APP_BASE}/login`;
          }}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-fuchsia-500/30"
        >
          Connect with Discord
        </button>
      </div>
    </div>
  );
}

function App() {
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

  const cacheKey = `player:${userId}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      setPlayer(JSON.parse(cached));
      setLoading(false);
    } catch {}
  }

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BOT_API_BASE}/player/${userId}`);
      if (!res.ok) throw new Error(`player API failed: ${res.status}`);

      const data = await res.json();
      setPlayer(data);
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  load();
}, [username, userId]);

  const avatarUrl = useMemo(() => {
    if (!userId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
  }, [userId, avatarHash]);

  if (!username) {
    return <LoginScreen />;
  }

  if (loading && !player) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_40%,#05030a_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/60">
              Player Dashboard
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              UmaDnD
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                {" "}Control Panel
              </span>
            </h1>
            <p className="mt-1 text-white/50">
              ดูค่าสเตตัส โปรไฟล์ และข้อมูลผู้เล่นของคุณ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRaw((prev) => !prev)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              {showRaw ? "ซ่อน Debug" : "แสดง Debug"}
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
              <div className="relative bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-500/10 px-6 pb-6 pt-8">
                <div className="text-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="profile"
                      className="mx-auto mb-4 h-28 w-28 rounded-full border-4 border-fuchsia-500/50 object-cover shadow-[0_0_35px_rgba(217,70,239,0.35)]"
                    />
                  ) : (
                    <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-fuchsia-500/50 bg-black/20 text-4xl">
                      👤
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-fuchsia-100">
                    {player?.username || username}
                  </h2>
                  <p className="mt-1 text-xs text-white/40">Discord ID: {userId}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniBox label="Stats Point" value={player?.stats_point} icon="📈" />
                  <MiniBox label="Skill Point" value={player?.skill_point} icon="🎯" />
                  <MiniBox label="Uma Coin" value={player?.uma_coin} icon="🪙" />
                  <MiniBox label="Players" value={statsSummary?.total_players ?? 0} icon="👥" />
                </div>
              </div>

              <div className="p-6">
                <SectionCard title="🌌 Zone" accent="cyan">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 text-sm text-white/50">Zone Name</div>
                      <div className="text-lg font-bold text-cyan-200">
                        {player?.zone?.name || "Default Zone"}
                      </div>

                      <div className="mt-4 text-sm text-white/50">Zone Points</div>
                      <div className="text-xl font-bold text-white">
                        {player?.zone?.points ?? 0}
                      </div>
                    </div>

                    {player?.zone?.image_url ? (
                      <img
                        src={player.zone.image_url}
                        alt="zone"
                        className="max-h-56 w-full rounded-2xl border border-white/10 object-cover"
                      />
                    ) : null}

                    <div>
                      <div className="mb-2 text-sm font-semibold text-white/70">
                        Zone Build
                      </div>
                      <ZoneBuildList build={player?.zone?.build} />
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:col-span-8">
            <SectionCard title="📊 Main Stats" accent="indigo">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {mainStats.map((item) => (
                  <StatBar
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    value={player?.[item.key]}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="🏇 Aptitude / Attitude" accent="emerald">
              <div className="space-y-5">
                {aptitudeGroups.map((group) => (
                  <div key={group.title}>
                    <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
                      {group.title}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {group.items.map((item) => (
                        <AptitudeBadge
                          key={item.key}
                          label={item.label}
                          value={player?.[item.key]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {showRaw && (
              <SectionCard title="🔍 Debug / Raw Data" accent="fuchsia">
                <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-green-300">
                  {JSON.stringify(
                    {
                      username,
                      userId,
                      avatarHash,
                      player,
                      statsSummary,
                    },
                    null,
                    2
                  )}
                </pre>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;