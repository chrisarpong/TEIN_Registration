import { useEffect, useState } from 'react'
import logo from '../assets/1.png' // Utilizing 1.png per user request

export default function SplashScreen({ fadeOut }) {
    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tein-green/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-56 h-56 mb-8 relative rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                    {/* Logo Container */}
                    <img
                        src={logo}
                        alt="NDC Logo"
                        className="w-full h-full object-cover object-top animate-bounce-slight"
                    />
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-4 text-center px-4">
                    <span className="text-[#CE1126]">NDC</span> <span className="text-[#006B3F]">TEIN</span>-UCC
                </h1>

                <p className="text-gray-400 text-xs md:text-sm font-bold tracking-[0.3em] uppercase animate-pulse">
                    Loading Portal...
                </p>
            </div>

            {/* CSS for custom bounce if needed, or use tailwind animate-bounce */}
            <style>{`
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
                .animate-bounce-slight {
                    animation: bounce-slight 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}
