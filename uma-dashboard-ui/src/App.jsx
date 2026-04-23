import React, { useEffect, useMemo, useState } from "react";

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
  {
    title: "Track",
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

const zoneBuildMeta = {
  flat: { label: "Flat Bonus", icon: "✨", format: (v) => `+${v} total` },
  add_dkh: { label: "Extra Dice", icon: "🎲", format: (v) => `+${v} d/kh` },
  floor: { label: "Roll Floor", icon: "🧱", format: (v) => `Floor +${v}` },
  selected_die: { label: "Selected Die", icon: "🎯", format: (v) => `+${v} selected die` },
  cap: { label: "Roll Cap", icon: "📈", format: (v) => `Cap +${v}` },
  self_heal_stamina: { label: "Stamina Heal", icon: "💚", format: (v) => `Heal ${v} STA` },
};

function statLetter(value = 0) {
  const v = Number(value) || 0;
  if (v >= 9) return "SS";
  if (v >= 8) return "S";
  if (v >= 7) return "A";
  if (v >= 6) return "B";
  if (v >= 5) return "C";
  if (v >= 4) return "D";
  if (v >= 3) return "E";
  if (v >= 2) return "F";
  return "G";
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

function ResourcePill({ label, value, icon }) {
  return (
    <div className="rounded-full border border-white/15 bg-white/90 px-4 py-2 text-zinc-800 shadow-lg">
      <div className="text-xs font-semibold text-zinc-500">{label}</div>
      <div className="flex items-center gap-2 text-2xl font-bold">
        <span>{value ?? 0}</span>
        <span className="text-lg">{icon}</span>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value }) {
  const letter = statLetter(value);

  return (
    <div className="grid min-h-[120px] grid-cols-[88px_1fr] items-center border-r border-lime-500/30 bg-white/95 px-4 py-4 last:border-r-0">
      <div className="text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradeColor(
            letter
          )} text-3xl font-extrabold shadow-md`}
        >
          {letter}
        </div>
      </div>
      <div className="pl-3 text-zinc-800">
        <div className="mb-1 flex items-center gap-2 text-lg font-bold">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-4xl font-extrabold">{value ?? 0}</div>
      </div>
    </div>
  );
}

function AptitudeItem({ label, value }) {
  const letter = statLetter(value);
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 shadow-sm">
      <span className="text-lg font-semibold">{label}</span>
      <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xl font-extrabold text-zinc-600">
        {letter}
      </span>
    </div>
  );
}

function ZoneEffectsGrid({ build }) {
  const entries = Object.entries(build || {}).filter(([, v]) => Number(v) !== 0);

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-white/50">
        ยังไม่มีการอัปเกรด Zone Build
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => {
        const meta = zoneBuildMeta[key];
        if (!meta) return null;

        return (
          <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-cyan-300">
              {meta.format(Number(value))}
            </div>
          </div>
        );
      })}
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
      } catch {}
    }

    const loadPlayer = async () => {
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

    const loadStats = async () => {
      try {
        const res = await fetch(`${APP_BASE}/api/bot-stats`);
        if (!res.ok) return;
        const data = await res.json();
        setStatsSummary(data);
      } catch (err) {
        console.error("stats load error:", err);
      }
    };

    loadPlayer();
    loadStats();
  }, [username, userId]);

  const avatarUrl = useMemo(() => {
    if (!userId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
  }, [userId, avatarHash]);

  if (!username) return <LoginScreen />;
  if (loading && !player) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_40%,#05030a_100%)] px-3 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/50">Player Dashboard</div>
            <h1 className="text-3xl font-extrabold md:text-5xl">UmaDnD Control Panel</h1>
          </div>

          <div className="flex flex-wrap gap-3">
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
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-lime-500/20 bg-white/90 shadow-2xl">
          <div className="bg-gradient-to-r from-lime-400 to-lime-500 px-6 py-4">
            <h2 className="text-center text-3xl font-extrabold text-white md:text-5xl">Profile</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 bg-[linear-gradient(180deg,#bdd7ff_0%,#dce8ff_100%)] px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="profile"
                  className="h-48 w-48 rounded-full border-[8px] border-yellow-300 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-full border-[8px] border-yellow-300 bg-white text-6xl shadow-xl">
                  👤
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="border-b-4 border-white/80 pb-3 text-center lg:text-left">
                <div className="text-4xl font-extrabold text-amber-900 drop-shadow md:text-6xl">
                  {player?.username || username}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <ResourcePill label="Uma Coins" value={player?.uma_coin} icon="🪙" />
                <ResourcePill label="Stats Points" value={player?.stats_point} icon="📈" />
                <ResourcePill label="Skill Points" value={player?.skill_point} icon="🎯" />
              </div>
            </div>
          </div>

          <div className="border-t border-lime-500/20 bg-zinc-100 px-4 py-4">
            <div className="grid grid-cols-1 overflow-hidden rounded-[1.5rem] border border-lime-500/40 bg-white lg:grid-cols-5">
              {mainStats.map((item) => (
                <StatCell
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={player?.[item.key]}
                />
              ))}
            </div>

            <div className="mt-5 space-y-4 rounded-[1.5rem] border border-zinc-200 bg-white p-5">
              {aptitudeRows.map((row) => (
                <div
                  key={row.title}
                  className="grid grid-cols-1 gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center"
                >
                  <div className="text-2xl font-bold text-amber-900">{row.title}</div>
                  <div
                    className={`grid gap-3 ${
                      row.items.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 lg:grid-cols-4"
                    }`}
                  >
                    {row.items.map((item) => (
                      <AptitudeItem
                        key={item.key}
                        label={item.label}
                        value={player?.[item.key]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-cyan-300">🌌 Zone</h3>
              <p className="mt-1 text-sm text-white/45">
                แสดงผล Zone และการอัปเกรดตามข้อมูลในบอท
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Zone Name</div>
                  <div className="mt-2 text-xl font-bold text-cyan-200">
                    {player?.zone?.name || "Default Zone"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Zone Points</div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {player?.zone?.points ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">Players</div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {statsSummary?.total_players ?? "-"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {player?.zone?.image_url ? (
                  <img
                    src={player.zone.image_url}
                    alt="zone"
                    className="max-h-72 w-full rounded-2xl border border-white/10 object-cover"
                  />
                ) : null}

                <ZoneEffectsGrid build={player?.zone?.build} />
              </div>
            </div>
          </div>

          {showRaw && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-4 text-xl font-bold text-fuchsia-300">🔍 Debug / Raw Data</h3>
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;