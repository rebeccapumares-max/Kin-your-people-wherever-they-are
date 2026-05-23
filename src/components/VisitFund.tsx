import React, { useState } from 'react';
import { VisitFund, FamilyMember } from '../types';
import { Landmark, Compass, Calendar, CheckSquare, Plus, Check, DollarSign, Bell, Sparkles, AlertCircle, Trash, Luggage } from 'lucide-react';

interface VisitFundProps {
  funds: VisitFund[];
  members: FamilyMember[];
  activeMemberId: string;
  onContribute: (fundId: string, amount: number) => void;
  onAddFund: (fund: VisitFund) => void;
  onAddItineraryItem: (fundId: string, item: string) => void;
  onTogglePackingItem: (fundId: string, index: number) => void;
  onAddPackingItem: (fundId: string, itemName: string, assignedId?: string) => void;
}

export default function VisitFundComponent({
  funds,
  members,
  activeMemberId,
  onContribute,
  onAddFund,
  onAddItineraryItem,
  onTogglePackingItem,
  onAddPackingItem
}: VisitFundProps) {
  const [selectedFundId, setSelectedFundId] = useState<string | null>(funds[0]?.id || null);
  const [contributionVal, setContributionVal] = useState<number>(100);

  // New Fund states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTarget, setNewTarget] = useState<number>(1200);
  const [newPartners, setNewPartners] = useState<string[]>([]);

  // Travel planning handoff additions states
  const [newItineraryMsg, setNewItineraryMsg] = useState('');
  const [newPackName, setNewPackName] = useState('');
  const [newPackAssignee, setNewPackAssignee] = useState('');

  const activeFund = funds.find(f => f.id === selectedFundId);
  const activeUser = members.find(m => m.id === activeMemberId);

  const handleDeposit = () => {
    if (!selectedFundId || contributionVal <= 0) return;
    onContribute(selectedFundId, contributionVal);
    alert(`🎉 Awesome! You added €${contributionVal} to the Jars. Everyone in the fund received a little push alert!`);
  };

  const handleCreateFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundName || !newCity || newTarget <= 0 || newPartners.length === 0) return;

    const fund: VisitFund = {
      id: `vf_${Date.now()}`,
      name: newFundName,
      destinationCity: newCity,
      targetAmount: newTarget,
      currentAmount: 0,
      participants: [activeMemberId, ...newPartners],
      flightStatus: {
        originCity: 'Rome/Madrid',
        currentPrice: 340,
        targetPrice: 300,
        trend: 'stable',
        lastChecked: new Date().toISOString()
      },
      milestones: [
        { percentage: 25, title: 'Flight booked conceptual', unlocked: false, momentMsg: '🎉 Start looking at flights!' },
        { percentage: 50, title: 'Halfway there celebration', unlocked: false, momentMsg: '🏡 Cozy flat in center' },
        { percentage: 75, title: 'Tapas & Dining Fund', unlocked: false },
        { percentage: 100, title: 'Takeoff Checklist!', unlocked: false }
      ],
      itinerary: [
        'Day 1: Landing reunion and coffee walk',
        'Day 2: City landmark explore tour'
      ],
      packingList: [
        { item: 'Toothbrush & personal care', packed: false, assignedId: activeMemberId },
        { item: 'Camera gear', packed: false }
      ]
    };

    onAddFund(fund);
    setShowCreateModal(false);
    // Reset Form
    setNewFundName('');
    setNewCity('');
    setNewTarget(1200);
    setNewPartners([]);
    setSelectedFundId(fund.id);
  };

  const submitItineraryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItineraryMsg.trim() || !selectedFundId) return;

    onAddItineraryItem(selectedRecipeId(), newItineraryMsg.trim());
    setNewItineraryMsg('');
  };

  const submitPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName.trim() || !selectedFundId) return;

    onAddPackingItem(selectedRecipeId(), newPackName.trim(), newPackAssignee || undefined);
    setNewPackName('');
    setNewPackAssignee('');
  };

  const togglePartnerSelection = (id: string) => {
    if (newPartners.includes(id)) {
      setNewPartners(newPartners.filter(p => p !== id));
    } else {
      setNewPartners([...newPartners, id]);
    }
  };

  const selectedRecipeId = () => selectedFundId || '';

  const getMemberName = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.name : 'Unknown';
  };

  const getMemberAvatar = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.avatar : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';
  };

  return (
    <div className="space-y-6" id="visit-funds-container">
      {/* Header element */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-natural-border shadow-xs">
        <div>
          <h2 className="text-2xl font-semibold serif text-[#2C2C2C] flex items-center gap-2">
            <Landmark className="w-5 h-5 text-terracotta" />
            Family Visit Funds
          </h2>
          <p className="text-xs text-natural-muted mt-0.5 animate-fade-in">Turn "we should visit" into real travel. Save collectively, monitor flight price decreases, and unlock shared trip itineraries.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sage text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-xl hover:bg-sage/95 transition-all shadow-2xs cursor-pointer flex items-center gap-1"
          id="create-fund-btn"
        >
          <Plus className="w-4 h-4" /> Assemble Visit Jar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="funds-main-grid">
        {/* Left Side: Savings Jars sidebar selectors */}
        <div className="lg:col-span-1 space-y-3" id="funds-sidebar">
          <span className="text-[10px] font-bold tracking-wider text-natural-muted uppercase">Joint Savings Jars</span>
          <div className="space-y-3">
            {funds.map(fund => {
              const isSelected = selectedFundId === fund.id;
              const percentage = Math.min(100, Math.round((fund.currentAmount / fund.targetAmount) * 100));

              return (
                <button
                  key={fund.id}
                  onClick={() => setSelectedFundId(fund.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? 'bg-gold/10 border-gold shadow-3xs' 
                      : 'bg-white border-natural-border hover:bg-natural-light/60'
                  }`}
                  id={`fund-summary-card-${fund.id}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[#2C2C2C] text-sm truncate">{fund.name}</h4>
                  </div>
                  
                  <p className="text-xs text-natural-muted mt-1">Goal: {fund.destinationCity}</p>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between items-center text-[11px] text-natural-muted font-mono">
                      <span>{percentage}% Funded</span>
                      <span>€{fund.currentAmount} / €{fund.targetAmount}</span>
                    </div>
                    {/* Progress slider mini bar */}
                    <div className="h-2 bg-natural-light rounded-full overflow-hidden">
                      <div className="h-full bg-sage transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>

                  <div className="flex -space-x-1.5 mt-3 select-none">
                    {fund.participants.map(p => (
                      <img key={p} src={getMemberAvatar(p)} alt="" className="w-5 h-5 rounded-full object-cover border border-white" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: savings workspace details & dynamic trip handoff tabs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200" id="jar-workspace-panel">
          {activeFund ? (
            (() => {
              const percentage = Math.min(100, Math.round((activeFund.currentAmount / activeFund.targetAmount) * 100));
              const handoffUnlocked = percentage >= 75; // Trip planning handbook unlocks at 75% or higher!

              return (
                <div className="space-y-6" id="active-jar-cabinet">
                  {/* Jar workspace Header */}
                  <div className="border-b border-slate-150 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{activeFund.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Target Destination: {activeFund.destinationCity} · Joint Savings Group</p>
                    </div>

                    <div className="flex -space-x-1.5 shrink-0 select-none items-center">
                      <span className="text-slate-400 text-xs mr-3 font-semibold font-mono">Savers:</span>
                      {activeFund.participants.map(p => (
                        <img key={p} src={getMemberAvatar(p)} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                      ))}
                    </div>
                  </div>

                  {/* Glass Jar visual simulation */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    {/* Glass Jar SVG Column (2/5) */}
                    <div className="md:col-span-2 p-4 bg-gradient-to-tr from-[#E0F2FE] to-[#F0FDFA] rounded-3xl border-2 border-[#99F6E4] flex flex-col items-center shadow-xs">
                      <span className="text-[10px] uppercase tracking-wider text-[#14B8A6] font-bold mb-3 font-mono flex items-center gap-1">💰 Savings Piggy Jar 🪙</span>
                      
                      <div className="relative w-40 h-52 bg-[#FCFAF5]/90 rounded-b-3xl rounded-t-xl border-4 border-[#14B8A6]/60 shadow-xl p-2 overflow-hidden flex flex-col justify-end">
                        {/* Jar neck collar */}
                        <div className="absolute top-0 left-12 right-12 h-4 bg-[#0D9488]/40 border border-[#0D9488]/70 rounded-lg"></div>
                        
                        {/* Shimmer sparkle top light to make it look super shiny */}
                        <div className="absolute top-4 left-4 right-4 h-1 bg-white/40 rounded-full blur-3xs"></div>

                        {/* Floating Coins / Hearts of shared excitement */}
                        {percentage > 0 && (
                          <>
                            <div className="absolute top-6 left-6 text-sm animate-bounce duration-1000 select-none">✨</div>
                            <div className="absolute top-12 right-6 text-base animate-pulse duration-500 select-none">🪙</div>
                            <div className="absolute top-20 left-1/2 text-xs animate-bounce select-none">💖</div>
                            <div className="absolute top-8 left-1/3 w-5 h-5 rounded-full bg-[#F59E0B] border border-amber-500 flex items-center justify-center font-bold text-[9px] text-[#2C2C2C] animate-bounce select-none shadow-xs">
                              €
                            </div>
                          </>
                        )}

                        {/* Rainbow Magic Sparkle Savings Liquid visual height */}
                        <div
                          className="w-full bg-gradient-to-t from-[#14B8A6] via-[#10B981] to-[#F59E0B] border-t-4 border-amber-300 shadow-inner rounded-b-2xl transition-all duration-700"
                          style={{ height: `${percentage}%`, minHeight: '6%' }}
                        >
                          {/* Inside bubbly particles */}
                          <div className="flex justify-around items-center h-full text-white/50 font-bold text-xs select-none">
                            {percentage > 15 && <span>🪙</span>}
                            {percentage > 40 && <span>✨</span>}
                            {percentage > 70 && <span>✈️</span>}
                          </div>
                        </div>

                        {/* Center Percentage Display with playful shadow */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 font-bold select-none">
                          <span className="text-2xl font-mono text-slate-800 drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]">{percentage}%</span>
                          <span className="text-[10px] text-slate-600 bg-white/70 px-2 py-0.5 rounded-full border border-white/40 drop-shadow-xs">Filled</span>
                        </div>
                      </div>

                      <div className="text-center mt-3 font-mono text-xs font-bold text-[#0D9488]">
                        Balance: €{activeFund.currentAmount} / €{activeFund.targetAmount}
                      </div>
                    </div>

                    {/* Contributing slide form Column (3/5) */}
                    <div className="md:col-span-3 space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pitch into the savings fund</span>
                        <div className="flex gap-2.5 mt-2">
                          {[50, 100, 200].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setContributionVal(amt)}
                              className={`flex-1 py-1.5 border text-xs font-bold rounded-lg cursor-pointer ${
                                contributionVal === amt 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              + €{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Custom Deposit: €{contributionVal}</label>
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={contributionVal}
                          onChange={(e) => setContributionVal(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <button
                        onClick={handleDeposit}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Drop €{contributionVal} Coins Inside
                      </button>

                      {/* Flight Watch module */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-250 flex items-center justify-between text-xs" id="flightwatch">
                        <div className="flex items-center gap-2">
                          <Bell className={`w-5 h-5 ${activeFund.flightStatus.trend === 'down' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              ✈️ FareWatch Companion
                              {activeFund.flightStatus.trend === 'down' && <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Price Drop!</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{activeFund.flightStatus.originCity} → {activeFund.destinationCity}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Current Cheapest</span>
                          <span className="font-bold text-slate-900 font-mono">€{activeFund.flightStatus.currentPrice} / ticket</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones celebrate */}
                  <div className="space-y-2.5 py-3 border-t">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Savings Milestones Progress</span>
                    <div className="grid grid-cols-4 gap-2">
                      {activeFund.milestones.map((milestone, i) => {
                        const isUnlocked = percentage >= milestone.percentage;
                        return (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isUnlocked 
                                ? 'bg-amber-50/50 border-amber-300 text-amber-900' 
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <span className="font-bold text-xs font-mono">{milestone.percentage}%</span>
                            <p className="text-[9px] mt-1 font-semibold leading-tight truncate" title={milestone.title}>
                              {milestone.title}
                            </p>
                            {isUnlocked && milestone.momentMsg && (
                              <p className="text-[8px] text-slate-400 mt-1 italic leading-tight truncate" title={milestone.momentMsg}>{milestone.momentMsg}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DYNAMIC HANDOFF TRAVEL GUIDE- BOOK OVER 75% FUNDED UNLOCKED */}
                  <div className="pt-4 border-t border-slate-100 space-y-4" id="handoff-trip-container">
                    <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border">
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          🧳 Trip planning booklet 
                          {handoffUnlocked ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full select-none">Unlocked!</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full select-none">Tethered at 75% savings</span>
                          )}
                        </span>
                        <p className="text-slate-500 font-sans text-[11px] mt-0.5">We unlock a collaborative itinerary builder and suitcase packing checklists at 75% funding milestone.</p>
                      </div>
                    </div>

                    {/* Handoff elements */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
                      handoffUnlocked ? 'opacity-100 scale-100' : 'opacity-40 blur-xs pointer-events-none select-none'
                    }`}>
                      {/* Joint Packing Checklist */}
                      <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border" id="joint-packlist">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Luggage className="w-4 h-4 text-slate-400" /> Suitcase checklists
                        </h4>

                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 text-left">
                          {activeFund.packingList.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => onTogglePackingItem(activeFund.id, idx)}
                              className="w-full flex items-center justify-between text-left p-2 bg-white rounded-lg border text-xs cursor-pointer hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center font-bold ${item.packed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                                  {item.packed && <Check className="w-3 h-3" />}
                                </span>
                                <span className={item.packed ? 'line-through text-slate-400' : 'text-slate-700'}>{item.item}</span>
                              </div>

                              {item.assignedId && (
                                <span className="bg-slate-105 text-slate-600 px-1.5 py-0.5 rounded-sm text-[9px]">
                                  {getMemberName(item.assignedId)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Add packing item form */}
                        <form onSubmit={submitPackingItem} className="flex gap-1">
                          <input
                            type="text"
                            required
                            value={newPackName}
                            onChange={(e) => setNewPackName(e.target.value)}
                            placeholder="Add packing item..."
                            className="flex-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white outline-emerald-500"
                          />
                          <select
                            value={newPackAssignee}
                            onChange={(e) => setNewPackAssignee(e.target.value)}
                            className="text-[10px] border rounded-md"
                          >
                            <option value="">Anyone</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="bg-slate-900 text-white px-2.5 text-xs font-bold rounded-md hover:bg-slate-800">Add</button>
                        </form>
                      </div>

                      {/* Collaborative Intinerary timeline */}
                      <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border" id="itinerary-timeline">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" /> Reunion Itinerary
                        </h4>

                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 text-left">
                          {activeFund.itinerary.map((line, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                              {line}
                            </div>
                          ))}
                        </div>

                        {/* Add Itinerary item form */}
                        <form onSubmit={submitItineraryItem} className="flex gap-1 bg-white p-1 rounded-xl border">
                          <input
                            type="text"
                            required
                            value={newItineraryMsg}
                            onChange={(e) => setNewItineraryMsg(e.target.value)}
                            placeholder="e.g. Day 4: Beach sunset picnic..."
                            className="flex-1 text-xs px-2.5 py-1.5 focus:outline-none"
                          />
                          <button type="submit" className="bg-slate-900 text-white font-bold text-xs px-3 rounded-lg hover:bg-slate-850">Draft Plan</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full space-y-3">
              <Landmark className="w-12 h-12 text-slate-300 animate-spin-slow" />
              <p className="text-slate-600 font-medium text-sm">Select an active visit piggy-bank jar on the left list to interact with.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE VISUAL JAR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="create-jar-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-xl animate-scale-up space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Assemble Joint Visit Fund</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateFund} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Savings Goal Name</label>
                <input
                  type="text"
                  required
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  placeholder="e.g. Grandma to Barcelona Summer 2026"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. London"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Savings Budget (€)</label>
                  <input
                    type="number"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value))}
                    placeholder="e.g. 1500"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-emerald-500 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Invite co-savers relative</label>
                <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto">
                  {members.filter(m => m.id !== activeMemberId).map(member => {
                    const selected = newPartners.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => togglePartnerSelection(member.id)}
                        className={`p-2 rounded-xl border text-xs text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                          selected 
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold' 
                            : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        <img src={member.avatar} alt="" className="w-5.5 h-5.5 rounded-full object-cover" />
                        <span>{member.name} ({member.relation})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-600 leading-relaxed">
                📢 Creating this joint savings jar flags everyone invited, listing flight watch alarms on their screens instantly!
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPartners.length === 0}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs ${
                    newPartners.length === 0 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Confirm Jars
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
