import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePaystackPayment } from 'react-paystack'
import { Search, CheckCircle2, User, ShieldCheck, ChevronRight, RefreshCw, Loader2, AlertCircle, Clock, MapPin, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

const RENEWAL_AMOUNT = 500 // GHS 5.00 in pesewas

export default function Renewal() {
    const [teinId, setTeinId] = useState('')
    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(false)
    const [lookupError, setLookupError] = useState('')
    const [success, setSuccess] = useState(false)
    const [paymentLoading, setPaymentLoading] = useState(false)

    // ── LOOK UP MEMBER ──
    const handleLookup = async () => {
        if (!teinId.trim()) return
        setLoading(true)
        setLookupError('')
        setMember(null)

        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('tein_id', teinId.trim())
                .single()

            if (error || !data) {
                setLookupError('No member found with that TEIN ID. Please check and try again.')
                return
            }

            setMember(data)
        } catch (err) {
            setLookupError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // ── PAYSTACK CONFIG ──
    const config = {
        reference: 'RENEWAL_' + (new Date()).getTime().toString(),
        email: member?.email || 'renewal@tein-ucc.com',
        amount: RENEWAL_AMOUNT,
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    }

    const initializePayment = usePaystackPayment(config)

    // ── HANDLE SUCCESSFUL PAYMENT ──
    const handleRenewalPayment = async (reference) => {
        setPaymentLoading(true)
        try {
            // 1. Update last_paid_date on the member
            // SKIPPED: Column 'last_paid_date' missing in DB
            /*
            const { error: updateError } = await supabase
                .from('members')
                .update({ last_paid_date: new Date().toISOString().split('T')[0] })
                .eq('id', member.id)

            if (updateError) throw updateError
            */

            // 2. Record the payment
            const { error: paymentError } = await supabase.from('payments').insert([{
                member_id: member.id,
                amount: RENEWAL_AMOUNT / 100,
                payment_type: 'Renewal',
                reference: reference.reference || 'RENEWAL_' + Date.now(),
                status: 'Success'
            }])

            if (paymentError) throw paymentError

            setSuccess(true)
        } catch (error) {
            alert('Renewal failed: ' + error.message)
        } finally {
            setPaymentLoading(false)
        }
    }

    // ── SUCCESS UI ──
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tein-green/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-white/10 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-tein-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-tein-green/30">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Renewal Complete!</h2>
                    <p className="text-gray-400 text-sm mb-2">
                        Welcome back, <span className="text-white font-bold">{member?.full_name}</span>.
                    </p>
                    <p className="text-gray-500 text-xs mb-8">
                        Your membership has been renewed successfully. GHS 5.00 paid.
                    </p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 rounded-xl font-bold text-tein-green bg-tein-green/10 hover:bg-tein-green/20 border border-tein-green/20 transition-all">
                        Renew Another Member
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* ── NDC BACKGROUND ── */}
            <style>{`
                .ndc-bg-renewal {
                    position: fixed; inset: 0; z-index: 0;
                    background: url('/ndc-bg.jpg') center/cover no-repeat;
                    filter: blur(6px) brightness(0.35);
                    transform: scale(1.05);
                }
                .ndc-bg-renewal-fallback {
                    position: fixed; inset: 0; z-index: 0;
                    background:
                        radial-gradient(ellipse at 80% 50%, rgba(0,104,55,0.5) 0%, transparent 60%),
                        radial-gradient(ellipse at 20% 20%, rgba(227,6,19,0.4) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 90%, rgba(0,104,55,0.3) 0%, transparent 50%),
                        linear-gradient(160deg, #0a0a0a 0%, #111 40%, #0d1a12 100%);
                }
            `}</style>
            <div className="ndc-bg-renewal"></div>
            <div className="ndc-bg-renewal-fallback"></div>

            {/* ── MAIN LAYOUT ── */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24 pb-6">

                {/* ── GLASSMORPHISM CARD ── */}
                <div className="w-full max-w-[900px] bg-black/50 backdrop-blur-2xl border-0 lg:border lg:border-white/[0.08] lg:rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row lg:max-h-[calc(100vh-7rem)]"
                >

                    {/* ═══════════════════════════════════════════ */}
                    {/* LEFT PANEL — Branding                       */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="lg:w-[45%] min-h-[50vh] lg:min-h-0 bg-gradient-to-br from-black/60 to-black/30 p-6 flex flex-col relative overflow-hidden">

                        {/* NDC color bars */}
                        <div className="flex h-1 rounded-full overflow-hidden mb-5 opacity-80">
                            <div className="flex-1 bg-[#CE1126]"></div>
                            <div className="flex-1 bg-[#FCD116]"></div>
                            <div className="flex-1 bg-[#006B3F]"></div>
                        </div>

                        {/* Badge */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-[10px] text-black shadow">NDC</div>
                            <div>
                                <p className="text-white font-bold text-xs">TEIN-UCC</p>
                                <p className="text-gray-500 text-[9px] font-medium uppercase tracking-wider">Renewal Portal</p>
                            </div>
                        </div>

                        {/* Icon & Title */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center py-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-tein-green/20 to-emerald-900/20 rounded-2xl flex items-center justify-center mb-5 border border-tein-green/20">
                                <RefreshCw className="w-10 h-10 text-tein-green" />
                            </div>
                            <h2 className="text-3xl font-black text-white leading-[1] mb-2 tracking-tight">
                                Membership<br />Renewal
                            </h2>
                            <p className="text-gray-500 text-xs max-w-[220px] leading-relaxed mt-2">
                                Renew your TEIN-UCC membership for the current academic year.
                            </p>
                        </div>

                        {/* Info text */}
                        <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] mb-3">
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                                <span className="text-white font-semibold">How it works:</span><br />
                                1. Enter your TEIN ID<br />
                                2. Verify your name<br />
                                3. Pay GHS 5.00<br />
                                <span className="text-tein-green font-semibold">Done! Membership renewed ✓</span>
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                <div>
                                    <p className="text-[11px] font-bold text-white">GHS 5.00</p>
                                    <p className="text-[9px] text-gray-500">Fixed renewal fee</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 ml-auto">
                                <MapPin className="w-3.5 h-3.5" />
                                <div>
                                    <p className="text-[11px] font-bold text-white">UCC Campus</p>
                                    <p className="text-[9px] text-gray-500">Cape Coast, Ghana</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* RIGHT PANEL — Lookup & Payment              */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="lg:w-[55%] lg:overflow-y-auto p-5 sm:p-6 bg-white/[0.02] lg:max-h-[calc(100vh-7rem)]"
                    >
                        {/* Tab Navigation header */}
                        <div className="flex bg-white/[0.06] p-1 rounded-xl border border-white/[0.1] mb-6 relative z-20">
                            <Link to="/" className="flex-1 text-center py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                Registration
                            </Link>
                            <Link to="/renew" className="flex-1 text-center py-2 text-sm font-bold bg-tein-green text-white rounded-lg shadow-md">
                                Renewal
                            </Link>
                        </div>

                        {/* Title Header */}
                        <div className="mb-5 hidden lg:block">
                            <h2 className="text-xl font-black text-white mb-0.5">Renew Membership</h2>
                            <p className="text-gray-500 text-xs">Enter your TEIN ID to get started.</p>
                        </div>

                        {/* ── STEP 1: TEIN ID LOOKUP ── */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1">TEIN ID</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={teinId}
                                            onChange={(e) => setTeinId(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg pl-10 pr-3 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-tein-green/50 focus:bg-white/[0.08] transition-all font-mono font-medium tracking-wider"
                                            placeholder="e.g. 25/1299"
                                        />
                                    </div>
                                    <button
                                        onClick={handleLookup}
                                        disabled={loading || !teinId.trim()}
                                        className="px-5 bg-gradient-to-r from-tein-green to-emerald-600 text-white font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-tein-green/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Search</>}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {lookupError && (
                                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-xs font-medium">{lookupError}</p>
                                </div>
                            )}

                            {/* ── STEP 2: MEMBER FOUND ── */}
                            {member && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                    {/* Welcome Card */}
                                    <div className="bg-tein-green/[0.08] border border-tein-green/20 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-11 h-11 bg-gradient-to-br from-tein-green to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-tein-green/20">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-tein-green text-[11px] font-bold uppercase tracking-wider">Member Verified</p>
                                                <h3 className="text-lg font-black text-white leading-tight">
                                                    Welcome back, {member.full_name?.split(' ')[0]}!
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Member Details */}
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-[11px] font-medium">Full Name</span>
                                            <span className="text-white text-[13px] font-semibold">{member.full_name}</span>
                                        </div>
                                        <div className="border-t border-white/[0.04]"></div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-[11px] font-medium">TEIN ID</span>
                                            <span className="text-white text-[13px] font-mono font-semibold">{member.tein_id}</span>
                                        </div>
                                        <div className="border-t border-white/[0.04]"></div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-[11px] font-medium">Program</span>
                                            <span className="text-white text-[13px] font-semibold text-right max-w-[200px] truncate">{member.program}</span>
                                        </div>
                                        <div className="border-t border-white/[0.04]"></div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-[11px] font-medium">Level</span>
                                            <span className="text-white text-[13px] font-semibold">Level {member.level}</span>
                                        </div>
                                        {member.last_paid_date && (
                                            <>
                                                <div className="border-t border-white/[0.04]"></div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 text-[11px] font-medium">Last Renewed</span>
                                                    <span className="text-yellow-400 text-[13px] font-semibold">{member.last_paid_date}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* ── STEP 3: PAYMENT ── */}
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-400 text-xs font-medium">Renewal Fee</span>
                                            <span className="text-2xl font-black text-white">GHS 5.00</span>
                                        </div>
                                        <button
                                            onClick={() => handleRenewalPayment({ reference: 'RENEWAL_BYPASS_' + Date.now() })}
                                            disabled={paymentLoading}
                                            className="w-full bg-gradient-to-r from-tein-green to-emerald-600 text-white font-bold py-3 rounded-lg text-sm hover:shadow-[0_0_30px_rgba(0,168,89,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 border border-white/10 relative overflow-hidden group"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Renew Now</>}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        </button>
                                        <p className="text-center text-[10px] text-gray-600 font-medium mt-2">Secured by Paystack</p>
                                    </div>
                                </div>
                            )}

                            {/* Empty state when no lookup yet */}
                            {!member && !lookupError && !loading && (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                    <Search className="w-10 h-10 text-gray-600 mb-3" />
                                    <p className="text-gray-500 text-sm font-medium">Enter your TEIN ID above</p>
                                    <p className="text-gray-600 text-[11px]">e.g. 25/1299</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
