import { useEffect, useState } from 'react'
import logo from '../assets/2.png' // Utilizing 2.png as provisional logo

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
                <div className="w-32 h-32 mb-6 relative">
                    {/* Logo Container */}
                    <img
                        src={logo}
                        alt="NDC Logo"
                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce-slight"
                    />
                </div>

                <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">
                    <span className="text-[#CE1126]">NDC</span> <span className="text-[#006B3F]">TEIN</span>-UCC
                </h1>

                <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse">
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
