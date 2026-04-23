export default function ResourcePill({ label, value, icon }) {
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