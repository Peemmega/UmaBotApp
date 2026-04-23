import { zoneBuildMeta } from "../data/zoneMeta";

export default function ZoneEffectsGrid({ build }) {
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