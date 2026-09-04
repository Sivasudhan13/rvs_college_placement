import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { dsaAPI } from '../services/dsaApi';
import { useAuth } from '../context/AuthContext';

const deptLabel = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', other:'Other' };

const rankColor = ['bg-amber-400 text-white', 'bg-gray-400 text-white', 'bg-orange-400 text-white'];
const rankIcon  = ['🥇', '🥈', '🥉'];

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const DSALeaderboardPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [myRank,     setMyRank]     = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await dsaAPI.getLeaderboard({ page: p, limit: 20 });
      setEntries(data.leaderboard || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (p === 1 && user) {
        const my = (data.leaderboard || []).find(e => e.user._id === user.id);
        setMyRank(my || null);
      }
    } catch { toast.error('Failed to load leaderboard'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏆 DSA Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">Top coders ranked by score — Easy 10pts · Medium 25pts · Hard 50pts</p>
      </div>

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-extrabold text-white">
              {entries[1]?.user?.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-gray-800 text-center max-w-[80px] truncate">{entries[1]?.user?.name}</p>
            <p className="text-xs text-gray-500">{entries[1]?.totalSolved} solved</p>
            <div className="w-20 bg-gray-200 rounded-t-lg flex items-center justify-center py-4 text-2xl" style={{ height: 80 }}>🥈</div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center gap-2 -mb-2">
            <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-extrabold text-white">
              {entries[0]?.user?.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-gray-800 text-center max-w-[80px] truncate">{entries[0]?.user?.name}</p>
            <p className="text-xs text-gray-500">{entries[0]?.totalSolved} solved</p>
            <div className="w-20 bg-amber-300 rounded-t-lg flex items-center justify-center py-4 text-2xl" style={{ height: 110 }}>🥇</div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center text-xl font-extrabold text-white">
              {entries[2]?.user?.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-gray-800 text-center max-w-[80px] truncate">{entries[2]?.user?.name}</p>
            <p className="text-xs text-gray-500">{entries[2]?.totalSolved} solved</p>
            <div className="w-20 bg-orange-200 rounded-t-lg flex items-center justify-center py-4 text-2xl" style={{ height: 65 }}>🥉</div>
          </div>
        </div>
      )}

      {/* My rank banner */}
      {myRank && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Your Rank: <span className="text-primary">#{myRank.rank}</span></p>
            <p className="text-xs text-gray-500">{myRank.totalSolved} solved · {myRank.score} points · {myRank.currentStreak}d streak</p>
          </div>
          <button onClick={() => navigate('/dsa/progress')} className="text-xs text-primary font-semibold hover:underline flex-shrink-0">View Progress →</button>
        </div>
      )}

      {/* Leaderboard table */}
      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-1 text-right">Score</div>
            <div className="col-span-1 text-right">Solved</div>
            <div className="col-span-1 text-right">Easy</div>
            <div className="col-span-1 text-right">Med</div>
            <div className="col-span-1 text-right">Hard</div>
            <div className="col-span-1 text-right">Streak</div>
            <div className="col-span-1 text-right">Rate</div>
          </div>

          <div className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const isMe = entry.user._id === user?.id;
              return (
                <div key={entry.rank}
                  className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center transition-colors
                    ${isMe ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>

                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {entry.rank <= 3 ? (
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${rankColor[entry.rank-1]}`}>
                        {entry.rank}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
                    )}
                  </div>

                  {/* User */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {entry.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                        {entry.user.name} {isMe && <span className="text-[10px] text-primary/70">(you)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">{entry.user.studentId} · {deptLabel[entry.user.department]}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 text-right">
                    <span className="text-sm font-extrabold text-primary">{entry.score}</span>
                  </div>

                  {/* Solved */}
                  <div className="col-span-1 text-right text-sm font-semibold text-gray-700">{entry.totalSolved}</div>

                  {/* Easy */}
                  <div className="col-span-1 text-right text-xs text-green-600 font-medium">{entry.easySolved}</div>

                  {/* Medium */}
                  <div className="col-span-1 text-right text-xs text-yellow-600 font-medium">{entry.mediumSolved}</div>

                  {/* Hard */}
                  <div className="col-span-1 text-right text-xs text-red-600 font-medium">{entry.hardSolved}</div>

                  {/* Streak */}
                  <div className="col-span-1 text-right">
                    <span className="text-xs text-amber-600 font-semibold">{entry.currentStreak}d 🔥</span>
                  </div>

                  {/* Acceptance rate */}
                  <div className="col-span-1 text-right text-xs text-gray-500">{entry.acceptanceRate}%</div>
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <span className="text-4xl">🏆</span>
              <p className="text-sm">No rankings yet — be the first to solve a problem!</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-gray-100">
              <button onClick={() => { const p = Math.max(1,page-1); setPage(p); load(p); }} disabled={page===1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">← Prev</button>
              <span className="text-sm text-gray-600">{page} / {totalPages} · {total} users</span>
              <button onClick={() => { const p = Math.min(totalPages,page+1); setPage(p); load(p); }} disabled={page===totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DSALeaderboardPage;
