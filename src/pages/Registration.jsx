import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { usePaystackPayment } from 'react-paystack'
import { GraduationCap, CheckCircle2, User, Phone, MapPin, School, BookOpen, Fingerprint, Crown, Star, Mail, ShieldCheck, ChevronRight, Upload, Calendar } from 'lucide-react'
// REMOVED: import emailjs from '@emailjs/browser'

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
                from: 'TEIN-UCC <onboarding@resend.dev>', // Use resend.dev for testing until you add a domain
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
        // Don't block the user if email fails, just log it
    }
};

export default function Registration() {
    // STATE
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
    const [paymentTier, setPaymentTier] = useState('standard') // 'standard' | 'gold'
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)

    // HANDLERS
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

    // PAYSTACK CONFIG
    const getAmount = () => paymentTier === 'gold' ? 5000 : 1500 // 50 GHS vs 15 GHS

    const config = {
        reference: (new Date()).getTime().toString(),
        email: formData.email || "user@tein-ucc.com",
        amount: getAmount(),
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    }

    const initializePayment = usePaystackPayment(config)

    // SUBMIT & UPLOAD LOGIC
    const handleRegistration = async (reference) => {
        setLoading(true)
        const currentYear = new Date().getFullYear();
        const prefix = currentYear - (parseInt(formData.level) / 100) + 1;

        try {
            // 1. Upload Photo if exists
            let passportUrl = null
            if (formData.photo) {
                const fileExt = formData.photo.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                // Ensure you created 'member-photos' bucket in Supabase!
                const { error: uploadError } = await supabase.storage
                    .from('member-photos')
                    .upload(fileName, formData.photo)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('member-photos').getPublicUrl(fileName)
                passportUrl = data.publicUrl
            }

            // 2. Create Member Record
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

            // 3. Record Payment (Use reference from Paystack OR 'MANUAL_TEST' if bypassed)
            const { error: paymentError } = await supabase.from('payments').insert([{
                member_id: memberData.id,
                amount: getAmount() / 100,
                payment_type: paymentTier === 'gold' ? 'Registration (Gold)' : 'Registration (Standard)',
                reference: reference.reference || 'DEV_BYPASS_' + Date.now(),
                status: 'Success'
            }])

            if (paymentError) throw paymentError

            // 4. Send Email via Resend
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
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tein-green/20 rounded-full blur-[120px] animate-pulse"></div>

                <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-white/10 relative z-10 animate-in zoom-in duration-500">
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

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-tein-green/30 relative overflow-hidden flex flex-col md:flex-row">

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-tein-green/10 rounded-full blur-[180px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-tein-red/10 rounded-full blur-[180px] opacity-30"></div>
            </div>

            {/* LEFT SECTION: President & Info */}
            <div className="hidden md:flex flex-1 relative z-10 flex-col p-12 lg:p-16 border-r border-white/5 bg-black/20 backdrop-blur-sm h-screen sticky top-0">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 shrink-0">
                        {/* Fallback to text if image fails, handled cleaner */}
                        <span className="font-black text-black text-xl">NDC</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter leading-none">TEIN UCC</h1>
                        <p className="text-sm text-tein-green font-bold uppercase tracking-widest mt-1">Official Portal</p>
                    </div>
                </div>

                {/* Hero Text (Centered) */}
                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                        Building the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-tein-green via-white to-tein-green animate-gradient-x">Future</span>
                        <br /> Together.
                    </h2>

                    <p className="text-lg text-gray-400 max-w-md leading-relaxed">
                        Join the intellectual wing of the NDC at the University of Cape Coast. Verify your membership, pay dues, and access exclusive resources.
                    </p>
                </div>

                {/* President Card */}
                <div className="relative group cursor-default mt-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-tein-green to-emerald-900 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-6 hover:border-tein-green/30 transition-colors">
                        <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-tein-green shadow-lg overflow-hidden relative shrink-0">
                            {/* Placeholder for JDM Image */}
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/John_Dramani_Mahama_2014.jpg/440px-John_Dramani_Mahama_2014.jpg" alt="JDM" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs text-tein-green font-bold uppercase tracking-widest mb-1">Flagbearer & Leader</p>
                            <h3 className="text-xl font-black text-white leading-tight">H.E. John Dramani Mahama</h3>
                            <p className="text-xs text-gray-400 mt-2 italic">"Victory needs every single one of us."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: Form */}
            <div className="flex-1 relative z-10 w-full min-h-screen bg-black/40 backdrop-blur-md">
                <div className="h-full overflow-y-auto scrollbar-hide">
                    <div className="p-6 md:p-12 lg:p-20 max-w-2xl mx-auto min-h-full flex flex-col justify-center">

                        {/* Header (Mobile Only) */}
                        <div className="md:hidden flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">NDC</div>
                            <span className="font-black text-white text-xl tracking-tight">TEIN UCC</span>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-white mb-2">Member Registration</h2>
                            <p className="text-gray-500">Fill in your details accurately. All fields are required.</p>
                        </div>

                        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); initializePayment(handleRegistration); }}>

                            {/* 1. Personal Details */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-4 h-4 text-tein-green" /> Personal Information
                                </h3>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Full Name</label>
                                    <input required name="fullName" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="John Doe" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Email Address</label>
                                        <input required type="email" name="email" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="john@example.com" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Gender</label>
                                        <div className="relative">
                                            <select name="gender" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium">
                                                <option className="bg-gray-900">Male</option>
                                                <option className="bg-gray-900">Female</option>
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input required type="tel" name="phone" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="024XXXXXXX" />
                                        </div>
                                    </div>

                                    {/* Photo Upload */}
                                    <div className="group relative">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">ID Photo</label>
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
                                            className={`w-full p-3 rounded-xl border border-dashed cursor-pointer transition-all flex items-center gap-4 ${formData.photo ? 'bg-tein-green/10 border-tein-green/50' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${formData.photo ? 'text-tein-green' : 'text-gray-400'}`}>
                                                    {formData.photo ? 'Photo Selected' : 'Tap to Upload Passport'}
                                                </p>
                                                <p className="text-[10px] text-gray-600">Max 2MB. Face clear.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Academic Details */}
                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <School className="w-4 h-4 text-tein-green" /> Academic Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Student ID</label>
                                        <div className="relative">
                                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input required name="studentId" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium font-mono" placeholder="PS/..." />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Level</label>
                                        <div className="relative">
                                            <select name="level" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium">
                                                <option value="100" className="bg-gray-900">Level 100</option>
                                                <option value="200" className="bg-gray-900">Level 200</option>
                                                <option value="300" className="bg-gray-900">Level 300</option>
                                                <option value="400" className="bg-gray-900">Level 400</option>
                                                <option value="400" className="bg-gray-900">Masters / PhD</option>
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Program of Study</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input required name="program" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="Bachelor of Education (Arts)" />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Location Details */}
                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-tein-green" /> Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Hall / Residence</label>
                                        <input required name="residence" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="Casford Hall" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-white transition-colors">Constituency</label>
                                        <input required name="constituency" onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-tein-green/50 focus:bg-black/40 transition-all font-medium" placeholder="Cape Coast North" />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Payment Tier Selector */}
                            <div className="pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-tein-green" /> Select Membership Package
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Standard Tier */}
                                    <div
                                        onClick={() => setPaymentTier('standard')}
                                        className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${paymentTier === 'standard' ? 'bg-tein-green/10 border-tein-green shadow-lg shadow-tein-green/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-white text-lg">Standard</h4>
                                                <p className="text-xs text-gray-400 font-medium">1 Year Validity</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentTier === 'standard' ? 'border-tein-green bg-tein-green text-white' : 'border-gray-600'}`}>
                                                {paymentTier === 'standard' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-white mb-2">15 GHS</p>
                                        <p className="text-[10px] text-gray-500 font-medium leading-tight">Basic membership card, meeting access, and voting rights.</p>
                                    </div>

                                    {/* Gold Tier */}
                                    <div
                                        onClick={() => setPaymentTier('gold')}
                                        className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden group ${paymentTier === 'gold' ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        {/* Shine Effect */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/20 to-transparent"></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h4 className="font-black text-yellow-500 text-lg flex items-center gap-2">
                                                    Gold <Star className="w-4 h-4 fill-yellow-500" />
                                                </h4>
                                                <p className="text-xs text-yellow-200/60 font-medium">4 Years (Full Term)</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentTier === 'gold' ? 'border-yellow-500 bg-yellow-500 text-black' : 'border-gray-600'}`}>
                                                {paymentTier === 'gold' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-white mb-2">50 GHS</p>
                                        <p className="text-[10px] text-gray-400 font-medium leading-tight">One-time payment for 4 years. Priority seating, Gold ID Card.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-6">
                                <button disabled={loading} className="w-full bg-gradient-to-r from-tein-green to-emerald-700 text-white font-black py-5 rounded-2xl text-lg hover:shadow-[0_0_40px_rgba(0,168,89,0.4)] transition-all duration-500 transform hover:scale-[1.01] active:scale-[0.99] border border-white/10 relative overflow-hidden group">
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? 'Processing Secure Payment...' : 'Proceed to Payment'}
                                        {!loading && <ShieldCheck className="w-5 h-5 opacity-80" />}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </button>
                                <div className="text-center mt-4 flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                    <img src="/paystack-logo.png" className="h-4 object-contain" alt="Paystack" onError={(e) => e.target.style.display = 'none'} />
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Secured Transaction</span>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
