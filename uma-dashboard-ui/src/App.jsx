import React, { useState, useEffect } from 'react'; // ต้อง import useState และ useEffect ด้วย

function App() {
  const query = new URLSearchParams(window.location.search);
  const username = query.get('username');
  const userId = query.get('id');
  const avatarHash = query.get('avatar');

  // ย้าย Hook มาไว้ด้านบนสุด (ก่อน if-return) เพื่อป้องกัน Error
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (username) { // ดึงข้อมูลเฉพาะตอนที่ล็อกอินแล้ว
      fetch('http://localhost:8000/api/bot-stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error("Error fetching stats:", err));
    }
  }, [username]);

  // หน้า Login
  if (!username) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-sans">
        <div className="text-center p-10 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
          <h1 className="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            UmaDnD Dashboard
          </h1>
          <button 
            onClick={() => window.location.href = 'http://localhost:8000/login'}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            Connect with Discord
          </button>
        </div>
      </div>
    );
  }

  // หน้า Dashboard เมื่อ Login แล้ว
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* คอลัมน์ซ้าย: ข้อมูลโปรไฟล์ */}
        <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-center">
          <img 
            src={`https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`} 
            className="w-28 h-28 rounded-full mx-auto border-4 border-indigo-500 mb-4 shadow-xl"
            alt="profile"
          />
          <h2 className="text-2xl font-bold text-indigo-300">{username}</h2>
          <p className="text-gray-500 text-xs mb-4">ID: {userId}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-xs text-red-400 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* คอลัมน์ขวา: แสดงข้อมูลตัวเอง (Raw Data) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center">
              <span className="mr-2">📊</span> สถิติของคุณใน UmaDnD
            </h3>
            {/* ส่วนนี้จะแสดงข้อมูลที่คุณอยากเห็นว่ามีอะไรบ้าง */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-400 text-sm">จำนวนผู้เล่นรวม</p>
                  <p className="text-2xl font-mono text-indigo-400">{stats?.total_players || '0'}</p>
               </div>
               <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-400 text-sm">สถานะระบบ</p>
                  <p className="text-2xl font-mono text-green-400">Online</p>
               </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-purple-400">🔍 Raw Data (ตรวจสอบข้อมูล)</h3>
            <pre className="bg-black p-4 rounded-lg text-xs font-mono text-green-500 overflow-x-auto border border-gray-600">
              {JSON.stringify({ username, userId, avatarHash, stats }, null, 2)}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;