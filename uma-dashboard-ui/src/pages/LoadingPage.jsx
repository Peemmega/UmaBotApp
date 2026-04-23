export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1a1333_0%,#090611_40%,#05030a_100%)] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-fuchsia-400" />
        <p className="text-white/70">Loading player data...</p>
      </div>
    </div>
  );
}