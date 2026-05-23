import React, { useState } from 'react';
import { Postcard, FamilyMember, UserState } from '../types';
import { Mail, Clock, HelpCircle, MapPin, Sparkles, AlertCircle, RefreshCw, Send, Lock, Eye, BookOpen, CreditCard } from 'lucide-react';

interface SlowPostProps {
  postcards: Postcard[];
  members: FamilyMember[];
  activeMemberId: string;
  userState: UserState;
  onSendPostcard: (postcard: Postcard) => void;
  onAddCredits: (creditsCount: number, cost: number) => void;
}

export default function SlowPost({ postcards, members, activeMemberId, userState, onSendPostcard, onAddCredits }: SlowPostProps) {
  const [activeTab, setActiveTab] = useState<'writer' | 'archive' | 'store'>('writer');
  
  // Writer Form States
  const [selectedPhoto, setSelectedPhoto] = useState('https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80');
  const [cardMessage, setCardMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [shipDelayDays, setShipDelayDays] = useState<number>(5);

  const selectedRecipient = members.find(m => m.id === recipientId);
  const activeSender = members.find(m => m.id === activeMemberId);

  // Helper to determine destination region and pricing
  const calculatePostcardPrice = (recipient?: FamilyMember) => {
    if (!recipient) return 2.50;
    // Rome, Barcelona -> Europe (2.50), Boston, Tokyo -> Worldwide (3.50)
    if (recipient.city === 'Rome' || recipient.city === 'Barcelona') {
      return 2.50;
    }
    return 3.50;
  };

  const getPrice = calculatePostcardPrice(selectedRecipient);

  const handleRefillCredits = (volume: number, cost: number) => {
    onAddCredits(volume, cost);
  };

  const submitPostcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !cardMessage.trim()) return;
    if (userState.postcardCredits < 1) {
      alert('You are out of Postcard credits! Refill custom stamps at the Stamp Store tab.');
      setActiveTab('store');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calculate arrival date based on delayed stamp selection
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + shipDelayDays);
    const arrivalDateStr = arrivalDate.toISOString().split('T')[0];

    const postcard: Postcard = {
      id: `pc_${Date.now()}`,
      photoUrl: selectedPhoto,
      message: cardMessage.trim().substring(0, 150), // Hard limit
      senderId: activeSender?.id || 'mateo',
      recipientId: recipientId,
      sentDate: todayStr,
      delayDays: shipDelayDays,
      arrivalDate: arrivalDateStr,
      status: 'pending',
      price: getPrice
    };

    onSendPostcard(postcard);
    setCardMessage('');
    alert(`⚡ Postcard scheduled! Kin printed and mailed a physical envelope to ${selectedRecipient?.name} in ${selectedRecipient?.city}. Estimated arrival in ${shipDelayDays} days.`);
    setActiveTab('archive');
  };

  const getMemberName = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.name : 'Unknown';
  };

  const getMemberCity = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.city : 'Unknown';
  };

  const postcardThemes = [
    { name: 'Kyoto Cherry', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80' },
    { name: 'Rome Archs', url: 'https://images.unsplash.com/photo-1542820229-081e555779c7?auto=format&fit=crop&w=500&q=80' },
    { name: 'Seaside Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80' },
    { name: 'Rustic Table', url: 'https://images.unsplash.com/photo-1517093602195-b40af9688b46?auto=format&fit=crop&w=500&q=80' }
  ];

  return (
    <div className="space-y-6" id="slow-post-container">
      {/* Header Stamp wallet */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-natural-border shadow-xs" id="post-header-summary">
        <div>
          <h2 className="text-2xl font-semibold serif text-[#2C2C2C] flex items-center gap-2">
            <Mail className="w-5 h-5 text-terracotta animate-pulse" />
            Slow Post Office
          </h2>
          <p className="text-xs text-natural-muted mt-0.5 animate-fade-in">Real printed postcards, deliberately delayed worldwide. Send custom keepsakes from your screen directly into their mailbox.</p>
        </div>

        <div className="bg-sage/10 border border-sage/20 px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div>
            <span className="text-[10px] text-sage uppercase font-bold tracking-wider block">Your Stamps Wallet</span>
            <span className="font-mono text-xs font-bold text-[#2C2C2C]">{userState.postcardCredits} Stamps Available</span>
          </div>
          <button
            onClick={() => setActiveTab('store')}
            className="bg-sage hover:bg-sage/95 text-white font-bold uppercase tracking-wider text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            Refill
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 p-1 bg-natural-light border border-natural-border rounded-xl w-max">
        <button
          onClick={() => setActiveTab('writer')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === 'writer' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
          }`}
        >
          Send Postcard
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === 'archive' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
          }`}
        >
          Postcard Archive ({postcards.length})
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === 'store' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
          }`}
        >
          Stamp Store
        </button>
      </div>

      {/* RENDER ACTIVE VIEW */}

      {/* 1. SEND POSTCARD WRITER */}
      {activeTab === 'writer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start" id="post-writer-grid">
          {/* Left panel: Creator Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-950">Compose Postcard</h3>
            
            <form onSubmit={submitPostcard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">1. Choose Family Recipient</label>
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 outline-indigo-500"
                >
                  <option value="">-- Who should get this card? --</option>
                  {members.filter(m => m.id !== activeMemberId).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.city}, {m.relation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">2. Pick Postcard Photo Front</label>
                <div className="grid grid-cols-4 gap-2">
                  {postcardThemes.map(theme => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => setSelectedPhoto(theme.url)}
                      className={`h-14 rounded-lg overflow-hidden border-2 relative transition-all cursor-pointer ${
                        selectedPhoto === theme.url ? 'border-indigo-600 shadow-md scale-102' : 'border-slate-100 hover:opacity-90'
                      }`}
                      title={theme.name}
                    >
                      <img src={theme.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">3. Select Transit Delay Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 7].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setShipDelayDays(days)}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        shipDelayDays === days 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-800' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ⏳ {days} Days Transit
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">The magic is in the wait. Shh! Messages are digitally locked until the transit runs out.</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-400 uppercase block">4. Write Postcard Message (Postcard Rules)</label>
                  <span className={`text-xs font-bold ${cardMessage.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                    {150 - cardMessage.length} left
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={150}
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="Max 150 characters. Keep it brief, authentic, and nostalgic..."
                  className="w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-indigo-500"
                />
              </div>

              {selectedRecipient && (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-natural-border flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-natural-muted uppercase block font-semibold">Postage estimate</span>
                    <span className="font-bold text-natural-text">Mailed to {selectedRecipient.city} ({selectedRecipient.timezone === 'Europe/Madrid' || selectedRecipient.timezone === 'Europe/Rome' ? 'Europe Zone' : 'Worldwide Zone'})</span>
                  </div>
                  <span className="font-mono font-bold text-natural-text bg-white border border-natural-border px-2.5 py-1 rounded-md">
                    €{getPrice.toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={userState.postcardCredits < 1}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs ${
                  userState.postcardCredits < 1 
                    ? 'bg-natural-light border border-natural-border text-natural-muted cursor-not-allowed' 
                    : 'bg-sage text-white hover:bg-sage/95'
                }`}
                id="submit-postcard-btn"
              >
                <Send className="w-3.5 h-3.5" />
                Produce & Mail Physical Postcard (Uses 1 Stamp)
              </button>
            </form>
          </div>

          {/* Right panel: Postcard Preview Showcase CARD Mockup */}
          <div className="space-y-4 lg:sticky lg:top-4" id="post-preview-panel">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Postcard preview</span>

            {/* Front Photo Card mockup */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-md space-y-4" id="postcard-preview-showcase">
              <div className="text-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">FRONT CARD PHOTO</div>
              <div className="h-56 rounded-xl overflow-hidden shadow-inner">
                <img src={selectedPhoto} alt="Front card background choice" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Back Card mockup */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border-4 border-double border-slate-300 shadow-md min-h-[240px] flex flex-col md:flex-row gap-6 relative font-serif text-xs text-slate-700 overflow-hidden" id="postcard-preview-back-mock">
              {/* Classic Airmail Striped Borders Accent on edges */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeating-linear-gradient" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #EC4899 0px, #EC4899 15px, #FFFFFF 15px, #FFFFFF 30px, #3B82F6 30px, #3B82F6 45px, #FFFFFF 45px, #FFFFFF 60px)' }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-repeating-linear-gradient" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #EC4899 0px, #EC4899 15px, #FFFFFF 15px, #FFFFFF 30px, #3B82F6 30px, #3B82F6 45px, #FFFFFF 45px, #FFFFFF 60px)' }}></div>
              
              {/* Back card spine line */}
              <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-slate-200 hidden md:block select-none pointer-events-none"></div>

              {/* Message Left half */}
              <div className="md:w-1/2 space-y-3 pr-2 text-left relative min-h-24 pt-2">
                <p className="font-mono text-[9px] text-[#A1A1AA] uppercase pb-2 border-b select-none">✍️ Fountain Pen Message</p>
                <p className="leading-relaxed whitespace-pre-wrap font-serif italic text-[#0F766E] text-base font-medium tracking-wide">
                  {cardMessage ? `"${cardMessage}"` : '"Your brief warm thoughts will sit beautifully printed right here in retro ink..."'}
                </p>
              </div>

              {/* Stamp & Address Right half */}
              <div className="md:w-1/2 md:pl-4 space-y-4 flex flex-col justify-between text-left pt-2">
                <div className="flex justify-between items-start">
                  <div className="text-[9px] font-sans text-slate-400 font-bold uppercase select-none">AIRMAIL POSTAGE</div>
                  {/* Dynamic Stamp mockup based on photo selection */}
                  <div className="w-13 h-15 border-2 border-dashed border-[#D97706] rounded-sm p-1 flex flex-col items-center justify-between bg-white shadow-md select-none transform rotate-2">
                    <span className="font-mono text-[8px] text-[#D97706] font-extrabold tracking-widest">POSTE</span>
                    {selectedPhoto.includes('cherry') && <span className="text-xl">🌸</span>}
                    {selectedPhoto.includes('Rome') && <span className="text-xl">🏛️</span>}
                    {selectedPhoto.includes('Sunset') && <span className="text-xl">🏖️</span>}
                    {selectedPhoto.includes('Rustic') && <span className="text-xl">🥖</span>}
                    {!['cherry', 'Rome', 'Sunset', 'Rustic'].some(kw => selectedPhoto.includes(kw)) && <span className="text-xl">📬</span>}
                    <span className="text-[7px] text-slate-500 font-bold">€3.50</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-sans pt-4" id="preview-address-block">
                  <div className="h-0.5 bg-slate-200 w-full mb-1"></div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase select-none">DELIVER TO:</div>
                  <p className="text-[#1E293B] font-bold text-xs">
                    {selectedRecipient ? `To: ${selectedRecipient.name}` : 'Recipient Name Placeholder'}
                  </p>
                  <p className="text-slate-500 text-[10px] italic">
                    {selectedRecipient ? `Private residence, near ${selectedRecipient.city}` : 'Full Address Lane'}
                  </p>
                  <p className="text-slate-400 text-[9px] font-mono">
                    {selectedRecipient ? selectedRecipient.timezone === 'Europe/Madrid' || selectedRecipient.timezone === 'Europe/Rome' ? '🛫 Europe Postal Route' : '🛫 Transatlantic Skyways' : 'Destination Country'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. POSTCARD DIGITAL ARCHIVE drawer */}
      {activeTab === 'archive' && (
        <div className="space-y-6" id="archive-tab-view">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="postcard-cabinet-grid">
            {postcards.map((pc, index) => {
              const isFuture = pc.arrivalDate > '2026-05-23'; // Locked! Currently May 23, 2026.
              const sender = members.find(m => m.id === pc.senderId);
              const recipient = members.find(m => m.id === pc.recipientId);

              return (
                <div
                  key={pc.id}
                  className={`bg-white rounded-3xl overflow-hidden border p-5 shadow-xs space-y-4 transition-all duration-300 ${
                    isFuture ? 'border-indigo-100 bg-[#FAF9FD]' : 'border-slate-200'
                  }`}
                  id={`postcard-cabinet-card-${pc.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Postal Route</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {sender ? sender.name : 'Someone'} → {recipient ? recipient.name : 'Someone'}
                      </p>
                    </div>
                    <div>
                      <span className="bg-indigo-50 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-md">
                        {isFuture ? '📦 IN TRANSIT' : '📬 DELIVERED'}
                      </span>
                    </div>
                  </div>

                  {/* Photo with locked/unlocked visual wrapper */}
                  <div className="h-44 rounded-xl overflow-hidden relative shadow-inner">
                    <img src={pc.photoUrl} alt="" className="w-full h-full object-cover" />
                    {isFuture && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                        <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
                        <h4 className="font-semibold text-sm">Physical Card en route!</h4>
                        <p className="text-[10px] text-slate-350 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg leading-relaxed max-w-xs">
                          Preview Notification Pinned. Estimated delivery to {getMemberCity(pc.recipientId)} in <strong>{pc.delayDays} days ({pc.arrivalDate})</strong>. Shh! Message locked until card reaches their hand.
                        </p>
                      </div>
                    )}
                  </div>

                  {!isFuture && (
                    <div className="bg-[#FAF8F5] p-4.5 rounded-2xl border border-slate-200 text-left relative font-serif text-slate-700" id="cabinet-card-msg">
                      {/* Stamp design */}
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 border border-dashed border-indigo-400 rounded-sm flex items-center justify-center text-[8px] font-mono text-indigo-600 bg-white">
                        KIN
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">Handwritten message</span>
                      <p className="text-sm font-sans italic text-slate-800 leading-relaxed mt-2">
                        "{pc.message}"
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-200 mt-3">
                        <span>Stamp Cost: €{pc.price.toFixed(2)}</span>
                        <span>Mailed: {pc.sentDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {postcards.length === 0 && (
              <div className="md:col-span-2 py-16 text-center text-xs text-slate-400 italic">
                Postal cabinet is empty. Send premium postcards to populate this.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STAMP STORE Refill portal */}
      {activeTab === 'store' && (
        <div className="space-y-6" id="stamp-store-view">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-8">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Refill Stamps - Pay Per Send</span>
            <h3 className="text-2xl font-bold text-slate-900">No subscription needed. Premium pay-per-send.</h3>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Our postal system handles automated high-quality heavy stock printing and international priority mailing routes to keep your families connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto" id="pricing-packages">
            {/* Package 1 */}
            <div className="bg-white p-6 rounded-3xl border border-natural-border hover:border-sage transition shadow-xs text-center space-y-5" id="stamps-pack-5">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto text-sage font-bold text-lg">
                5
              </div>
              <div>
                <h4 className="font-bold text-natural-text">Small Keepsake Bundle</h4>
                <p className="text-xs text-natural-muted mt-0.5">5 International stamps for slow postcards.</p>
              </div>
              <div className="text-2xl font-bold serif text-natural-text">
                €12.00 <span className="text-xs text-natural-muted font-normal">/ flat</span>
              </div>
              <p className="text-[10px] text-natural-muted">Equivalent to €2.40 per stamp (Saves €0.60 per worldwide letter!).</p>
              <button
                onClick={() => handleRefillCredits(5, 12.00)}
                className="w-full bg-[#2C2C2C] text-white border border-[#2C2C2C] font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl hover:bg-[#2C2C2C]/90 cursor-pointer transition-colors"
              >
                Purchase Bundle Pack
              </button>
            </div>

            {/* Package 2 */}
            <div className="bg-white p-6 rounded-3xl border-2 border-sage hover:border-sage/90 transition shadow-xs text-center space-y-5 relative" id="stamps-pack-10">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-sage text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-sage/25">MOST POPULAR STAMPS</span>
              <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto text-sage font-bold text-lg">
                10
              </div>
              <div>
                <h4 className="font-bold text-natural-text">Generational Archival Pack</h4>
                <p className="text-xs text-natural-muted mt-0.5">10 International stamps for slow postcards.</p>
              </div>
              <div className="text-2xl font-bold serif text-natural-text">
                €20.00 <span className="text-xs text-natural-muted font-normal">/ flat</span>
              </div>
              <p className="text-[10px] text-sage font-bold font-mono">Equivalent to €2.00 per stamp (Saves €1.50 per worldwide card!).</p>
              <button
                onClick={() => handleRefillCredits(10, 20.00)}
                className="w-full bg-sage text-white font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl hover:bg-sage/95 cursor-pointer transition-colors"
              >
                Purchase Archival Pack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
