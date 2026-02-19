import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { usePaystackPayment } from 'react-paystack'
import { GraduationCap, CheckCircle2, User, Phone, MapPin, School, BookOpen, Fingerprint, Crown, Star, Mail, ShieldCheck, ChevronRight, Upload, Sparkles, Quote } from 'lucide-react'

const sendResendEmail = async (memberData, teinId, amount) => {
    const resendKey = import.meta.env.VITE_RESEND_API_KEY;
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
            },
            body: JSON.stringify({
                from: 'TEIN-UCC <onboarding@resend.dev>',
                to: [memberData.email],
                subject: `Welcome to TEIN! Your ID: ${teinId}`,
                html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1 style="color: #006837;">Welcome to TEIN-UCC!</h1>
            <p>Comrade <strong>${memberData.full_name}</strong>,</p>
            <p>Your registration was successful. Here are your details:</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 10px;">
              <p><strong>TEIN ID:</strong> ${teinId}</p>
              <p><strong>Amount Paid:</strong> GHS ${amount}</p>
              <p><strong>Program:</strong> ${memberData.program}</p>
            </div>
            <p>Please keep this ID safe. You will need it for renewals and voting.</p>
            <p>Ey3 Zu! Ey3 Za!</p>
          </div>
        `
            })
        });
        if (!response.ok) throw new Error('Email failed to send');
    } catch (error) {
        console.error("Resend Error:", error);
    }
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
        } catch (error) {
            alert('Registration failed: ' + error.message)
        } finally { setLoading(false) }
    }

    // SUCCESS UI
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
                    <button onClick={() => window.location.reload()} className="w-full py-4 rounded-xl font-bold text-tein-green bg-tein-green/10 hover:bg-tein-green/20 border border-tein-green/20 transition-all">
                        Register Another Member
                    </button>
                </div>
            </div>
        )
    }

    // — Shared field styles —
    const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-tein-green/40 focus:bg-white/[0.06] transition-all font-medium"
    const inputWithIconCls = inputCls + " pl-9"
    const labelCls = "block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider"
    const sectionHeadCls = "flex items-center gap-2 mb-3"
    const iconBoxCls = "w-6 h-6 rounded-md bg-tein-green/10 flex items-center justify-center"
    const sectionTitleCls = "text-[11px] font-bold text-gray-400 uppercase tracking-widest"

    return (
        // FULL-SCREEN SPLIT LAYOUT
        <div className="h-screen overflow-hidden flex flex-col lg:flex-row pt-20">

            {/* ════════════════════════════════════════════════ */}
            {/* LEFT PANEL — Info / President (hidden on mobile) */}
            {/* ════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] h-full flex-col p-6 pr-3 gap-4 relative z-10">

                {/* President Image Card — fills available space */}
                <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/[0.08] group min-h-0">
                    {/* Image */}
                    <img
                        src="/president.jpg"
                        alt="H.E. John Dramani Mahama"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80";
                        }}
                    />

                    {/* Ghana flag accent */}
                    <div className="absolute left-0 top-8 w-10 h-20 z-20 flex flex-col shadow-lg rounded-r-md overflow-hidden">
                        <div className="flex-1 bg-red-600"></div>
                        <div className="flex-1 bg-yellow-400 relative flex items-center justify-center">
                            <Star className="w-3 h-3 text-black fill-black" />
                        </div>
                        <div className="flex-1 bg-green-600"></div>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>

                    {/* Text overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                        <div className="bg-tein-green/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full w-fit mb-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white">President</p>
                        </div>
                        <h2 className="text-3xl xl:text-4xl font-black text-white leading-[0.95] mb-3 tracking-tight">
                            H.E. John<br />Dramani Mahama
                        </h2>
                        <p className="text-xs text-gray-300/80 leading-relaxed max-w-xs border-l-2 border-tein-green pl-3 italic">
                            "Together, we build the Ghana we want. Join the movement for progress and prosperity."
                        </p>
                    </div>
                </div>

                {/* Bottom info strip */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white/[0.03] backdrop-blur-md p-3 rounded-xl border border-white/[0.06] flex items-center gap-3 hover:border-tein-green/20 transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-tein-green to-emerald-800 rounded-lg flex items-center justify-center shadow-lg">
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-white">TEIN-UCC Chapter</h3>
                            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">University of Cape Coast</p>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-md p-3 rounded-xl border border-white/[0.06] flex items-center gap-3 hover:border-tein-red/20 transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-tein-red to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-white">NDC</h3>
                            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Youth Wing</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════ */}
            {/* RIGHT PANEL — Registration Form (scrollable)    */}
            {/* ════════════════════════════════════════════════ */}
            <div className="flex-1 h-full overflow-y-auto px-4 sm:px-6 lg:pl-3 lg:pr-6 py-6 relative z-10">
                <div className="max-w-xl mx-auto lg:mx-0">

                    {/* Mobile header */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-tein-green/10 border border-tein-green/20 px-3 py-1 rounded-full mb-3">
                            <Sparkles className="w-3 h-3 text-tein-green" />
                            <span className="text-[10px] font-bold text-tein-green uppercase tracking-widest">New Member</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Join TEIN-UCC</h1>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">

                        {/* Accent bar */}
                        <div className="h-0.5 bg-gradient-to-r from-tein-green via-emerald-500 to-tein-red"></div>

                        {/* Header inside card */}
                        <div className="px-5 sm:px-6 pt-5 pb-0">
                            <h2 className="text-xl font-black text-white mb-0.5">Member Registration</h2>
                            <p className="text-gray-600 text-xs">Fill in your details accurately. All fields are required.</p>
                        </div>

                        <form
                            className="p-5 sm:p-6 space-y-5"
                            onSubmit={(e) => { e.preventDefault(); initializePayment(handleRegistration); }}
                        >

                            {/* ═══ SECTION 1: Personal ═══ */}
                            <div className="space-y-3">
                                <div className={sectionHeadCls}>
                                    <div className={iconBoxCls}><User className="w-3 h-3 text-tein-green" /></div>
                                    <h3 className={sectionTitleCls}>Personal Information</h3>
                                </div>

                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <input required name="fullName" onChange={handleInputChange} className={inputCls} placeholder="e.g. Kwame Asante" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                            <input required type="email" name="email" onChange={handleInputChange} className={inputWithIconCls} placeholder="you@example.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Gender</label>
                                        <div className="relative">
                                            <select name="gender" onChange={handleInputChange} className={inputCls + " appearance-none"}>
                                                <option className="bg-gray-900">Male</option>
                                                <option className="bg-gray-900">Female</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                            <input required type="tel" name="phone" onChange={handleInputChange} className={inputWithIconCls} placeholder="024XXXXXXX" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>ID Photo</label>
                                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} className="hidden" required />
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            className={`w-full py-2 px-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2.5 ${formData.photo
                                                ? 'bg-tein-green/10 border-tein-green/40'
                                                : 'bg-white/[0.03] border-dashed border-white/[0.12] hover:border-white/25'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="" /> : <Upload className="w-3.5 h-3.5 text-gray-500" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-semibold truncate ${formData.photo ? 'text-tein-green' : 'text-gray-400'}`}>
                                                    {formData.photo ? 'Photo Selected ✓' : 'Upload Passport'}
                                                </p>
                                                <p className="text-[9px] text-gray-600">Max 2MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/[0.04]"></div>

                            {/* ═══ SECTION 2: Academic ═══ */}
                            <div className="space-y-3">
                                <div className={sectionHeadCls}>
                                    <div className={iconBoxCls}><School className="w-3 h-3 text-tein-green" /></div>
                                    <h3 className={sectionTitleCls}>Academic Information</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Student ID</label>
                                        <div className="relative">
                                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                            <input required name="studentId" onChange={handleInputChange} className={inputWithIconCls + " font-mono"} placeholder="PS/..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Level</label>
                                        <div className="relative">
                                            <select name="level" onChange={handleInputChange} className={inputCls + " appearance-none"}>
                                                <option value="100" className="bg-gray-900">Level 100</option>
                                                <option value="200" className="bg-gray-900">Level 200</option>
                                                <option value="300" className="bg-gray-900">Level 300</option>
                                                <option value="400" className="bg-gray-900">Level 400</option>
                                                <option value="400" className="bg-gray-900">Masters / PhD</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Program of Study</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                        <input required name="program" onChange={handleInputChange} className={inputWithIconCls} placeholder="e.g. Bachelor of Education (Arts)" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/[0.04]"></div>

                            {/* ═══ SECTION 3: Location ═══ */}
                            <div className="space-y-3">
                                <div className={sectionHeadCls}>
                                    <div className={iconBoxCls}><MapPin className="w-3 h-3 text-tein-green" /></div>
                                    <h3 className={sectionTitleCls}>Location</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Hall / Residence</label>
                                        <input required name="residence" onChange={handleInputChange} className={inputCls} placeholder="e.g. Casford Hall" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Constituency</label>
                                        <input required name="constituency" onChange={handleInputChange} className={inputCls} placeholder="e.g. Cape Coast North" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/[0.04]"></div>

                            {/* ═══ SECTION 4: Payment Tier ═══ */}
                            <div>
                                <div className={sectionHeadCls + " mb-3"}>
                                    <div className={iconBoxCls}><Crown className="w-3 h-3 text-tein-green" /></div>
                                    <h3 className={sectionTitleCls}>Membership Package</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Standard */}
                                    <div
                                        onClick={() => setPaymentTier('standard')}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${paymentTier === 'standard'
                                            ? 'bg-tein-green/[0.08] border-tein-green/50 shadow-lg shadow-tein-green/10'
                                            : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-white text-sm">Standard</h4>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentTier === 'standard' ? 'border-tein-green bg-tein-green' : 'border-gray-600'}`}>
                                                {paymentTier === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mb-1.5">1 Year Validity</p>
                                        <p className="text-lg font-black text-white">15 GHS</p>
                                        <p className="text-[9px] text-gray-500 mt-1 leading-tight">Membership card, meetings & voting.</p>
                                    </div>

                                    {/* Gold */}
                                    <div
                                        onClick={() => setPaymentTier('gold')}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden relative ${paymentTier === 'gold'
                                            ? 'bg-yellow-500/[0.08] border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                                            : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-yellow-500/15 to-transparent rounded-bl-2xl"></div>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <h4 className="font-black text-yellow-500 text-sm flex items-center gap-1">
                                                Gold <Star className="w-3 h-3 fill-yellow-500" />
                                            </h4>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentTier === 'gold' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600'}`}>
                                                {paymentTier === 'gold' && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-yellow-200/50 mb-1.5">4 Years (Full Term)</p>
                                        <p className="text-lg font-black text-white">50 GHS</p>
                                        <p className="text-[9px] text-gray-400 mt-1 leading-tight">Priority seating, Gold ID Card.</p>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ SUBMIT ═══ */}
                            <button
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-tein-green to-emerald-700 text-white font-black py-3.5 rounded-xl text-sm hover:shadow-[0_0_30px_rgba(0,168,89,0.3)] transition-all duration-500 transform hover:scale-[1.01] active:scale-[0.99] border border-white/10 relative overflow-hidden group disabled:opacity-60"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'Processing...' : 'Proceed to Payment'}
                                    {!loading && <ShieldCheck className="w-4 h-4 opacity-80" />}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </button>

                            <p className="text-center text-[10px] text-gray-600 font-bold tracking-widest uppercase">Secured by Paystack</p>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}