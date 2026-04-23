import { gradeColor, statLetter } from "../utils/grade";

export default function StatCell({ icon, label, value }) {
  const letter = statLetter(value);

  return (
    <div className="flex flex-col items-center justify-center px-2 py-6 text-zinc-800">
      <div
        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradeColor(
          letter
        )} text-2xl font-black shadow-sm`}
      >
        {letter}
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="mt-1 text-2xl font-extrabold leading-none text-zinc-800">
          {value ?? 0}
        </div>
      </div>
    </div>
  );
}