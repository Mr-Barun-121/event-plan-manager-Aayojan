import React, { useState } from 'react';
import { VendorRecord, VendorCategoryGuide, EventProfile, VendorStatus } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  HelpCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle, 
  DollarSign, 
  Trash2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Scale
} from 'lucide-react';

interface VendorHubProps {
  event: EventProfile;
  vendors: VendorRecord[];
  setVendors: React.Dispatch<React.SetStateAction<VendorRecord[]>>;
  categoryGuides: VendorCategoryGuide[];
  currency: string;
  onAskCopilot: (prompt: string) => void;
}

export const VendorHub: React.FC<VendorHubProps> = ({
  event,
  vendors,
  setVendors,
  categoryGuides,
  currency,
  onAskCopilot,
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'guides' | 'comparison'>('tracker');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(categoryGuides[0]?.category || null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  // New vendor form state
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Catering');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorQuote, setVendorQuote] = useState('');
  const [vendorAdvance, setVendorAdvance] = useState('');
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>('shortlisted');
  const [vendorNotes, setVendorNotes] = useState('');

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    const newRecord: VendorRecord = {
      id: `v-${Date.now()}`,
      name: vendorName.trim(),
      category: vendorCategory,
      contactPerson: vendorContact.trim(),
      phone: vendorPhone.trim(),
      email: vendorEmail.trim(),
      quoteAmount: parseFloat(vendorQuote) || 0,
      advancePaid: parseFloat(vendorAdvance) || 0,
      status: vendorStatus,
      notes: vendorNotes.trim(),
    };

    setVendors((prev) => [...prev, newRecord]);
    setVendorName('');
    setVendorContact('');
    setVendorPhone('');
    setVendorEmail('');
    setVendorQuote('');
    setVendorAdvance('');
    setVendorNotes('');
    setIsAddVendorOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: VendorStatus) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
  };

  const handleDeleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Metrics
  const totalQuotes = vendors.reduce((acc, v) => acc + (v.quoteAmount || 0), 0);
  const totalAdvancesPaid = vendors.reduce((acc, v) => acc + (v.advancePaid || 0), 0);
  const bookedCount = vendors.filter((v) => v.status === 'booked' || v.status === 'paid').length;

  return (
    <div className="space-y-6">
      
      {/* Sub Header & Switcher */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 festive-card-glow">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display font-black text-stone-900 text-xl">Vendor & Contract Hub</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {bookedCount} Booked / {vendors.length} Total
            </span>
          </div>
          <p className="font-serif-festive italic text-xs text-amber-800 mt-1">
            Compare vendor quotes, safeguard contracts with AI scrutiny, and manage booking advances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sub Navigation */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'tracker' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Vendor Tracker
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guides')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'guides' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Questions & Red Flags
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'comparison' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Quote Matrix
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddVendorOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Contract Quotes</span>
          <div className="text-xl font-black text-stone-900 mt-1">
            {formatCurrency(totalQuotes, currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Advances Transferred</span>
          <div className="text-xl font-black text-indigo-950 mt-1">
            {formatCurrency(totalAdvancesPaid, currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Pending Balance Due</span>
          <div className="text-xl font-black text-amber-900 mt-1">
            {formatCurrency(Math.max(totalQuotes - totalAdvancesPaid, 0), currency)}
          </div>
        </div>
      </div>

      {/* TAB 1: Vendor Tracker Table */}
      {activeTab === 'tracker' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-400 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Vendor & Category</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quote</th>
                  <th className="py-3 px-4 text-right">Advance Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                        <p className="font-bold text-stone-800 text-xs">No vendors tracked yet</p>
                        <p className="text-[11px] text-stone-500">
                          Click &quot;Add Vendor Record&quot; to log quotes, contracts, and advances, or explore the Vendor Shield Guides for hiring tips.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => {
                    const remaining = Math.max((vendor.quoteAmount || 0) - (vendor.advancePaid || 0), 0);
                    return (
                      <tr key={vendor.id} className="hover:bg-stone-50/60 transition-colors">
                        {/* Name & Category */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-stone-900 block text-sm">{vendor.name}</span>
                        <span className="text-[11px] text-amber-700 font-semibold">{vendor.category}</span>
                        {vendor.notes && (
                          <span className="text-[11px] text-stone-400 block mt-0.5">{vendor.notes}</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-stone-500">
                        {vendor.contactPerson && (
                          <div className="font-semibold text-stone-800">{vendor.contactPerson}</div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-600">
                            <Phone className="w-3 h-3 text-stone-400" /> {vendor.phone}
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-600">
                            <Mail className="w-3 h-3 text-stone-400" /> {vendor.email}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={vendor.status}
                          onChange={(e) => handleUpdateStatus(vendor.id, e.target.value as VendorStatus)}
                          className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                            vendor.status === 'booked' || vendor.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : vendor.status === 'contacted'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <option value="shortlisted">Shortlisted</option>
                          <option value="contacted">Contacted</option>
                          <option value="booked">Booked & Confirmed</option>
                          <option value="paid">Fully Settled</option>
                        </select>
                      </td>

                      {/* Quote */}
                      <td className="py-3 px-4 text-right font-bold text-stone-900 whitespace-nowrap">
                        {formatCurrency(vendor.quoteAmount, currency)}
                      </td>

                      {/* Advance */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-emerald-700">
                        {formatCurrency(vendor.advancePaid, currency)}
                      </td>

                      {/* Remaining */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-stone-600">
                        {formatCurrency(remaining, currency)}
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AI Category Guides & Questions to Ask */}
      {activeTab === 'guides' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Expert Vendor Shield:</span> These questions and red flag alerts are generated specifically for your {event.eventType}. Never sign a contract until questions in each category are answered in writing!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryGuides.map((guide, idx) => {
              const isExpanded = expandedCategory === guide.category;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs transition-all"
                >
                  <div
                    onClick={() => setExpandedCategory(isExpanded ? null : guide.category)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                        <span>{guide.category}</span>
                      </h4>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Book: {guide.leadTime}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 text-xs">
                      
                      {/* Questions to ask */}
                      <div>
                        <span className="font-bold text-stone-800 flex items-center gap-1.5 text-xs mb-2">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          Essential Questions to Ask:
                        </span>
                        <ul className="space-y-1.5 pl-5 list-disc text-stone-600">
                          {guide.questionsToAsk.map((q, qIdx) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Red Flags */}
                      <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                        <span className="font-bold text-rose-800 flex items-center gap-1.5 text-xs mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Red Flags to Walk Away From:
                        </span>
                        <ul className="space-y-1 pl-5 list-disc text-rose-900 text-[11px]">
                          {guide.redFlags.map((rf, rfIdx) => (
                            <li key={rfIdx}>{rf}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Documents Needed */}
                      <div>
                        <span className="font-bold text-stone-800 flex items-center gap-1.5 text-xs mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          Required Contract Clauses & Documents:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {guide.documentsNeeded.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md"
                            >
                              ✓ {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onAskCopilot(`What are custom negotiation tips and contract questions for our ${guide.category} vendor for ${event.title}?`)}
                          className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Generate Custom Negotiation Script</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Quote Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-stone-900 text-sm">Quote Comparison Matrix</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                      {v.category}
                    </span>
                    <span className="capitalize font-semibold text-stone-500 text-[11px]">{v.status}</span>
                  </div>
                  <h5 className="font-bold text-stone-900 text-sm">{v.name}</h5>
                  <div className="text-xl font-black text-stone-900 mt-2">
                    {formatCurrency(v.quoteAmount, currency)}
                  </div>
                  {v.notes && <p className="text-xs text-stone-500 mt-2">{v.notes}</p>}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Advance: {formatCurrency(v.advancePaid, currency)}</span>
                  <button
                    type="button"
                    onClick={() => onAskCopilot(`Compare this quote of ${currency}${v.quoteAmount} for ${v.category} (${v.name}) against typical market rates for ${event.guestCount} guests.`)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    AI Rate Check
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 mb-1">Add Vendor Candidate</h3>
            <p className="text-xs text-stone-500 mb-4">
              Track vendor quotes and communications.
            </p>

            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Vendor Name / Business</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Royal Rajputana Caterers / LensCraft Photography"
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Photography">Photography</option>
                    <option value="Decor & Florals">Decor & Florals</option>
                    <option value="Music & DJ">Music & DJ</option>
                    <option value="Attire & Beauty">Attire & Beauty</option>
                    <option value="Bakery">Bakery & Cake</option>
                    <option value="Logistics">Logistics / AV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                  <select
                    value={vendorStatus}
                    onChange={(e) => setVendorStatus(e.target.value as VendorStatus)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="shortlisted">Shortlisted</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked & Confirmed</option>
                    <option value="paid">Fully Settled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quote Amount ({currency})</label>
                  <input
                    type="number"
                    value={vendorQuote}
                    onChange={(e) => setVendorQuote(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Advance Paid ({currency})</label>
                  <input
                    type="number"
                    value={vendorAdvance}
                    onChange={(e) => setVendorAdvance(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="Name..."
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="Phone..."
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="e.g. Includes equipment, tasting scheduled for next Friday..."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
