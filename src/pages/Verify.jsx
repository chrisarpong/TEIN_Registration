import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CheckCircle2, XCircle, ShieldCheck, Loader2, GraduationCap } from 'lucide-react'

export default function Verify() {
    const { id } = useParams()
    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchMember = async () => {
            try {
                if (!id) throw new Error("No ID provided")

                // Fetch by UUID (more secure and URL-safe)
                const { data, error } = await supabase
                    .from('members')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error || !data) throw error
                setMember(data)
            } catch (err) {
                console.error(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchMember()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-tein-green animate-spin mb-4" />
                <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Verifying Membership...</p>
            </div>
        )
    }

    // --- INVALID STATE ---
    if (error || !member) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-10 rounded-3xl max-w-sm w-full text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full"></div>

                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">Invalid Membership</h2>
                    <p className="text-red-300/80 text-sm mb-8">
                        This QR code does not match any active record in the TEIN-UCC database.
                    </p>

                    <Link to="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-white transition-colors">
                        Return to Portal
                    </Link>
                </div>
            </div>
        )
    }

    // --- VALID STATE ---
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tein-green/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-tein-red/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Header Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5">
                        <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-[10px] text-black">NDC</div>
                        <span className="text-xs font-bold text-gray-300">TEIN UCC <span className="text-tein-green">VERIFIED</span></span>
                    </div>
                </div>

                {/* ID Card Display */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative animate-in zoom-in duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    {/* Status Banner */}
                    <div className="bg-tein-green/20 border-b border-tein-green/20 p-4 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-tein-green fill-tein-green/20" />
                        <span className="text-tein-green font-black uppercase tracking-widest text-xs">Official Active Member</span>
                    </div>

                    <div className="p-8 text-center">
                        {/* Photo */}
                        <div className="w-32 h-32 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-tein-green to-emerald-600 rounded-full blur-xl opacity-40 animate-pulse"></div>
                            <div className="w-full h-full rounded-full border-4 border-black/50 bg-gray-800 overflow-hidden relative z-10 shadow-2xl">
                                {member.passport_url ? (
                                    <img src={member.passport_url} className="w-full h-full object-cover" alt="Member" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                        <GraduationCap className="w-12 h-12 text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 z-20 bg-tein-green rounded-full p-1.5 border-4 border-[#050505]">
                                <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        {/* Info */}
                        <h1 className="text-2xl font-black text-white mb-1 uppercase leading-tight">{member.full_name}</h1>
                        <p className="text-tein-green font-bold text-sm tracking-widest mb-6">{member.tein_id}</p>

                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Program</p>
                                <p className="text-xs text-gray-200 font-medium truncate">{member.program}</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Stats</p>
                                <p className="text-xs text-gray-200 font-medium">L{member.level} • {member.gender || 'N/A'}</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 col-span-2">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Constituency</p>
                                <p className="text-xs text-gray-200 font-medium">{member.constituency}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20 text-center">
                        <p className="text-[10px] text-gray-600 font-medium">
                            Verified at {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link to="/" className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                        Go to Portal Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
