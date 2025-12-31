// app/components/Leaderboard.tsx
"use client"

import React, { useMemo } from 'react';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Top3Holders({timePeriod = 'Monthly', limit = 20, category = 'overall'}) {
    // Fetch data for the podium (using monthly data by default)
    const { data, loading, error } = useLeaderboardData(timePeriod, limit, category);

    // Get top 3 holders from profit data
    const topHolders = useMemo(() => {
        return data.profit.slice(0, 3).map(entry => ({
            id: entry.rank,
            rank: entry.rank,
            username: entry.username,
            profitLoss: entry.profit || 0,
            proxyAddress: entry.walletAddress,
            volume: entry.volume || null,
            avatar: entry.profileImage ||  `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(entry.username)}&backgroundColor=000000` // Fallback avatar'
        }));
    }, [data.profit]);

    return (
        <div className='w-full relative overflow-auto'>
            <h1 className='text-cyan-500 text-3xl sm:text-4xl md:text-5xl text-center mt-6 sm:mt-10 font-bold px-4'>Leaderboard</h1>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <span className="ml-3 text-white">Loading top players...</span>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-400">Failed to load leaderboard data</p>
                </div>
            ) : (
                <div className="podium-container">
                    {/* SVG Podium */}
                    <svg viewBox="0 0 600 400" className="podium-svg" preserveAspectRatio="xMidYMid meet">
                        {/* Center podium (1st place) */}
                        <rect x="230" y="140" width="140" height="200" rx="10" fill="#1a1e22" stroke="#33e0ff" strokeWidth="2" />
                        <text x="300" y="330" fill="#33e0ff" fontSize="24" fontWeight="bold" textAnchor="middle">1st</text>

                        {/* Left podium (2nd place) */}
                        <rect x="40" y="200" width="140" height="140" rx="10" fill="#181a1c" stroke="#485c5f" strokeWidth="2" />
                        <text x="110" y="330" fill="#485c5f" fontSize="20" fontWeight="bold" textAnchor="middle">2nd</text>

                        {/* Right podium (3rd place) */}
                        <rect x="420" y="240" width="140" height="100" rx="10" fill="#181a1c" stroke="#485c5f" strokeWidth="2" />
                        <text x="490" y="330" fill="#485c5f" fontSize="20" fontWeight="bold" textAnchor="middle">3rd</text>
                    </svg>

                    {/* Podium avatars and data */}
                    <div className="podium-users">
                        {/* 1st Place - Center */}
                        <div className="podium-user podium-first">
                            <Link href={`/user-profile/${topHolders[0]?.proxyAddress}`} className="flex flex-col items-center">
                                        <div className="avatar-wrapper avatar-first">
                                            <img
                                                src={topHolders[0]?.avatar}
                                                alt={topHolders[0]?.username}
                                                className="avatar-img avatar-img-first"

                                            />
                                        </div>
                                        <div className="medal">🥇</div>
                                        <div className="user-info">
                                            <p className="text-white font-semibold text-xs sm:text-sm">{topHolders[0]?.username}</p>
                                            <p className="text-green-400 font-bold text-sm sm:text-lg">
                                                {topHolders[0]?.profitLoss >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(topHolders[0]?.profitLoss || 0)}
                                            </p>
                                        </div>
                            </Link>
                        </div>

                        {/* 2nd Place - Left */}
                        <Link href={`/user-profile/${topHolders[1]?.proxyAddress}`} className="flex flex-col items-center">
                                    <div className="podium-user podium-second">
                                        <div className="avatar-wrapper avatar-second">
                                            <img
                                                src={topHolders[1]?.avatar}
                                                alt={topHolders[1]?.username}
                                                className="avatar-img avatar-img-second"
                                            />
                                        </div>
                                        <div className="medal medal-small">🥈</div>
                                        <div className="user-info">
                                            <p className="text-white font-semibold text-xs sm:text-sm">{topHolders[1]?.username}</p>
                                            <p className="text-green-400 font-bold text-sm sm:text-lg">
                                                {topHolders[1]?.profitLoss >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(topHolders[1]?.profitLoss || 0)}
                                            </p>
                                        </div>
                                    </div>
                        </Link>
                  

                        {/* 3rd Place - Right */}
                        <Link href={`/user-profile/${topHolders[2]?.proxyAddress}`} className="flex flex-col items-center">
                                    <div className="podium-user podium-third mt-5">
                                        <div className="avatar-wrapper avatar-second">
                                            <img
                                                src={topHolders[2]?.avatar}
                                                alt={topHolders[2]?.username}
                                                className="avatar-img avatar-img-second"
                                            />
                                        </div>
                                        <div className="medal medal-small">🥉</div>
                                        <div className="user-info mt-5">
                                            <p className="text-white font-semibold text-xs sm:text-sm">{topHolders[2]?.username}</p>
                                            <p className="text-green-400 font-bold text-sm sm:text-lg">
                                                {topHolders[2]?.profitLoss >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(topHolders[2]?.profitLoss || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    </Link>
                    </div>
                </div>
            )}


            <style jsx>{`
                .podium-container {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    margin: 30px auto;
                    padding: 0 20px;
                    aspect-ratio: 3 / 2;
                }

                @media (min-width: 640px) {
                    .podium-container {
                        margin: 60px auto;
                    }
                }

                .podium-svg {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }

                .podium-users {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .podium-user {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    transform: translateX(-50%);
                    text-align: center;
                }

                @media (min-width: 640px) {
                    .podium-user {
                        gap: 8px;
                    }
                }

                .podium-first {
                    left: 50%;
                    top: 10%;
                    z-index: 2;
                }

                .podium-second {
                    left: 18%;
                    top: 25%;
                    z-index: 1;
                }

                .podium-third {
                    left: 82%;
                    top: 25%;
                    z-index: 1;
                }

                .avatar-wrapper {
                    border-radius: 50%;
                    overflow: hidden;
                    padding: 2px;
                }

                @media (min-width: 640px) {
                    .avatar-wrapper {
                        padding: 3px;
                    }
                }

                .avatar-first {
                    border: 2px solid #33e0ff;
                    background: linear-gradient(45deg, #33e0ff, #1a8fb3);
                }

                @media (min-width: 640px) {
                    .avatar-first {
                        border-width: 3px;
                    }
                }

                .avatar-second {
                    border: 2px solid #485c5f;
                    background: #181a1c;
                }

                .avatar-img {
                    border-radius: 50%;
                    display: block;
                    width: 40px;
                    height: 40px;
                }

                @media (min-width: 640px) {
                    .avatar-img {
                        width: 50px;
                        height: 50px;
                    }
                }

                .avatar-img-first {
                    width: 50px;
                    height: 50px;
                }

                @media (min-width: 640px) {
                    .avatar-img-first {
                        width: 60px;
                        height: 60px;
                    }
                }

                .medal {
                    font-size: 20px;
                }

                @media (min-width: 640px) {
                    .medal {
                        font-size: 24px;
                    }
                }

                .medal-small {
                    font-size: 18px;
                }

                @media (min-width: 640px) {
                    .medal-small {
                        font-size: 20px;
                    }
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
            `}</style>
        </div>
    );
}