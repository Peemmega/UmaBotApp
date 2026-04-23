import { statLetter } from "../utils/grade";

export default function AptitudeItem({ label, value }) {
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