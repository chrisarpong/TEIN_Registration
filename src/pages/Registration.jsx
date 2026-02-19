import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { usePaystackPayment } from 'react-paystack'
import { GraduationCap, CheckCircle2, User, Phone, MapPin, School, BookOpen, Fingerprint, Crown, Star, Mail, ShieldCheck, ChevronRight, Upload, Calendar, Sparkles } from 'lucide-react'

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
        fullName: '',
        program: '',
        level: '100',
        constituency: '',
        residence: '',
        phone: '',
        studentId: '',
        email: '',
        gender: 'Male',
        photo: null
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
            if (file.size > 2 * 1024 * 1024) {
                alert("File size must be less than 2MB")
                return
            }
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
                const { error: uploadError } = await supabase.storage
                    .from('member-photos')
                    .upload(fileName, formData.photo)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('member-photos').getPublicUrl(fileName)
                passportUrl = data.publicUrl
            }

            const { data: memberData, error: memberError } = await supabase.from('members').insert([{
                full_name: formData.fullName,
                program: formData.program,
                level: parseInt(formData.level),
                constituency: formData.constituency,
                residence: formData.residence,
                phone: formData.phone,
                student_id: formData.studentId,
                email: formData.email,
                gender: formData.gender,
                passport_url: passportUrl,
                admission_year_prefix: prefix,
                status: 'Active'
            }]).select().single()

            if (memberError) throw memberError

            const { error: paymentError } = await supabase.from('payments').insert([{
                member_id: memberData.id,
                amount: getAmount() / 100,
                payment_type: paymentTier === 'gold' ? 'Registration (Gold)' : 'Registration (Standard)',
                reference: reference.reference || 'DEV_BYPASS_' + Date.now(),
                status: 'Success'
            }])

            if (paymentError) throw paymentError

            await sendResendEmail(formData, memberData.tein_id, getAmount() / 100);

            setSuccess(true)

        } catch (error) {
            alert('Registration failed: ' + error.message)
        } finally {
            setLoading(false)
        }
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

    // — INPUT FIELD COMPONENT —
    const InputField = ({ label, icon: Icon, ...props }) => (
        <div className="group">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 group-focus-within:text-tein-green transition-colors tracking-wider">
                {label}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-tein-green transition-colors" />}
                <input
                    {...props}
                    className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-tein-green/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,104,55,0.08)] transition-all duration-200 font-medium`}
                />
            </div>
        </div>
    )

    const SelectField = ({ label, children, ...props }) => (
        <div className="group">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 group-focus-within:text-tein-green transition-colors tracking-wider">
                {label}
            </label>
            <div className="relative">
                <select
                    {...props}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm appearance-none focus:outline-none focus:border-tein-green/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,104,55,0.08)] transition-all duration-200 font-medium"
                >
                    {children}
                </select>
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen text-gray-200 font-sans pt-28 pb-12 px-4 sm:px-6 relative">

            {/* Centered Content */}
            <div className="max-w-2xl mx-auto relative z-10">

                {/* — HERO HEADER — */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-tein-green/10 border border-tein-green/20 px-4 py-1.5 rounded-full mb-5">
                        <Sparkles className="w-3.5 h-3.5 text-tein-green" />
                        <span className="text-[11px] font-bold text-tein-green uppercase tracking-widest">New Member</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3">
                        Join <span className="bg-gradient-to-r from-tein-green to-emerald-400 bg-clip-text text-transparent">TEIN-UCC</span>
                    </h1>
                    <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                        Register as a comrade of the Tertiary Education Institutions Network — UCC Chapter.
                    </p>
                </div>

                {/* — FORM CARD — */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-3xl overflow-hidden shadow-2xl shadow-black/40">

                    {/* Accent bar */}
                    <div className="h-1 bg-gradient-to-r from-tein-green via-emerald-500 to-tein-red"></div>

                    <form
                        className="p-6 sm:p-8 md:p-10 space-y-8"
                        onSubmit={(e) => { e.preventDefault(); initializePayment(handleRegistration); }}
                    >

                        {/* ═══ SECTION 1: Personal Info ═══ */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-tein-green/10 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-tein-green" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Information</h3>
                            </div>

                            <InputField label="Full Name" name="fullName" onChange={handleInputChange} placeholder="e.g. Kwame Asante" required />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Email Address" type="email" name="email" icon={Mail} onChange={handleInputChange} placeholder="you@example.com" required />
                                <SelectField label="Gender" name="gender" onChange={handleInputChange}>
                                    <option className="bg-gray-900">Male</option>
                                    <option className="bg-gray-900">Female</option>
                                </SelectField>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Phone Number" type="tel" name="phone" icon={Phone} onChange={handleInputChange} placeholder="024XXXXXXX" required />

                                {/* Photo Upload */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 group-focus-within:text-tein-green transition-colors tracking-wider">ID Photo</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        required
                                    />
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className={`w-full py-3 px-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 ${formData.photo
                                            ? 'bg-tein-green/10 border-tein-green/40'
                                            : 'bg-white/[0.03] border-dashed border-white/[0.12] hover:border-white/25 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {previewUrl
                                                ? <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                                : <Upload className="w-4 h-4 text-gray-500" />
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold truncate ${formData.photo ? 'text-tein-green' : 'text-gray-400'}`}>
                                                {formData.photo ? 'Photo Selected ✓' : 'Upload Passport'}
                                            </p>
                                            <p className="text-[10px] text-gray-600">Max 2MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/[0.05]"></div>

                        {/* ═══ SECTION 2: Academic Info ═══ */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-tein-green/10 flex items-center justify-center">
                                    <School className="w-3.5 h-3.5 text-tein-green" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Academic Information</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Student ID" name="studentId" icon={Fingerprint} onChange={handleInputChange} placeholder="PS/..." required />
                                <SelectField label="Level" name="level" onChange={handleInputChange}>
                                    <option value="100" className="bg-gray-900">Level 100</option>
                                    <option value="200" className="bg-gray-900">Level 200</option>
                                    <option value="300" className="bg-gray-900">Level 300</option>
                                    <option value="400" className="bg-gray-900">Level 400</option>
                                    <option value="400" className="bg-gray-900">Masters / PhD</option>
                                </SelectField>
                            </div>

                            <InputField label="Program of Study" name="program" icon={BookOpen} onChange={handleInputChange} placeholder="e.g. Bachelor of Education (Arts)" required />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/[0.05]"></div>

                        {/* ═══ SECTION 3: Location ═══ */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-tein-green/10 flex items-center justify-center">
                                    <MapPin className="w-3.5 h-3.5 text-tein-green" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Hall / Residence" name="residence" onChange={handleInputChange} placeholder="e.g. Casford Hall" required />
                                <InputField label="Constituency" name="constituency" onChange={handleInputChange} placeholder="e.g. Cape Coast North" required />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/[0.05]"></div>

                        {/* ═══ SECTION 4: Payment Tier ═══ */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-tein-green/10 flex items-center justify-center">
                                    <Crown className="w-3.5 h-3.5 text-tein-green" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Membership Package</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Standard */}
                                <div
                                    onClick={() => setPaymentTier('standard')}
                                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${paymentTier === 'standard'
                                        ? 'bg-tein-green/[0.08] border-tein-green/60 shadow-lg shadow-tein-green/10 ring-1 ring-tein-green/20'
                                        : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/15'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-white text-base">Standard</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">1 Year Validity</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentTier === 'standard' ? 'border-tein-green bg-tein-green' : 'border-gray-600'}`}>
                                            {paymentTier === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-white mb-1.5">15 GHS</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">Basic membership, meeting access, and voting rights.</p>
                                </div>

                                {/* Gold */}
                                <div
                                    onClick={() => setPaymentTier('gold')}
                                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden ${paymentTier === 'gold'
                                        ? 'bg-yellow-500/[0.08] border-yellow-500/60 shadow-lg shadow-yellow-500/10 ring-1 ring-yellow-500/20'
                                        : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/15'
                                        }`}
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/15 to-transparent rounded-bl-3xl"></div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div>
                                            <h4 className="font-black text-yellow-500 text-base flex items-center gap-1.5">
                                                Gold <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                            </h4>
                                            <p className="text-[10px] text-yellow-200/50 font-medium">4 Years (Full Term)</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentTier === 'gold' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600'}`}>
                                            {paymentTier === 'gold' && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-white mb-1.5">50 GHS</p>
                                    <p className="text-[10px] text-gray-400 font-medium leading-tight">One-time payment for 4 years. Priority seating, Gold ID Card.</p>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SUBMIT ═══ */}
                        <div className="pt-2">
                            <button
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-tein-green to-emerald-700 text-white font-black py-4 rounded-2xl text-base hover:shadow-[0_0_40px_rgba(0,168,89,0.3)] transition-all duration-500 transform hover:scale-[1.01] active:scale-[0.99] border border-white/10 relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2.5">
                                    {loading ? 'Processing Secure Payment...' : 'Proceed to Payment'}
                                    {!loading && <ShieldCheck className="w-5 h-5 opacity-80" />}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </button>
                            <div className="text-center mt-3 flex items-center justify-center gap-4 opacity-50">
                                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Secured by Paystack</span>
                            </div>
                        </div>

                    </form>
                </div>

                {/* — FOOTER INFO — */}
                <div className="mt-6 flex items-center justify-center gap-3 text-gray-600">
                    <ShieldCheck className="w-4 h-4" />
                    <p className="text-[11px] font-medium">TEIN-UCC Chapter · Tertiary Education Institutions Network</p>
                </div>

            </div>
        </div>
    )
}