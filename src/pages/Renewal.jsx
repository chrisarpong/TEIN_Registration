import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search, UserCheck, ShieldCheck, AlertCircle, RefreshCw, CreditCard, CheckCircle2 } from 'lucide-react'
import { usePaystackPayment } from 'react-paystack'

export default function Renewal() {
    const [searchId, setSearchId] = useState('')
    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // 1. SEARCH FUNCTION
    const handleSearch = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMember(null)

        try {
            // Find the student by exact TEIN ID
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('tein_id', searchId.trim())
                .single()

            if (error || !data) throw new Error('Member not found. Check your ID.')

            setMember(data)
        } catch (err) {
            setError('Invalid TEIN ID. Please double-check and try again.')
        } finally {
            setLoading(false)
        }
    }

    // 2. PAYSTACK CONFIG (5 GHS)
    const config = {
        reference: (new Date()).getTime().toString(),
        email: "renewal@tein-ucc.com",
        amount: 500, // 5 GHS (in pesewas)
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    }

    const initializePayment = usePaystackPayment(config)

    // 3. SUCCESS HANDLER
    const handlePaymentSuccess = async (reference) => {
        setLoading(true)
        try {
            // Record the Payment
            const { error } = await supabase.from('payments').insert([{
                member_id: member.id,
                amount: 5.00,
                payment_type: 'Renewal',
                reference: reference.reference,
                status: 'Success'
            }])

            if (error) throw error
            setSuccess(true)

        } catch (err) {
            alert("Payment recorded failed: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    // --- RENDER: SUCCESS STATE ---
    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tein-green/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-tein-red/20 rounded-full blur-[120px] animate-pulse"></div>

                <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] max-w-md w-full text-center border border-white/10 relative z-10 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-gradient-to-br from-tein-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-tein-green/30">
                        <ShieldCheck className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Renewal Complete!</h2>
                    <p className="text-gray-400 text-sm">
                        Thank you, <span className="font-bold text-tein-green">{member.full_name}</span>.
                    </p>

                    <div className="bg-white/5 p-6 rounded-2xl my-8 border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Receipt Reference</p>
                        <p className="text-white font-mono text-sm mb-4 break-all">{config.reference}</p>

                        <div className="h-px w-full bg-white/10 mb-4"></div>

                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Amount Paid</p>
                        <p className="text-2xl font-black text-white">GHS 5.00</p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-xl font-bold text-tein-green bg-tein-green/10 hover:bg-tein-green/20 border border-tein-green/20 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Renew Another Account
                    </button>
                </div>
            </div>
        )
    }

    // --- RENDER: SEARCH & PAY FORM ---
    return (
        <div className="min-h-[100dvh] bg-[#050505] py-20 px-4 relative overflow-hidden flex flex-col items-center justify-center">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-tein-green/10 rounded-full blur-[150px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-tein-red/10 rounded-full blur-[150px] opacity-40 pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10">

                {/* Header */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 shadow-2xl border border-white/10 backdrop-blur-md">
                        <RefreshCw className="w-8 h-8 text-tein-green" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Member Renewal</h1>
                    <p className="text-gray-400 font-medium">Pay your semester dues securely.</p>
                </div>

                {/* Search Box */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    {!member ? (
                        <div className="p-8">
                            <div className="bg-gradient-to-r from-tein-green/20 to-emerald-900/20 p-6 rounded-2xl border border-tein-green/20 mb-8">
                                <label className="block text-tein-green text-xs font-black uppercase tracking-widest mb-3">Enter Your TEIN ID</label>
                                <form onSubmit={handleSearch} className="relative group">
                                    <Search className="absolute left-4 top-4 text-tein-green/50 w-5 h-5 group-focus-within:text-tein-green transition-colors" />
                                    <input
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        placeholder="e.g. 26/1300"
                                        className="w-full pl-12 pr-20 py-4 bg-black/40 rounded-xl text-white placeholder-gray-600 outline-none border border-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 transition-all shadow-inner font-mono"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-tein-green to-emerald-600 text-white px-6 rounded-lg text-sm font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Find'}
                                    </button>
                                </form>
                            </div>

                            {/* Info Text */}
                            <div className="text-center space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-400 justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-tein-green" />
                                    <span>Instant Verification</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-400 justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-tein-green" />
                                    <span>Secure Payment (5 GHS)</span>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Member Found & Payment
                        <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-500 relative">
                            <button
                                onClick={() => setMember(null)}
                                className="absolute top-6 right-6 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                            >
                                CHANGE ID
                            </button>

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center mb-4 border-2 border-tein-green shadow-[0_0_20px_rgba(0,168,89,0.3)]">
                                    <UserCheck className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{member.full_name}</h3>
                                <p className="text-tein-green text-sm font-bold uppercase tracking-widest mb-4">{member.program}</p>

                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Level</p>
                                        <p className="text-white font-mono">{member.level}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">ID Number</p>
                                        <p className="text-white font-mono">{member.tein_id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => initializePayment(handlePaymentSuccess)}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-tein-green to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(0,168,89,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {loading ? 'Processing...' : (
                                        <>
                                            <span>Pay Renewal (GHS 5.00)</span>
                                            <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Secured by Paystack
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
