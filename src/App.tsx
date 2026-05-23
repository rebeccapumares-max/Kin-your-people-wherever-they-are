import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MEMBERS, 
  INITIAL_MEMORIES, 
  INITIAL_RECIPES, 
  INITIAL_POSTCARDS, 
  INITIAL_CHAINS, 
  INITIAL_FUNDS 
} from './data';
import { 
  FamilyMember, 
  Memory, 
  Recipe, 
  Postcard, 
  VoiceChain, 
  VisitFund, 
  UserState 
} from './types';

// Component Imports
import FamilyMap from './components/FamilyMap';
import MemoryShelf from './components/MemoryShelf';
import RecipeVault from './components/RecipeVault';
import SlowPost from './components/SlowPost';
import VoiceChainComponent from './components/VoiceChain';
import VisitFundComponent from './components/VisitFund';
import PricingDashboard from './components/PricingDashboard';

// Icon Imports
import { 
  Map, 
  BookOpen, 
  ChefHat, 
  Mail, 
  Volume2, 
  PiggyBank, 
  CreditCard, 
  Bell, 
  Gift, 
  Link2, 
  X, 
  Compass, 
  Sparkles, 
  Globe, 
  UserPlus,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Current Global Simulated Time (Static Mock as provided: May 23, 2026)
  const currentTimeStr = "2026-05-23T21:50:10Z";

  // Application database collections in React state
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS);
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [postcards, setPostcards] = useState<Postcard[]>(INITIAL_POSTCARDS);
  const [chains, setChains] = useState<VoiceChain[]>(INITIAL_CHAINS);
  const [funds, setFunds] = useState<VisitFund[]>(INITIAL_FUNDS);

  // Active workspace user settings
  const [userState, setUserState] = useState<UserState>({
    activeMemberId: 'mateo', // Active viewing user (e.g. Mateo Rossi)
    tier: 'family', // Free, Family, or Heirloom
    postcardCredits: 4, // Starts with 4 credits
    postcardsPackCount: 0
  });

  const [activeTab, setActiveTab] = useState<'map' | 'moments' | 'cook' | 'post' | 'voice' | 'jar' | 'plan'>('map');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Catch general alerts and show custom persistent layout feedback (for sandbox compliance)
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      setToastMessage(message);
      // Auto dismiss after 5 seconds to prevent memory build-up
      const timer = setTimeout(() => {
        setToastMessage(m => m === message ? null : m);
      }, 5000);
      return () => clearTimeout(timer);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Invitations States (Invite by magic Link)
  const [elderName, setElderName] = useState('');
  const [elderCity, setElderCity] = useState('');
  const [elderRelation, setElderRelation] = useState('Grandfather');

  const activePersona = members.find(m => m.id === userState.activeMemberId) || members[0];

  // Handlers for Memories Drawer
  const handleAddMemory = (newMemory: Memory) => {
    setMemories([newMemory, ...memories]);
  };

  // Handlers for Recipes
  const handleAddRecipe = (newRecipe: Recipe) => {
    setRecipes([newRecipe, ...recipes]);
  };

  const handleAddAnnotation = (recipeId: string, text: string) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          annotations: [
            ...recipe.annotations,
            {
              id: `ann_${Date.now()}`,
              authorId: userState.activeMemberId,
              text,
              date: new Date().toISOString().split('T')[0]
            }
          ]
        };
      }
      return recipe;
    }));
  };

  // Handlers for Postcards
  const handleSendPostcard = (postcard: Postcard) => {
    setPostcards([postcard, ...postcards]);
    setUserState(prev => ({
      ...prev,
      postcardCredits: Math.max(0, prev.postcardCredits - 1)
    }));
  };

  const handleAddCredits = (stampsCount: number, cost: number) => {
    setUserState(prev => ({
      ...prev,
      postcardCredits: prev.postcardCredits + stampsCount,
      postcardsPackCount: prev.postcardsPackCount + 1
    }));
    alert(`💳 SIMULATED GATEWAY: Pack of ${stampsCount} stamps added to your Kin Wallet. (Charge of €${cost.toFixed(2)} mock deducted from card).`);
  };

  // Handlers for Voice Chains
  const handleAddChain = (chain: VoiceChain) => {
    setChains([chain, ...chains]);
  };

  const handleAddChainReply = (chainId: string, duration: number, audioUrl?: string, transcript?: string) => {
    const activeMember = members.find(m => m.id === userState.activeMemberId);
    const activeName = activeMember ? activeMember.name : 'Mateo';
    const randomTranscripts = [
      `Hey everyone, ${activeName} here! Recorded a short check-in check! Just listening to all of your amazing messages and feeling super connected. Wish I was there eating with you!`,
      `Yo! It is ${activeName}. Loved listening to this tape. Standard busy week for me, but this voice loop is the best thing about my Sunday. Sending huge hugs!`,
      `Greetings family! ${activeName} speaking. Taping this quick audio note to tell you all is wonderful on my end. I can hear you loud and clear. Talk on next rotation!`
    ];
    const generatedTranscript = randomTranscripts[Math.floor(Math.random() * randomTranscripts.length)];

    setChains(prev => prev.map(chain => {
      if (chain.id === chainId) {
        const updatePartners = chain.participants.filter(pId => pId !== userState.activeMemberId);
        return {
          ...chain,
          updatedAt: new Date().toISOString(),
          unreadBy: updatePartners, // Flag unread for others so they reply later
          messages: [
            ...chain.messages,
            {
              id: `vm_${Date.now()}`,
              senderId: userState.activeMemberId,
              duration,
              timestamp: new Date().toISOString(),
              transcript: transcript || generatedTranscript,
              audioUrl: audioUrl
            }
          ]
        };
      }
      return chain;
    }));
    alert('🎙️ Simulation: Message appended securely onto the loop timeline!');
  };

  // Handlers for Visit Jars
  const handleContribute = (fundId: string, amount: number) => {
    setFunds(prev => prev.map(f => {
      if (f.id === fundId) {
        const updatedAmount = f.currentAmount + amount;
        const updatedPercentage = Math.min(100, Math.round((updatedAmount / f.targetAmount) * 100));
        
        // Auto-unlock matching milestone markers
        const updatedMilestones = f.milestones.map(m => {
          if (updatedPercentage >= m.percentage) {
            return { ...m, unlocked: true };
          }
          return m;
        });

        return {
          ...f,
          currentAmount: updatedAmount,
          milestones: updatedMilestones
        };
      }
      return f;
    }));
  };

  const handleAddFund = (fund: VisitFund) => {
    setFunds([fund, ...funds]);
  };

  const handleAddItineraryItem = (fundId: string, item: string) => {
    setFunds(prev => prev.map(f => {
      if (f.id === fundId) {
        return {
          ...f,
          itinerary: [...f.itinerary, item]
        };
      }
      return f;
    }));
  };

  const handleTogglePackingItem = (fundId: string, index: number) => {
    setFunds(prev => prev.map(f => {
      if (f.id === fundId) {
        const updatedList = f.packingList.map((pi, idx) => {
          if (idx === index) {
            return { ...pi, packed: !pi.packed };
          }
          return pi;
        });
        return {
          ...f,
          packingList: updatedList
        };
      }
      return f;
    }));
  };

  const handleAddPackingItem = (fundId: string, item: string, assignedId?: string) => {
    setFunds(prev => prev.map(f => {
      if (f.id === fundId) {
        return {
          ...f,
          packingList: [...f.packingList, { item, packed: false, assignedId }]
        };
      }
      return f;
    }));
  };

  // Elder Invite magic links simulation
  const handleCreateElderAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elderName || !elderCity) return;

    const newElderId = `elder_${Date.now()}`;
    const newElder: FamilyMember = {
      id: newElderId,
      name: elderName,
      avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&h=150&q=80',
      city: elderCity,
      timezone: 'Europe/Rome', // Defaults to grandparents location timezone
      typicalSchedule: { startHour: 8, endHour: 20 },
      birthday: '12-25',
      relation: elderRelation,
      quietMode: false,
      languages: ['English']
    };

    setMembers([...members, newElder]);
    setShowInviteModal(false);
    setElderName('');
    setElderCity('');
    alert(`👵 Elder profile for ${elderName} created successfully via Magic Link bypass! They are now visible inside your Kin map dashboard.`);
  };

  const copyMagicLink = () => {
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // Dynamic notifications (Nudges based on static dates relative to Mock May 23, 2026)
  const notifications = [
    {
      id: 'n1',
      title: "🎂 Birthday Coming Up soon!",
      description: "It's Nonna Maria's birthday on May 28 (in 5 days!). Start a family voice chain check-in or send a physically printed postcard as a souvenir?",
      action: 'Start check-in',
      tab: 'post' as const
    },
    {
      id: 'n2',
      title: "📞 FlightWatch Fare Alert!",
      description: "Flight fares for Brother & Sister Reunion (SF) slipped below €900 threshold. Watchdog reports current quotes are stable.",
      action: 'Check Fund Jars',
      tab: 'jar' as const
    },
    {
      id: 'n3',
      title: "🍳 Shared Recipe Annotation note",
      description: "Cousin Laura added an annotation note on Nonna's Tiramisu: Recommended ingredients experiments.",
      action: 'View Cookbook',
      tab: 'cook' as const
    }
  ];

  return (
    <div className="min-h-screen bg-natural-bg font-sans text-natural-text leading-normal antialiased pb-12" id="app-root-pane">
      {/* Top Main Navigation Header Banner */}
      <header className="bg-natural-light border-b border-natural-border sticky top-0 z-30 shadow-2xs" id="central-navbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3" id="brand-logo-panel">
            <span className="h-9 w-9 bg-sage text-white rounded-lg rotate-12 flex items-center justify-center font-bold text-base shadow-sm">
              K
            </span>
            <div>
              <h1 className="text-xl font-semibold serif tracking-tight flex items-center gap-1.5 leading-none mt-1">
                Kin
                <span className="text-[9px] font-bold text-sage bg-white/60 border border-natural-border/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Family</span>
              </h1>
              <p className="text-[10px] text-natural-muted font-medium mt-0.5">The Private Family Sanctuary</p>
            </div>
          </div>

          {/* Center Interactive: Person Selector for preview convenience */}
          <div className="bg-[#EAE2D9]/40 p-1.5 rounded-xl border border-natural-border flex items-center gap-2" id="persona-selector-deck">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider pl-2 block hidden md:inline-block">Viewing as:</span>
            <select
              value={userState.activeMemberId}
              onChange={(e) => setUserState(prev => ({ ...prev, activeMemberId: e.target.value }))}
              className="text-xs bg-white border border-natural-border font-bold text-[#2C2C2C] px-3 py-1.5 rounded-lg outline-sage shadow-3xs cursor-pointer"
            >
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.city} - {member.relation})
                </option>
              ))}
            </select>
          </div>

          {/* Right Header Controls panel */}
          <div className="flex items-center gap-3" id="header-right-controls">
            {/* Invite button */}
            <button
               onClick={() => setShowInviteModal(true)}
               className="flex items-center gap-1 text-natural-text bg-white border border-natural-border py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-natural-light cursor-pointer transition-colors"
               title="Add technology-shy elders"
            >
              <UserPlus className="w-4 h-4 text-sage" />
              <span className="hidden sm:inline">Elder Link</span>
            </button>

            {/* Notifications panel toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white hover:bg-natural-light border border-natural-border rounded-xl text-natural-muted focus:outline-none relative cursor-pointer"
              >
                <span className="absolute -top-1 -right-1 bg-terracotta text-white font-bold text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  3
                </span>
                <Bell className="w-4 h-4" />
              </button>

              {/* Real Notifications box drop-down */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 bg-white rounded-2xl w-80 shadow-xl border border-natural-border overflow-hidden z-40 text-left animate-fade-in" id="notif-dropdown">
                  <div className="bg-sage p-4 text-white flex justify-between items-center">
                    <h4 className="font-semibold text-xs tracking-wider uppercase">Family Nudges & Alerts</h4>
                    <span className="text-[9px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-sm">2026 Sandbox</span>
                  </div>
                  <div className="divide-y divide-natural-border max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 space-y-2 hover:bg-natural-light/40">
                        <p className="text-xs font-bold text-natural-text">{n.title}</p>
                        <p className="text-[11px] text-natural-muted leading-relaxed">{n.description}</p>
                        <button
                          onClick={() => { setActiveTab(n.tab); setShowNotifications(false); }}
                          className="text-[10px] text-terracotta font-bold hover:underline"
                        >
                          {n.action} →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Premium level badge */}
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border ${
                userState.tier === 'heirloom' 
                ? 'bg-rose-50 border-rose-200 text-[#D97757]' 
                : userState.tier === 'family' 
                  ? 'bg-sage/10 text-sage border-sage/20' 
                  : 'bg-natural-light text-natural-muted border-natural-border'
              }`}
            >
              👑 {userState.tier}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 select-none" id="main-content-layout">
        
        {/* Dynamic Sidebar Buttons tab strip */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#FAF8F5] border border-natural-border rounded-2xl mb-6 max-w-4xl mx-auto justify-center shadow-3xs" id="hub-navigation-links">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'map' ? 'bg-sage text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <Map className={`w-4 h-4 ${activeTab === 'map' ? 'text-white' : 'text-sage'}`} />
            World Board ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'moments' ? 'bg-terracotta text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'moments' ? 'text-white' : 'text-terracotta'}`} />
            Memory Shelf
          </button>
          <button
            onClick={() => setActiveTab('cook')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'cook' ? 'bg-gold text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <ChefHat className={`w-4 h-4 ${activeTab === 'cook' ? 'text-white' : 'text-gold'}`} />
            Recipe Vault
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'post' ? 'bg-[#3B82F6] text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <Mail className={`w-4 h-4 ${activeTab === 'post' ? 'text-white' : 'text-[#3B82F6]'}`} />
            Slow Postbox
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'voice' ? 'bg-[#EC4899] text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${activeTab === 'voice' ? 'text-white' : 'text-[#EC4899]'}`} />
            Voice Tape Chains
          </button>
          <button
            onClick={() => setActiveTab('jar')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'jar' ? 'bg-[#14B8A6] text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <PiggyBank className={`w-4 h-4 ${activeTab === 'jar' ? 'text-white' : 'text-[#14B8A6]'}`} />
            Visit Jars
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
              activeTab === 'plan' ? 'bg-[#8B5CF6] text-white shadow-sm scale-102' : 'text-natural-muted hover:text-natural-text hover:bg-white shadow-3xs hover:shadow-2xs'
            }`}
          >
            <CreditCard className={`w-4 h-4 ${activeTab === 'plan' ? 'text-white' : 'text-[#8B5CF6]'}`} />
            Pricing Tiers
          </button>
        </div>

        {/* WORKSPACE SWITCHER */}
        <div className="w-full bg-transparent min-h-[500px]" id="workspace-viewport">
          
          {activeTab === 'map' && (
            <FamilyMap 
              members={members} 
              currentTimeStr={currentTimeStr} 
              activeMemberId={userState.activeMemberId} 
            />
          )}

          {activeTab === 'moments' && (
            <MemoryShelf 
              memories={memories} 
              members={members} 
              recipes={recipes}
              activeMemberId={userState.activeMemberId}
              onAddMemory={handleAddMemory}
            />
          )}

          {activeTab === 'cook' && (
            <RecipeVault 
              recipes={recipes} 
              members={members} 
              activeMemberId={userState.activeMemberId}
              onAddRecipe={handleAddRecipe}
              onAddAnnotation={handleAddAnnotation}
            />
          )}

          {activeTab === 'post' && (
            <SlowPost 
              postcards={postcards} 
              members={members} 
              activeMemberId={userState.activeMemberId}
              userState={userState}
              onSendPostcard={handleSendPostcard}
              onAddCredits={handleAddCredits}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceChainComponent 
              chains={chains} 
              members={members} 
              activeMemberId={userState.activeMemberId}
              onAddChain={handleAddChain}
              onAddChainReply={handleAddChainReply}
            />
          )}

          {activeTab === 'jar' && (
            <VisitFundComponent 
              funds={funds} 
              members={members} 
              activeMemberId={userState.activeMemberId}
              onContribute={handleContribute}
              onAddFund={handleAddFund}
              onAddItineraryItem={handleAddItineraryItem}
              onTogglePackingItem={handleTogglePackingItem}
              onAddPackingItem={handleAddPackingItem}
            />
          )}

          {activeTab === 'plan' && (
            <PricingDashboard 
              userState={userState}
              onUpgradeTier={(newTier) => setUserState(prev => ({ ...prev, tier: newTier }))}
            />
          )}
        </div>
      </main>

      {/* ELDER INVITATION MAGIC LINK MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="elder-invitation-dialog">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-xl animate-scale-up space-y-5 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><Link2 className="w-5 h-5 text-indigo-600" /> Elder Magic invitation</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Want to bring a grandparent or older relative online who isn't familiar with regular phone layouts or app stores? Send them a <strong>magic invitation link</strong>. Tapping it opens a custom single-click profile page where they simply set a name, avatar, and they're in immediately.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Simulate magic join:</span>
                
                <form onSubmit={handleCreateElderAccount} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Grandparent / Elder Name</label>
                    <input
                      type="text"
                      required
                      value={elderName}
                      onChange={(e) => setElderName(e.target.value)}
                      placeholder="e.g. Grandfather Nonno Silvio"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Current City</label>
                      <input
                        type="text"
                        required
                        value={elderCity}
                        onChange={(e) => setElderCity(e.target.value)}
                        placeholder="e.g. Rome"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Relation</label>
                      <select
                        value={elderRelation}
                        onChange={(e) => setElderRelation(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white"
                      >
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Great Uncle">Great Uncle</option>
                        <option value="Family Elder">Family Elder</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all"
                  >
                    Simulate Elder Tapping Invite Link
                  </button>
                </form>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={copyMagicLink}
                  className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  {inviteCopied ? 'Link Copied!' : 'Copy Magic Link URL'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Elegantly styled sandbox-safe Toast Notification overlay */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 max-w-sm bg-[#2C2C2C] text-white border border-[#EAE2D9]/20 px-4 py-3.5 rounded-2xl shadow-xl z-50 flex items-start gap-3 animate-fade-in" 
          style={{ animation: 'fadeIn 0.25s ease-out' }}
          id="toast-notification-banner"
        >
          <span className="text-base select-none">✨</span>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-gold tracking-widest mb-0.5">Notification</p>
            <p className="text-[11px] font-medium leading-relaxed opacity-95">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-white/60 hover:text-white shrink-0 text-xs font-bold font-sans cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
