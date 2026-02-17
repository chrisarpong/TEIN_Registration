import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        } else {
            navigate('/admin/dashboard')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-tein-green/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-tein-red/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 overflow-hidden">
                {/* Tricolor Strip */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tein-red via-white to-tein-green"></div>

                <div className="text-center mb-8 pt-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group">
                        <ShieldCheck className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">TEIN COMMAND</h1>
                    <p className="text-gray-400 mt-2 text-sm font-medium">National Democratic Congress</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 group-focus-within:text-tein-green transition-colors">Admin Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/10 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 hover:bg-white/10"
                                placeholder="admin@tein-ucc.com"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 group-focus-within:text-tein-green transition-colors">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/10 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 hover:bg-white/10"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-tein-green to-emerald-600 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,104,55,0.4)] transition-all duration-300 transform hover:scale-[1.02] border border-white/10 relative overflow-hidden group/btn"
                    >
                        <span className="relative z-10">{loading ? 'Authenticating...' : 'Access Dashboard'}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    </button>
                </form>
            </div>
        </div>
    )
}
