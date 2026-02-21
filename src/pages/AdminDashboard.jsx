import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Users, CreditCard, FileText, Search, LogOut, PlusCircle, Download, LayoutDashboard, Menu, X, ShieldCheck, GraduationCap, ChevronRight, Settings, Wifi, UserCircle, Lock, Camera, Monitor, Database, Printer, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { QRCodeSVG } from 'qrcode.react'

// --- ID CARD COMPONENT (PRINTABLE) ---
const PrintableIDCards = ({ members, ref }) => {
    return (
        <div ref={ref} className="p-8 bg-white text-black print:p-0 print:bg-white">
            <style type="text/css" media="print">
                {`@page { size: auto; margin: 0mm; }`}
            </style>
            <div className="grid grid-cols-2 gap-4 print:block">
                {members.map((member, index) => (
                    <div key={index} className="w-[85.6mm] h-[53.98mm] relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm print:shadow-none print:border-none print:break-after-page mb-8 mx-auto print:mb-0">
                        {/* Background Design */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white z-0"></div>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-green-600 z-10"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-50 rounded-full z-0 opacity-50"></div>
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-red-50 rounded-full z-0 opacity-50"></div>

                        {/* Content */}
                        <div className="relative z-10 p-4 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center font-black text-[10px] border border-black">NDC</div>
                                    <div>
                                        <h1 className="text-[10px] font-black uppercase tracking-tighter leading-none text-black">TEIN - UCC</h1>
                                        <p className="text-[6px] font-bold text-gray-500 uppercase tracking-widest">Tertiary Education Institutions Network</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[6px] font-bold text-red-600 uppercase tracking-widest">Membership ID</p>
                                    <p className="text-[10px] font-mono font-black text-black">{member.tein_id || 'PENDING'}</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 flex gap-3 items-center">
                                {/* Photo */}
                                <div className="w-[22mm] h-[22mm] bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-inner">
                                    {member.passport_url ? (
                                        <img src={member.passport_url} alt={member.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <UserCircle className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-1">
                                    <div>
                                        <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Full Name</p>
                                        <p className="text-[10px] font-black text-black leading-tight line-clamp-1 uppercase">{member.full_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Program</p>
                                            <p className="text-[8px] font-bold text-gray-800 leading-tight line-clamp-1">{member.program}</p>
                                        </div>
                                        <div>
                                            <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Level</p>
                                            <p className="text-[8px] font-bold text-gray-800 leading-tight">{member.level}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="w-[14mm] h-[14mm] bg-white p-1 rounded-sm border border-gray-100 flex-shrink-0">
                                    <QRCodeSVG value={`https://tein-ucc.com/verify/${member.id}`} size="100%" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-[6px] font-medium text-gray-400">Valid until: Dec 2026</p>
                                <div className="h-1 w-10 bg-gradient-to-r from-red-500 via-white to-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


// --- SUB-COMPONENTS ---
const MembersTable = ({ members, searchTerm, setSearchTerm, compactMode, fetchStats }) => {
    const [printingMemberId, setPrintingMemberId] = useState(null)
    const [editingMemberId, setEditingMemberId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const printRef = useRef()

    const filtered = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tein_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) return;
        try {
            const { error, data } = await supabase.from('members').delete().eq('id', id).select()
            if (error) throw error
            if (!data || data.length === 0) {
                alert('Deletion failed! Please ensure you have enabled DELETE policies in your Supabase Row Level Security (RLS) settings.')
            } else {
                alert('Member deleted successfully.')
            }
            if (fetchStats) fetchStats()
        } catch (error) {
            alert('Error deleting member: ' + error.message)
        }
    }

    const startEdit = (member) => {
        setEditingMemberId(member.id)
        setEditForm({ full_name: member.full_name, program: member.program, level: member.level, phone: member.phone })
    }

    const cancelEdit = () => {
        setEditingMemberId(null)
        setEditForm({})
    }

    const handleSaveEdit = async (id) => {
        try {
            const { error, data } = await supabase.from('members').update(editForm).eq('id', id).select()
            if (error) throw error
            if (!data || data.length === 0) {
                alert('Update failed! Please ensure you have enabled UPDATE policies in your Supabase Row Level Security (RLS) settings.')
            } else {
                alert('Member updated successfully.')
            }
            setEditingMemberId(null)
            if (fetchStats) fetchStats()
        } catch (error) {
            alert('Error updating member: ' + error.message)
        }
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'TEIN-UCC-ID'
    });

    // We only print the member currently selected by the Print action button
    const membersToPrint = members.filter(m => m.id === printingMemberId)

    // Trigger printing once the state updates and the hidden component renders the member
    useEffect(() => {
        if (printingMemberId) {
            handlePrint()
            // Reset after printing dialog launches (small delay to ensure render)
            setTimeout(() => setPrintingMemberId(null), 500)
        }
    }, [printingMemberId, handlePrint])

    const exportToCSV = () => {
        const headers = "TEIN ID, Name, Program, Level, Phone, Residence\n"
        const rows = filtered.map(m => `${m.tein_id},${m.full_name},${m.program},${m.level},${m.phone},"${m.residence}"`).join("\n")
        const blob = new Blob([headers + rows], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'tein_members.csv'; a.click()
    }

    return (
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-tein-green/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Hidden Print Component - Only renders the selected member */}
            <div className="hidden">
                <PrintableIDCards ref={printRef} members={membersToPrint} />
            </div>

            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 relative z-10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Bulk Selection UI Removed */}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-4 top-3 text-gray-400 w-4 h-4 group-focus-within:text-tein-green transition-colors" />
                        <input
                            placeholder="Search ID, Name, or Phone..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/20 border border-white/10 rounded-xl outline-none focus:bg-black/40 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/30 text-white placeholder-gray-500 transition-all shadow-inner"
                            onChange={(e) => setSearchTerm(e.target.value)}
                            value={searchTerm}
                        />
                    </div>
                    <button onClick={exportToCSV} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tein-green/20 to-emerald-600/20 text-tein-green text-sm font-bold rounded-xl hover:from-tein-green/30 hover:to-emerald-600/30 border border-tein-green/20 hover:border-tein-green/40 transition-all shadow-lg shadow-tein-green/5">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className={`w-full text-sm text-left text-gray-300 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    <thead className="bg-black/20 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                        <tr>
                            <th className={`px-6 pl-8 ${compactMode ? 'py-2' : 'py-4'}`}>TEIN ID / Status</th>
                            <th className={`px-6 ${compactMode ? 'py-2' : 'py-4'}`}>Student Details</th>
                            <th className={`px-6 ${compactMode ? 'py-2' : 'py-4'}`}>Academic Info</th>
                            <th className={`px-6 ${compactMode ? 'py-2' : 'py-4'}`}>Contact</th>
                            <th className={`px-6 text-right pr-8 ${compactMode ? 'py-2' : 'py-4'}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((m) => (
                            <tr key={m.id} className={`hover:bg-white/5 transition-colors group`}>
                                <td className={`px-6 pl-8 ${compactMode ? 'py-2' : 'py-4'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${m.is_manual ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-tein-green shadow-[0_0_8px_rgba(0,168,89,0.5)]'}`}></div>
                                        <span className="font-mono font-bold text-white tracking-wide">{m.tein_id || 'Pending...'}</span>
                                    </div>
                                </td>
                                <td className={`px-6 ${compactMode ? 'py-2' : 'py-4'}`}>
                                    {editingMemberId === m.id ? (
                                        <input className="w-full bg-black/40 border border-tein-green/50 outline-none rounded px-2 py-1 text-white" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                                    ) : (
                                        <>
                                            <div className="font-bold text-white text-base">{m.full_name}</div>
                                            <div className="text-xs text-gray-500 font-medium">{m.gender}</div>
                                        </>
                                    )}
                                </td>
                                <td className={`px-6 ${compactMode ? 'py-2' : 'py-4'}`}>
                                    {editingMemberId === m.id ? (
                                        <div className="flex gap-2">
                                            <input className="w-2/3 bg-black/40 border border-tein-green/50 outline-none rounded px-2 py-1 text-white text-xs" value={editForm.program} onChange={e => setEditForm({ ...editForm, program: e.target.value })} />
                                            <input className="w-1/3 bg-black/40 border border-tein-green/50 outline-none rounded px-2 py-1 text-white text-xs" value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 font-medium">{m.program}</span>
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full w-fit mt-1 border border-white/5">Level {m.level}</span>
                                        </div>
                                    )}
                                </td>
                                <td className={`px-6 text-gray-400 font-mono text-xs ${compactMode ? 'py-2' : 'py-4'}`}>
                                    {editingMemberId === m.id ? (
                                        <input className="w-full bg-black/40 border border-tein-green/50 outline-none rounded px-2 py-1 text-white" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                    ) : m.phone}
                                </td>
                                <td className={`px-6 text-right pr-8 ${compactMode ? 'py-2' : 'py-4'}`}>
                                    {editingMemberId === m.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleSaveEdit(m.id)} className="px-3 py-1 bg-tein-green/20 text-tein-green hover:bg-tein-green/30 rounded text-xs font-bold transition-colors border border-tein-green/30">Save</button>
                                            <button onClick={cancelEdit} className="px-3 py-1 bg-gray-500/20 text-gray-400 hover:text-white hover:bg-gray-500/40 rounded text-xs font-bold transition-colors border border-gray-500/30">Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                            <button title="Print ID" onClick={() => setPrintingMemberId(m.id)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-colors border border-blue-500/20">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button title="Edit Member" onClick={() => startEdit(m)} className="p-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors border border-white/10">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button title="Delete Member" onClick={() => handleDelete(m.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors border border-red-500/20">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic bg-black/10">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 opacity-20" />
                                        No members found matching your search.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const ManualEntry = ({ fetchStats, supabase }) => {
    const [manualForm, setManualForm] = useState({
        full_name: '', program: '', level: '100', constituency: '', residence: '', phone: '', custom_id: ''
    })
    const [status, setStatus] = useState(null)

    const handleManualSubmit = async (e) => {
        e.preventDefault()

        // Validate Phone Number (Ghanaian format: 10 digits, starts with 0)
        const phoneRegex = /^0\d{9}$/
        if (!manualForm.phone || !phoneRegex.test(manualForm.phone)) {
            alert("Invalid Phone Number. Must be 10 digits starting with '0'.")
            return
        }

        setStatus('loading')
        const currentYear = new Date().getFullYear();
        const prefix = currentYear - (parseInt(manualForm.level) / 100) + 1;

        try {
            const payload = {
                full_name: manualForm.full_name,
                program: manualForm.program,
                level: parseInt(manualForm.level),
                constituency: manualForm.constituency,
                residence: manualForm.residence,
                phone: manualForm.phone,
                admission_year_prefix: prefix,
                is_manual: true,
                tein_id: manualForm.custom_id.trim() !== '' ? manualForm.custom_id : null
            }
            const { error } = await supabase.from('members').insert([payload])
            if (error) throw error
            setStatus('success')
            setManualForm({ full_name: '', program: '', level: '100', constituency: '', residence: '', phone: '', custom_id: '' })
            fetchStats()
            setTimeout(() => setStatus(null), 3000)
        } catch (error) {
            alert(error.message)
            setStatus('error')
        }
    }

    return (
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden max-w-4xl mx-auto animate-in zoom-in duration-300 relative group hover:border-white/20 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tein-red via-white to-tein-green shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
            <div className="p-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <div className="p-3 bg-gradient-to-br from-tein-green/20 to-transparent rounded-xl border border-tein-green/20 shadow-lg">
                        <FileText className="w-6 h-6 text-tein-green" />
                    </div>
                    Digitize Physical Books
                </h2>
                <p className="text-gray-400 text-sm mt-2 font-medium ml-1">
                    Data entered here skips payment verification. Use this only for existing physical records.
                </p>
            </div>
            <form onSubmit={handleManualSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Full Name</label><input required className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 shadow-inner" value={manualForm.full_name} onChange={e => setManualForm({ ...manualForm, full_name: e.target.value })} placeholder="Name from book..." /></div>
                    <div className="grid grid-cols-2 gap-4"><div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Program</label><input required className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 shadow-inner" value={manualForm.program} onChange={e => setManualForm({ ...manualForm, program: e.target.value })} placeholder="e.g. B.Ed Arts" /></div><div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Level</label><div className="relative"><select className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 transition-all duration-300 appearance-none [&>option]:bg-gray-900 shadow-inner" value={manualForm.level} onChange={e => setManualForm({ ...manualForm, level: e.target.value })}><option value="100">100</option><option value="200">200</option><option value="300">300</option><option value="400">400</option></select><div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div></div>
                    <div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Phone</label><input required className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 shadow-inner" value={manualForm.phone} onChange={e => setManualForm({ ...manualForm, phone: e.target.value })} placeholder="024..." /></div>
                </div>
                <div className="space-y-6">
                    <div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Residence / Hall</label><input required className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 shadow-inner" value={manualForm.residence} onChange={e => setManualForm({ ...manualForm, residence: e.target.value })} placeholder="e.g. Casford" /></div>
                    <div className="group"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-tein-green transition-colors">Constituency</label><input required className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:bg-white/5 focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 outline-none transition-all duration-300 shadow-inner" value={manualForm.constituency} onChange={e => setManualForm({ ...manualForm, constituency: e.target.value })} placeholder="e.g. Cape Coast North" /></div>
                    <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mt-4 relative group hover:border-yellow-500/40 transition-colors shadow-lg shadow-yellow-500/5">
                        <div className="absolute top-0 right-0 p-2 bg-yellow-500/20 rounded-bl-xl border-l border-b border-yellow-500/20 backdrop-blur-sm"><ShieldCheck className="w-4 h-4 text-yellow-500" /></div>
                        <label className="block text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-2 flex items-center gap-2">Optional: Manual ID Override</label>
                        <input className="w-full p-4 bg-black/40 border border-yellow-500/20 rounded-xl focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/50 outline-none font-mono text-sm text-yellow-200 placeholder-yellow-500/30 transition-all shadow-inner" value={manualForm.custom_id} onChange={e => setManualForm({ ...manualForm, custom_id: e.target.value })} placeholder="Leave empty to auto-generate (e.g. 26/1301)" />
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">Only use this if the student <b className="text-gray-300">already has</b> an assigned ID (e.g. 24/500).</p>
                    </div>
                </div>
                <div className="md:col-span-2 pt-6 border-t border-white/10 flex items-center justify-between">
                    {status === 'success' && <span className="text-tein-green font-bold flex items-center animate-pulse gap-2 bg-tein-green/10 px-4 py-2 rounded-lg border border-tein-green/20"><div className="w-2 h-2 bg-tein-green rounded-full shadow-[0_0_10px_rgba(0,168,89,0.8)]"></div>Record Saved Successfully!</span>}
                    <button disabled={status === 'loading'} className="ml-auto bg-gradient-to-r from-tein-green/90 to-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-[0_0_30px_rgba(0,104,55,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border border-white/10 disabled:opacity-50 relative overflow-hidden group/btn shadow-xl"><span className="relative z-10 flex items-center gap-2 tracking-wide">{status === 'loading' ? 'Saving Record...' : 'Save Member Record'} <ChevronRight className="w-4 h-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" /></span><div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-tein-green opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div></button>
                </div>
            </form>
        </div>
    )
}

const SettingsTab = ({ currentUser, profileForm, setProfileForm, compactMode, setCompactMode, isRealtime, lastUpdate }) => {
    const [securityForm, setSecurityForm] = useState({ newPassword: '', confirmPassword: '' })
    const [avatarUploading, setAvatarUploading] = useState(false)
    const fileInputRef = useRef(null)

    const getUserName = () => {
        if (profileForm.displayName) return profileForm.displayName
        if (!currentUser) return 'Super Admin'
        return currentUser.email?.split('@')[0] || 'Admin'
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profileForm.displayName }
            })
            if (error) throw error
            alert('Profile updated successfully!')
        } catch (error) {
            alert(error.message)
        }
    }

    const handleAvatarUpload = async (event) => {
        try {
            setAvatarUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('admin-avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('admin-avatars').getPublicUrl(filePath)

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })
            if (updateError) throw updateError

            setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }))
            alert('Avatar updated!')
        } catch (error) {
            alert('Error uploading avatar: ' + error.message)
        } finally {
            setAvatarUploading(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            alert("Passwords do not match!")
            return
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword })
            if (error) throw error
            setSecurityForm({ newPassword: '', confirmPassword: '' })
            alert("Password updated successfully!")
        } catch (error) {
            alert(error.message)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* 1. Profile & Avatar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Avatar Card */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-lg text-center relative group">
                    <div className="relative inline-block mb-4">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-tein-red via-white to-tein-green shadow-xl mx-auto">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {profileForm.avatarUrl ? (
                                    <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                                        <UserCircle className="w-16 h-16 text-white/50" />
                                    </div>
                                )}
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                        {avatarUploading && <p className="text-xs text-tein-green mt-2 animate-pulse">Uploading...</p>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{getUserName()}</h3>
                    <span className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5">
                        Super Administrator
                    </span>
                </div>

                {/* Edit Details */}
                <div className="md:col-span-2 bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <UserCircle className="w-5 h-5 text-tein-green" />
                        Profile Information
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                            <input
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-tein-green/50 focus:ring-1 focus:ring-tein-green/50 transition-all"
                                value={profileForm.displayName}
                                onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="group opacity-60 pointer-events-none">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email Address (Read Only)</label>
                            <input
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-gray-400 outline-none"
                                value={currentUser?.email || ''}
                                readOnly
                            />
                        </div>
                        <div className="flex justify-end">
                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/5">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 2. App Preferences */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    System Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg"><Monitor className="w-5 h-5 text-gray-300" /></div>
                            <div>
                                <p className="text-white font-bold text-sm">Compact Mode</p>
                                <p className="text-[10px] text-gray-500">Denser table view</p>
                            </div>
                        </div>
                        <div
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${compactMode ? 'bg-tein-green' : 'bg-gray-700'}`}
                            onClick={() => setCompactMode(!compactMode)}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Security */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-tein-red" />
                    Security Check
                </h3>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                            <input
                                type="password"
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                                value={securityForm.newPassword}
                                onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
                            <input
                                type="password"
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                                value={securityForm.confirmPassword}
                                onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all border border-red-500/10">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 mt-8 opacity-50">
                <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-tein-green' : 'bg-red-500'}`}></div>
                <p className="text-xs font-mono text-gray-500">
                    System Socket: {isRealtime ? 'CONNECTED' : 'DISCONNECTED'} &bull; Last Pulse: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'None'}
                </p>
            </div>
        </div>
    )
}

// --- MAIN COMPONENT ---

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview') // 'overview', 'members', 'manual', 'settings'
    const [stats, setStats] = useState({ totalMembers: 0, totalRevenue: 0, recent: [] })
    const [members, setMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // -- SETTINGS STATE --
    const [currentUser, setCurrentUser] = useState(null)
    const [profileForm, setProfileForm] = useState({ displayName: '', avatarUrl: '' })
    const [compactMode, setCompactMode] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('CONNECTING') // CONNECTING, SUBSCRIBED, ERROR, CLOSED
    const [lastUpdate, setLastUpdate] = useState(null)

    const navigate = useNavigate()

    // -- LOAD DATA & AUTH --
    useEffect(() => {
        fetchCurrentUser()
        fetchStats()
        fetchMembers()
        const cleanup = setupRealtimeSubscription()

        // Load preferences
        const savedPrefs = localStorage.getItem('tein_admin_prefs_v2')
        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs)
            setCompactMode(prefs.compactMode)
        }

        return () => {
            cleanup()
        }
    }, [])

    // Save prefs
    useEffect(() => {
        localStorage.setItem('tein_admin_prefs_v2', JSON.stringify({ compactMode }))
    }, [compactMode])

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        if (user) {
            setProfileForm({
                displayName: user.user_metadata?.full_name || '',
                avatarUrl: user.user_metadata?.avatar_url || ''
            })
        }
    }

    const setupRealtimeSubscription = () => {
        setConnectionStatus('CONNECTING')
        const channel = supabase
            .channel('public:members')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members' }, (payload) => {
                console.log('New member received!', payload)
                setLastUpdate(new Date())
                fetchStats()
                fetchMembers()
            })
            .subscribe((status) => {
                console.log('Realtime Status:', status)
                setConnectionStatus(status)
            })
        return () => {
            supabase.removeChannel(channel)
        }
    }

    const fetchStats = async () => {
        const { count } = await supabase.from('members').select('*', { count: 'exact' })
        const { data: payments } = await supabase.from('payments').select('amount')
        const revenue = payments?.reduce((sum, item) => sum + item.amount, 0) || 0
        setStats(prev => ({ ...prev, totalMembers: count || 0, totalRevenue: revenue }))
    }

    const fetchMembers = async () => {
        const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
        setMembers(data || [])
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin')
    }

    const getUserName = () => {
        if (profileForm.displayName) return profileForm.displayName
        if (!currentUser) return 'Super Admin'
        return currentUser.email?.split('@')[0] || 'Admin'
    }

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-gray-200 font-sans selection:bg-tein-green/30 flex overflow-hidden relative">

            {/* BACKGROUND SHAPES */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-30"></div>

                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-tein-green/10 rounded-full blur-[180px] opacity-60 animate-pulse duration-[10s]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-tein-red/10 rounded-full blur-[180px] opacity-50 animate-pulse duration-[12s]"></div>
                <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[150px] opacity-30 mix-blend-screen"></div>
            </div>

            {/* SIDEBAR */}
            <div className="hidden md:flex w-72 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex-col fixed h-full z-20 shadow-[10px_0_40px_rgba(0,0,0,0.5)]">
                <div className="p-8 border-b border-white/5 flex items-center gap-4 relative overflow-hidden group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-r from-tein-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center border border-white/20 shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-tein-red/20 via-transparent to-tein-green/20"></div>
                        <GraduationCap className="w-6 h-6 text-black relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white leading-none">TEIN UCC</h2>
                        <p className="text-[10px] text-tein-red font-bold uppercase tracking-widest mt-1">Portal Admin</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <div className="px-4 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Main Menu</div>

                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === 'overview' ? 'bg-gradient-to-r from-tein-green/20 to-transparent text-white border-l-4 border-tein-green shadow-[0_0_20px_rgba(0,104,55,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'}`}>
                        <LayoutDashboard className={`w-5 h-5 transition-colors ${activeTab === 'overview' ? 'text-tein-green' : 'group-hover:text-white'}`} />
                        Overview
                    </button>

                    <button onClick={() => setActiveTab('members')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === 'members' ? 'bg-gradient-to-r from-tein-red/20 to-transparent text-white border-l-4 border-tein-red shadow-[0_0_20px_rgba(200,0,0,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'}`}>
                        <Users className={`w-5 h-5 transition-colors ${activeTab === 'members' ? 'text-tein-red' : 'group-hover:text-white'}`} />
                        Members Database
                    </button>

                    <button onClick={() => setActiveTab('manual')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === 'manual' ? 'bg-gradient-to-r from-white/10 to-transparent text-white border-l-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'}`}>
                        <PlusCircle className={`w-5 h-5 transition-colors ${activeTab === 'manual' ? 'text-white' : 'group-hover:text-white'}`} />
                        Manual Entry
                    </button>

                    <div className="px-4 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 mt-8">System</div>

                    <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-500/20 to-transparent text-white border-l-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'}`}>
                        <Settings className={`w-5 h-5 transition-colors ${activeTab === 'settings' ? 'text-blue-500' : 'group-hover:text-white'}`} />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-sm font-bold border border-transparent hover:border-red-500/10 transition-all shadow-lg hover:shadow-red-900/20">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </div>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50 px-4 flex items-center justify-between shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-tein-red via-white to-tein-green"></div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black text-xs border border-white/20">NDC</div>
                    <span className="font-bold text-white tracking-tight">TEIN Admin</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 px-4 md:hidden">
                    <div className="space-y-4">
                        <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-4 text-tein-green font-bold border-b border-white/10 border-l-4 border-l-tein-green bg-white/5 rounded-r-xl">Overview</button>
                        <button onClick={() => { setActiveTab('members'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-4 text-tein-red font-bold border-b border-white/10 hover:bg-white/5 rounded-r-xl">Members Database</button>
                        <button onClick={() => { setActiveTab('manual'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-4 text-white font-bold border-b border-white/10 hover:bg-white/5 rounded-r-xl">Manual Entry</button>
                        <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-4 text-blue-500 font-bold border-b border-white/10 hover:bg-white/5 rounded-r-xl">Settings</button>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-4 text-red-400 font-bold border border-red-900/30 rounded-xl mt-8">Sign Out</button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 md:ml-72 p-4 md:p-10 pt-24 md:pt-10 relative z-10 overflow-y-auto h-screen scrollbar-hide w-full max-w-[100vw]">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/5">
                    <div>
                        <h1 className="text-4xl font-black text-white capitalize tracking-tighter flex items-center gap-3 mb-1">
                            {activeTab}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED' ? 'bg-tein-green animate-pulse' : connectionStatus === 'CONNECTING' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'}`}></span>
                            {connectionStatus === 'SUBSCRIBED' ? 'Online & Receiving Entries' :
                                connectionStatus === 'CONNECTING' ? 'Connecting to Server...' :
                                    `Disconnected (${connectionStatus})`}
                            {connectionStatus !== 'SUBSCRIBED' && connectionStatus !== 'CONNECTING' && (
                                <button onClick={setupRealtimeSubscription} className="text-[10px] ml-2 underline text-white hover:text-tein-green">Retry</button>
                            )}
                        </p>
                    </div>

                    <div onClick={() => setActiveTab('settings')} className="flex items-center gap-4 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 group-hover:text-white transition-colors">Logged In As</p>
                            <div className="flex items-center justify-end gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <p className="text-sm font-bold text-white capitalize">{getUserName()}</p>
                            </div>
                        </div>
                        <div className="p-1 rounded-full bg-gradient-to-tr from-tein-red via-white to-tein-green shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-black overflow-hidden">
                                {profileForm.avatarUrl ? (
                                    <img src={profileForm.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    getUserName().substring(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            {/* Stat Card 1 (Green) */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-tein-green/50 transition-all hover:bg-white/10 group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-tein-green/20 rounded-full blur-2xl group-hover:bg-tein-green/30 transition-all -mr-10 -mt-10"></div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                                        <Users className="w-8 h-8 text-tein-green" />
                                    </div>
                                    <div className="bg-tein-green/10 px-3 py-1 rounded-full border border-tein-green/20 text-[10px] font-bold text-tein-green uppercase tracking-wider">
                                        Active Verified
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Members</p>
                                    <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{stats.totalMembers}</p>
                                </div>
                                <div className="mt-6 h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-tein-green to-emerald-400 w-[70%] shadow-[0_0_10px_rgba(0,168,89,0.5)]"></div>
                                </div>
                            </div>

                            {/* Stat Card 2 (Red) */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-tein-red/50 transition-all hover:bg-white/10 group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-tein-red/20 rounded-full blur-2xl group-hover:bg-tein-red/30 transition-all -mr-10 -mt-10"></div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                                        <CreditCard className="w-8 h-8 text-tein-red" />
                                    </div>
                                    <div className="bg-tein-red/10 px-3 py-1 rounded-full border border-tein-red/20 text-[10px] font-bold text-tein-red uppercase tracking-wider">
                                        YTD Revenue
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
                                    <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                        <span className="text-2xl align-top opacity-50 mr-1">GHS</span>
                                        {stats.totalRevenue.toFixed(0)}
                                        <span className="text-2xl align-bottom opacity-50">.00</span>
                                    </p>
                                </div>
                                <div className="mt-6 h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-tein-red to-rose-500 w-[45%] shadow-[0_0_10px_rgba(200,0,0,0.5)]"></div>
                                </div>
                            </div>

                            {/* Stat Card 3 (White) */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-white/50 transition-all hover:bg-white/10 group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all -mr-10 -mt-10"></div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                                        <ShieldCheck className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="bg-white/10 px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                                        Secure Mode
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">System Status</p>
                                    <p className="text-3xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">{connectionStatus === 'SUBSCRIBED' ? 'Online' : 'Offline'}</p>
                                    <p className="text-xs text-gray-400 mt-2 font-medium">Status: {connectionStatus}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'members' && <MembersTable members={members} searchTerm={searchTerm} setSearchTerm={setSearchTerm} compactMode={compactMode} fetchStats={fetchStats} />}
                {activeTab === 'manual' && <ManualEntry fetchStats={fetchStats} />}
                {activeTab === 'settings' && (
                    <SettingsTab
                        currentUser={currentUser}
                        profileForm={profileForm}
                        setProfileForm={setProfileForm}
                        compactMode={compactMode}
                        setCompactMode={setCompactMode}
                        isRealtime={connectionStatus === 'SUBSCRIBED'}
                        lastUpdate={lastUpdate}
                    />
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-gray-600 font-medium py-4">
                    TEIN-UCC Portal &copy; {new Date().getFullYear()} &bull; Powered by UCC TEIN IT Team &bull; Secured with TEIN
                </div>

            </div>
        </div>
    )
}
