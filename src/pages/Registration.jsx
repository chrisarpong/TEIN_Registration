import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { usePaystackPayment } from 'react-paystack'
import { CheckCircle2, User, Phone, MapPin, School, BookOpen, Fingerprint, Crown, Star, Mail, ShieldCheck, ChevronRight, Upload, Clock, Calendar } from 'lucide-react'

const sendResendEmail = async (memberData, teinId, amount) => {
    const resendKey = import.meta.env.VITE_RESEND_API_KEY;
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
            body: JSON.stringify({
                from: 'TEIN-UCC <onboarding@resend.dev>', to: [memberData.email],
                subject: `Welcome to TEIN! Your ID: ${teinId}`,
                html: `<div style="font-family:sans-serif;color:#333;"><h1 style="color:#006837;">Welcome to TEIN-UCC!</h1><p>Comrade <strong>${memberData.full_name}</strong>,</p><p>Your registration was successful.</p><div style="background:#f4f4f4;padding:20px;border-radius:10px;"><p><strong>TEIN ID:</strong> ${teinId}</p><p><strong>Amount Paid:</strong> GHS ${amount}</p><p><strong>Program:</strong> ${memberData.program}</p></div><p>Please keep this ID safe. You will need it for renewals and voting.</p><p>Ey3 Zu! Ey3 Za!</p></div>`
            })
        });
        if (!response.ok) throw new Error('Email failed to send');
    } catch (error) { console.error("Resend Error:", error); }
};

export default function Registration() {
    const [formData, setFormData] = useState({
        fullName: '', program: '', level: '100', constituency: '', residence: '',
        phone: '', studentId: '', email: '', gender: 'Male', photo: null
    })
    const [paymentTier, setPaymentTier] = useState('standard')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) { alert("File size must be less than 2MB"); return }
            setFormData(prev => ({ ...prev, photo: file }))
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const getAmount = () => paymentTier === 'gold' ? 5000 : 1500
    const config = {
        reference: (new Date()).getTime().toString(),
        email: formData.email || "user@tein-ucc.com",
        amount: getAmount(),
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    }
    const initializePayment = usePaystackPayment(config)

    const handleRegistration = async (reference) => {
        setLoading(true)
        const currentYear = new Date().getFullYear();
        const prefix = currentYear - (parseInt(formData.level) / 100) + 1;
        try {
            let passportUrl = null
            if (formData.photo) {
                const fileExt = formData.photo.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const { error: uploadError } = await supabase.storage.from('member-photos').upload(fileName, formData.photo)
                if (uploadError) throw uploadError
                const { data } = supabase.storage.from('member-photos').getPublicUrl(fileName)
                passportUrl = data.publicUrl
            }
            const { data: memberData, error: memberError } = await supabase.from('members').insert([{
                full_name: formData.fullName, program: formData.program, level: parseInt(formData.level),
                constituency: formData.constituency, residence: formData.residence, phone: formData.phone,
                student_id: formData.studentId, email: formData.email, gender: formData.gender,
                passport_url: passportUrl, admission_year_prefix: prefix, status: 'Active'
            }]).select().single()
            if (memberError) throw memberError
            const { error: paymentError } = await supabase.from('payments').insert([{
                member_id: memberData.id, amount: getAmount() / 100,
                payment_type: paymentTier === 'gold' ? 'Registration (Gold)' : 'Registration (Standard)',
                reference: reference.reference || 'DEV_BYPASS_' + Date.now(), status: 'Success'
            }])
            if (paymentError) throw paymentError
            await sendResendEmail(formData, memberData.tein_id, getAmount() / 100);
            setSuccess(true)
        } catch (error) { alert('Registration failed: ' + error.message) }
        finally { setLoading(false) }
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
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome to TEIN!</h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Your registration was successful. An email receipt has been sent to <span className="text-white font-bold">{formData.email}</span>.
                    </p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 rounded-xl font-bold text-tein-green bg-tein-green/10 hover:bg-tein-green/20 border border-tein-green/20 transition-all">Register Another Member</button>
                </div>
            </div>
        )
    }

    // ── Shared Styles ──
    const fieldCls = "w-full bg-white/[0.06] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2.5 text-white text-[13px] placeholder-gray-500 focus:outline-none focus:border-tein-green/50 focus:bg-white/[0.08] transition-all font-medium"
    const fieldNoCls = "w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-[13px] placeholder-gray-500 focus:outline-none focus:border-tein-green/50 focus:bg-white/[0.08] transition-all font-medium"
    const labelCls = "block text-[11px] font-semibold text-gray-400 mb-1"

    return (
        <>
            {/* ── FULL-PAGE NDC BACKGROUND ── */}
            <style>{`
                .ndc-bg {
                    position: fixed; inset: 0; z-index: 0;
                    background:
                        url('/ndc-bg.jpg') center/cover no-repeat;
                    filter: blur(6px) brightness(0.35);
                    transform: scale(1.05);
                }
                .ndc-bg-fallback {
                    position: fixed; inset: 0; z-index: 0;
                    background:
                        radial-gradient(ellipse at 20% 50%, rgba(0,104,55,0.5) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(227,6,19,0.4) 0%, transparent 50%),
                        radial-gradient(ellipse at 60% 90%, rgba(0,104,55,0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at 10% 90%, rgba(227,6,19,0.2) 0%, transparent 60%),
                        linear-gradient(160deg, #0a0a0a 0%, #111 40%, #0d1a12 100%);
                }
            `}</style>
            {/* Background image layer (blurred) — falls back to gradient */}
            <div className="ndc-bg"></div>
            <div className="ndc-bg-fallback"></div>

            {/* ── MAIN LAYOUT ── */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24 pb-6">

                {/* ── GLASSMORPHISM CARD ── */}
                <div className="w-full max-w-[1050px] bg-black/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row"
                    style={{ maxHeight: 'calc(100vh - 7rem)' }}
                >

                    {/* ═══════════════════════════════════════════ */}
                    {/* LEFT PANEL — Info / Branding                */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="lg:w-1/2 bg-gradient-to-br from-black/60 to-black/30 p-6 flex flex-col relative overflow-hidden">

                        {/* Decorative NDC color bars at top */}
                        <div className="flex h-1 rounded-full overflow-hidden mb-5 opacity-80">
                            <div className="flex-1 bg-[#CE1126]"></div>
                            <div className="flex-1 bg-[#FCD116]"></div>
                            <div className="flex-1 bg-[#006B3F]"></div>
                        </div>

                        {/* Top badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-[10px] text-black shadow">NDC</div>
                            <div>
                                <p className="text-white font-bold text-xs">TEIN-UCC</p>
                                <p className="text-gray-500 text-[9px] font-medium uppercase tracking-wider">Membership Portal</p>
                            </div>
                        </div>

                        {/* President image — replace at: public/president.jpg */}
                        <div className="flex-1 relative rounded-xl overflow-hidden min-h-0 mb-4 border border-white/[0.06]">
                            <img
                                src="/president.jpg"
                                alt="H.E. John Dramani Mahama"
                                className="absolute inset-0 w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                            {/* Ghana flag ribbon */}
                            <div className="absolute left-3 top-3 z-20 flex gap-0 rounded overflow-hidden shadow-md">
                                <div className="w-5 h-4 bg-[#CE1126]"></div>
                                <div className="w-5 h-4 bg-[#FCD116] flex items-center justify-center">
                                    <span className="text-[7px] text-black leading-none" style={{ fontFamily: 'serif' }}>★</span>
                                </div>
                                <div className="w-5 h-4 bg-[#006B3F]"></div>
                            </div>

                            {/* Date badge */}
                            <div className="absolute right-3 top-3 bg-tein-green/90 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-white" />
                                <span className="text-[9px] font-bold text-white uppercase">2025/26</span>
                            </div>

                            {/* Bottom text */}
                            <div className="absolute bottom-0 left-0 w-full p-4 z-10">
                                <h2 className="text-2xl font-black text-white leading-[1] mb-1 tracking-tight">
                                    TEIN<br />Registration
                                </h2>
                                <p className="text-[10px] text-gray-400 font-medium">UCC Chapter · Join the Movement</p>
                            </div>
                        </div>

                        {/* Info text */}
                        <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] mb-3">
                            <p className="text-gray-400 text-[11px] leading-relaxed italic">
                                "We know you waited,<br />
                                We know you anticipated.<br />
                                Well, now it's here again.<br />
                                TEIN-UCC registration is open.<br />
                                <span className="text-tein-green font-semibold not-italic">Get ready 🎉</span>
                            </p>
                        </div>

                        {/* Footer details */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                <div>
                                    <p className="text-[11px] font-bold text-white">Always Open</p>
                                    <p className="text-[9px] text-gray-500">Register anytime</p>
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
                    {/* RIGHT PANEL — Registration Form             */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="lg:w-1/2 overflow-y-auto p-5 sm:p-6 bg-white/[0.02]"
                        style={{ maxHeight: 'calc(100vh - 7rem)' }}
                    >
                        {/* Header */}
                        <div className="mb-5">
                            <h2 className="text-xl font-black text-white mb-0.5">Register Now</h2>
                            <p className="text-gray-500 text-xs">Fill in your details to become a comrade.</p>
                        </div>

                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); initializePayment(handleRegistration); }}>

                            {/* Full Name */}
                            <div>
                                <label className={labelCls}>Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input required name="fullName" onChange={handleInputChange} className={fieldCls} placeholder="Enter your full name" />
                                </div>
                            </div>

                            {/* Email & Gender */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input required type="email" name="email" onChange={handleInputChange} className={fieldCls} placeholder="you@email.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Gender</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <select name="gender" onChange={handleInputChange} className={fieldCls + " appearance-none"}>
                                            <option className="bg-gray-900">Male</option>
                                            <option className="bg-gray-900">Female</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Phone & Photo */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input required type="tel" name="phone" onChange={handleInputChange} className={fieldCls} placeholder="024 XXX XXXX" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>ID Photo</label>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} className="hidden" required />
                                    <div onClick={() => fileInputRef.current.click()}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${formData.photo ? 'bg-tein-green/10 border-tein-green/40' : 'bg-white/[0.06] border-white/[0.1] border-dashed hover:border-white/20'}`}
                                    >
                                        <div className="w-7 h-7 rounded bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="" /> : <Upload className="w-3 h-3 text-gray-500" />}
                                        </div>
                                        <span className={`text-[12px] font-medium truncate ${formData.photo ? 'text-tein-green' : 'text-gray-400'}`}>
                                            {formData.photo ? 'Selected ✓' : 'Upload'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Student ID & Level */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Student ID</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input required name="studentId" onChange={handleInputChange} className={fieldCls + " font-mono"} placeholder="PS/..." />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Level</label>
                                    <div className="relative">
                                        <School className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <select name="level" onChange={handleInputChange} className={fieldCls + " appearance-none"}>
                                            <option value="100" className="bg-gray-900">Level 100</option>
                                            <option value="200" className="bg-gray-900">Level 200</option>
                                            <option value="300" className="bg-gray-900">Level 300</option>
                                            <option value="400" className="bg-gray-900">Level 400</option>
                                            <option value="400" className="bg-gray-900">Masters / PhD</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Program */}
                            <div>
                                <label className={labelCls}>Program of Study</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input required name="program" onChange={handleInputChange} className={fieldCls} placeholder="e.g. Bachelor of Education" />
                                </div>
                            </div>

                            {/* Residence & Constituency */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Hall / Residence</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input required name="residence" onChange={handleInputChange} className={fieldCls} placeholder="Casford Hall" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Constituency</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input required name="constituency" onChange={handleInputChange} className={fieldCls} placeholder="Cape Coast North" />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Tier */}
                            <div>
                                <label className={labelCls}>Membership Package</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div onClick={() => setPaymentTier('standard')}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${paymentTier === 'standard' ? 'bg-tein-green/10 border-tein-green/50' : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-white">Standard</span>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentTier === 'standard' ? 'border-tein-green bg-tein-green' : 'border-gray-600'}`}>
                                                {paymentTier === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-white">15 GHS</p>
                                        <p className="text-[9px] text-gray-500 mt-0.5">1 Year · Basic membership</p>
                                    </div>
                                    <div onClick={() => setPaymentTier('gold')}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${paymentTier === 'gold' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-yellow-500/15 to-transparent"></div>
                                        <div className="flex items-center justify-between mb-1 relative z-10">
                                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">Gold <Star className="w-3 h-3 fill-yellow-500" /></span>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentTier === 'gold' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600'}`}>
                                                {paymentTier === 'gold' && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-white">50 GHS</p>
                                        <p className="text-[9px] text-gray-400 mt-0.5">4 Years · Gold ID Card</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button disabled={loading}
                                className="w-full bg-gradient-to-r from-tein-green to-emerald-600 text-white font-bold py-3 rounded-lg text-sm hover:shadow-[0_0_30px_rgba(0,168,89,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 border border-white/10 relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? 'Processing...' : 'Register'}
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </button>

                            <p className="text-center text-[10px] text-gray-600 font-medium">Secured by Paystack · Admin Login</p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}