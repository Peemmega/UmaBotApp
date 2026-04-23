import React from "react";
import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import ResourcePill from "../components/ResourcePill";
import StatCell from "../components/StatCell";
import AptitudeItem from "../components/AptitudeItem";
import ZoneEffectsGrid from "../components/ZoneEffectsGrid";

export default function DashboardPage({
  username,
  userId,
  avatarHash,
  avatarUrl,
  player,
  statsSummary,
  showRaw,
  setShowRaw,
  error,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_40%,#05030a_100%)] px-3 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/50">Player Dashboard</div>
            <h1 className="text-3xl font-extrabold md:text-5xl">
              UmaDnD Control Panel
            </h1>
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
            <h2 className="text-center text-3xl font-extrabold text-white md:text-5xl">
              Profile
            </h2>
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
        </section>

        <section className="rounded-[2rem] border border-lime-500/20 bg-zinc-100 px-4 py-4 shadow-2xl">
          <div className="mb-3 text-center text-2xl font-extrabold text-zinc-800">
            Main Stats
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-lime-500/40 bg-white shadow-inner md:grid-cols-3 xl:grid-cols-5">
            {mainStats.map((item) => (
              <div
                key={item.key}
                className="border-r border-lime-500/10 last:border-r-0"
              >
                <StatCell
                  icon={item.icon}
                  label={item.label}
                  value={player?.[item.key]}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-2xl">
          <div className="mb-5 text-center text-2xl font-extrabold text-zinc-800">
            Aptitude / Attitude
          </div>

          <div className="space-y-4">
            {aptitudeRows.map((row) => (
              <div
                key={row.title}
                className="grid grid-cols-1 gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center"
              >
                <div className="text-2xl font-bold text-amber-900">
                  {row.title}
                </div>

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
                  <div className="text-xs uppercase tracking-wide text-white/45">
                    Zone Name
                  </div>
                  <div className="mt-2 text-xl font-bold text-cyan-200">
                    {player?.zone?.name || "Default Zone"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">
                    Zone Points
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {player?.zone?.points ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/45">
                    Players
                  </div>
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
              <h3 className="mb-4 text-xl font-bold text-fuchsia-300">
                🔍 Debug / Raw Data
              </h3>
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