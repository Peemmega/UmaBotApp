export default function LoginPage({ appBase }) {
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

        <button
          onClick={() => {
            window.location.href = `${appBase}/login`;
          }}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02]"
        >
          Connect with Discord
        </button>
      </div>
    </div>
  );
}