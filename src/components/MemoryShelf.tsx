import React, { useState } from 'react';
import { Memory, FamilyMember, Recipe, MomentType } from '../types';
import { Image, Volume2, Milestone, Heart, BookOpen, AlertCircle, Plus, Sparkles, Filter, ChevronRight, ShoppingCart, Calendar } from 'lucide-react';

interface MemoryShelfProps {
  memories: Memory[];
  members: FamilyMember[];
  recipes: Recipe[];
  activeMemberId: string;
  onAddMemory: (memory: Memory) => void;
}

export default function MemoryShelf({ memories, members, recipes, activeMemberId, onAddMemory }: MemoryShelfProps) {
  const [activeTab, setActiveTab] = useState<'drawer' | 'byPerson' | 'anuualBook'>('drawer');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  
  // New memory form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MomentType>('photo');
  const [newContent, setNewContent] = useState('');
  const [newTaggedPerson, setNewTaggedPerson] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [audioRecording, setAudioRecording] = useState(false);
  const [capsuleCheck, setCapsuleCheck] = useState(false);
  const [capsuleDate, setCapsuleDate] = useState('2027-05-23');

  // Book order modal states
  const [bookOrdered, setBookOrdered] = useState(false);

  // Filter memories by tags or keywords
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Same Time Last Year: Date is exactly 1 year ago (Current is 2026-05-23, so target 2025-05-23)
  const sameTimeLastYearMemory = memories.find(m => m.date === '2025-05-23');

  // Auto-populate random high-quality images depending on some keywords to avoid broken image URLs
  const handlePhotoSelectSuggestion = (keyword: string) => {
    let url = 'https://images.unsplash.com/photo-1511180598565-be23b8c728ae?auto=format&fit=crop&w=600&q=80'; // Sunset
    if (keyword === 'food') url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'nature') url = 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'feast') url = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80';
    setNewPhotoUrl(url);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || (!newContent && newType === 'note')) return;

    const memory: Memory = {
      id: `m_${Date.now()}`,
      title: newTitle,
      type: newType,
      date: new Date().toISOString().split('T')[0], // 2026-05-23
      authorId: activeMemberId,
      personId: newTaggedPerson || undefined,
      content: newContent,
      photoUrl: newType === 'photo' ? (newPhotoUrl || 'https://images.unsplash.com/photo-1511180598565-be23b8c728ae?auto=format&fit=crop&w=600&q=80') : undefined,
      audioUrl: newType === 'voice' ? 'simulated_voice_clip' : undefined,
      tags: newTags ? newTags.split(',').map(t => t.trim()) : ['Family'],
      isCapsule: capsuleCheck,
      unlockDate: capsuleCheck ? capsuleDate : undefined
    };

    onAddMemory(memory);
    
    // Reset Form
    setNewTitle('');
    setNewType('photo');
    setNewContent('');
    setNewTaggedPerson('');
    setNewTags('');
    setNewPhotoUrl('');
    setCapsuleCheck(false);
    setShowAddModal(false);
  };

  // Compile all tag options
  const allTags = Array.from(new Set(memories.filter(m => !m.isCapsule).flatMap(m => m.tags)));

  const filteredMemories = memories.filter(m => {
    // Capsules are hidden unless we specify them, or they are unlocked. Today's date is 2026-05-23.
    // Memory Capsule m5 is set for 2027-11-04 so it's currently locked. Show locked state properly.
    if (m.isCapsule && m.unlockDate && m.unlockDate > '2026-05-23') {
      return false; 
    }
    if (selectedTag) {
      return m.tags.includes(selectedTag);
    }
    return true;
  });

  return (
    <div className="space-y-8" id="memory-shelf-container">
      {/* Same Time Last Year Banner - Only visible if memory found */}
      {sameTimeLastYearMemory && (
        <div className="bg-natural-light p-6 rounded-3xl border border-natural-border shadow-2xs flex flex-col md:flex-row items-center gap-6" id="years-ago-banner">
          <div className="md:w-1/3 w-full h-44 rounded-2xl overflow-hidden relative shadow-md">
            <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Same time last year
            </span>
            <img src={sameTimeLastYearMemory.photoUrl} alt={sameTimeLastYearMemory.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="text-xs font-semibold text-gold uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> May 23, 2025
            </div>
            <h3 className="text-2xl font-semibold serif text-natural-text leading-snug">{sameTimeLastYearMemory.title}</h3>
            <p className="text-xs text-natural-muted leading-relaxed italic">
              "{sameTimeLastYearMemory.content}"
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold text-natural-muted">Shared by:</span>
              <span className="text-xs bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full font-medium">Mateo</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Menu & Upload CTA Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-natural-border pb-2.5" id="shelf-tabs-container">
        <div className="flex gap-1.5 p-1 bg-natural-light border border-natural-border rounded-xl">
          <button
            onClick={() => { setActiveTab('drawer'); setSelectedPersonId(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'drawer' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
            }`}
          >
            Memories Drawer
          </button>
          <button
            onClick={() => setActiveTab('byPerson')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'byPerson' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
            }`}
          >
            Family Person Pages
          </button>
          <button
            onClick={() => setActiveTab('anuualBook')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'anuualBook' ? 'bg-white text-[#2C2C2C] border border-natural-border shadow-3xs' : 'text-natural-muted hover:text-natural-text hover:bg-white/40'
            }`}
          >
            Annual Keepsake Book
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-sage text-white px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-sage/95 shadow-2xs cursor-pointer transition-colors"
          id="add-memory-button"
        >
          <Plus className="w-4 h-4" /> Drop a Moment
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* 1. MEMORIES DRAWER (SCRAPBOOK DRAWER) */}
      {activeTab === 'drawer' && (
        <div className="space-y-6" id="drawer-tab-view">
          {/* Tags cloud */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1"><Filter className="w-3.5 h-3.5 text-sage" /> Filter:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                !selectedTag ? 'bg-sage text-white border-sage font-semibold' : 'bg-white text-natural-muted border-natural-border hover:bg-natural-light'
              }`}
            >
              All Moments
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  tag === selectedTag ? 'bg-sage text-white border-sage font-semibold' : 'bg-white text-natural-muted border-natural-border hover:bg-natural-light'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Grid list of memories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="memory-scrapbook-grid">
            {filteredMemories.map(memory => {
              const author = members.find(m => m.id === memory.authorId);
              const tagged = members.find(m => m.id === memory.personId);

              // Fun scrapbook style coloring according to memory type
              let cardBg = 'bg-white border-natural-border hover:border-sage';
              let tapeBadgeColor = 'bg-sage/10 text-sage border-sage/15';
              let dateColor = 'text-natural-muted';
              
              if (memory.type === 'voice') {
                cardBg = 'bg-gradient-to-b from-[#FDF2F8] to-[#FFF5F5] border-[#FBCFE8] hover:border-[#EC4899]';
                tapeBadgeColor = 'bg-[#EC4899]/10 text-[#EC4899] border-[#FCE7F3]';
                dateColor = 'text-[#EC4899]/80';
              } else if (memory.type === 'photo') {
                cardBg = 'bg-gradient-to-b from-[#EFF6FF] to-white border-[#BFDBFE] hover:border-[#3B82F6]';
                tapeBadgeColor = 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#DBEAFE]';
                dateColor = 'text-[#3B82F6]/80';
              } else if (memory.type === 'note') {
                cardBg = 'bg-gradient-to-b from-[#FEFCE8] to-white border-[#FEF08A] hover:border-[#EAB308] border-t-8';
                tapeBadgeColor = 'bg-[#EAB308]/10 text-[#EAB308] border-[#FEF9C3]';
                dateColor = 'text-[#EAB308]/80';
              }

              return (
                <div
                  key={memory.id}
                  className={`rounded-2xl overflow-hidden border transition-all duration-300 transform hover:scale-102 hover:-translate-y-1 shadow-xs hover:shadow-md ${cardBg}`}
                  id={`memory-card-${memory.id}`}
                >
                  {/* Photo content headers */}
                  {memory.type === 'photo' && memory.photoUrl && (
                    <div className="h-44 w-full overflow-hidden relative">
                      <img src={memory.photoUrl} alt={memory.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-115" />
                      <span className="absolute bottom-2.5 right-2.5 bg-[#3B82F6] text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Image className="w-3 h-3" /> Captured Photo
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase font-mono ${dateColor}`}>{memory.date}</span>
                      <div className="flex items-center gap-1.5 text-xs text-natural-muted font-mono">
                        {author && (
                          <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border border-natural-border shadow-3xs">
                            <img src={author.avatar} alt={author.name} className="w-4.5 h-4.5 rounded-full object-cover border border-white" />
                            <span className="font-bold text-[10px] text-[#2C2C2C] truncate">{author.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold text-natural-text serif text-xl leading-snug flex items-center gap-1.5">
                      {memory.type === 'note' && <span className="text-base">📝</span>}
                      {memory.type === 'voice' && <span className="text-base">📻</span>}
                      {memory.title}
                    </h4>
                    <p className="text-[#2C2C2C] text-xs leading-relaxed">{memory.content}</p>

                    {/* Audio tape visualization for voice memory */}
                    {memory.type === 'voice' && (
                      <div className="bg-white/95 p-3 rounded-xl border border-[#FAEDF2] space-y-2 shadow-3xs">
                        <div className="flex items-center justify-between text-[11px] text-[#2C2C2C]/70 font-mono">
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${tapeBadgeColor}`}>
                            <Volume2 className="w-3.5 h-3.5" /> Recording Playing
                          </span>
                          <span className="text-[#EC4899] font-bold">1:28 mins</span>
                        </div>
                        {/* Colorful cassette simulation */}
                        <div className="flex gap-1 h-5 items-center justify-center">
                          {Array.from({ length: 18 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-1.5 bg-[#EC4899] rounded-sm transition-all"
                              style={{
                                height: `${Math.max(20, Math.sin(i * 0.4) * 80 + Math.random() * 20)}%`,
                                animation: 'pulse 0.8s ease-in-out infinite'
                              }}
                            ></span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tag bubbles */}
                    <div className="flex flex-wrap gap-1.5 pt-3.5 border-t border-natural-border/30">
                      {memory.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold text-[#2C2C2C]/80 bg-white px-2.5 py-0.5 rounded-full border border-natural-border shadow-3xs">
                          #{tag}
                        </span>
                      ))}
                      {tagged && (
                        <span className="text-[10px] font-bold text-[#EC4899] bg-[#EC4899]/5 px-2.5 py-0.5 rounded-full border border-[#EC4899]/15 shadow-3xs flex items-center gap-1 animate-pulse">
                          ❤️ Tagged: {tagged.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Locked capsules indicator at bottom */}
          <div className="p-5 bg-natural-light rounded-2xl border border-natural-border max-w-lg mx-auto text-center space-y-2">
            <span className="bg-gold/15 text-gold border border-gold/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Kin capsule locked</span>
            <p className="text-xs text-natural-text">
              There is <strong>1 private memory capsule</strong> locked in the vault, scheduled to open automatically for Cousin Laura's 30th birthday on <strong>Nov 4, 2027</strong>!
            </p>
          </div>
        </div>
      )}

      {/* 2. FAMILY PERSON PAGES */}
      {activeTab === 'byPerson' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="person-pages-active">
          {/* Member Selection Left Column */}
          <div className="space-y-3 lg:col-span-1 border-r border-[#EAE2D9] pr-0 lg:pr-4" id="member-page-selector">
            <span className="text-[10px] font-bold tracking-wider text-natural-muted uppercase">Family Member Timeline</span>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {members.map(member => {
                const isSelected = selectedPersonId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedPersonId(member.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-sage text-white border-sage shadow-2xs' 
                        : 'bg-white text-natural-text border-natural-border hover:bg-natural-light/60'
                    }`}
                  >
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div>
                      <p className="text-xs font-bold leading-tight">{member.name}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{member.relation} · {member.city}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Person Details Shelf Right Column */}
          <div className="lg:col-span-3 bg-natural-light/50 p-6 rounded-3xl border border-natural-border" id="member-shelf-details">
            {selectedPersonId ? (
              (() => {
                const person = members.find(m => m.id === selectedPersonId);
                const personMemories = memories.filter(m => m.authorId === selectedPersonId || m.personId === selectedPersonId);
                const personRecipes = recipes.filter(r => r.taughtById === selectedPersonId);

                if (!person) return null;

                return (
                  <div className="space-y-6">
                    {/* Header profile card */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <img src={person.avatar} alt={person.name} className="w-16 h-16 rounded-full object-cover border-2 border-natural-border shadow-2xs" />
                        <div>
                          <h3 className="text-xl font-bold serif text-[#2C2C2C]">{person.name}'s Family Legacy</h3>
                          <p className="text-xs text-natural-muted">{person.relation} · Based in {person.city} · Speaking {person.languages.join(', ')}</p>
                        </div>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl text-left font-mono text-xs border border-natural-border">
                        <span className="text-natural-muted block uppercase text-[8px] font-bold">Upcoming Birthday</span>
                        <span className="font-semibold text-[#2C2C2C]">{person.birthday}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-natural-border">
                      {/* Person Memories */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-natural-muted">Shared Memories & Moments ({personMemories.length})</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {personMemories.map(m => (
                            <div key={m.id} className="bg-white p-3 rounded-xl border border-natural-border text-xs flex gap-3">
                              {m.photoUrl && <img src={m.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                              <div className="space-y-1">
                                <p className="font-bold text-[#2C2C2C]">{m.title}</p>
                                <p className="text-[11px] text-natural-muted leading-relaxed truncate">{m.content}</p>
                                <span className="text-[9px] font-mono text-natural-muted">{m.date}</span>
                              </div>
                            </div>
                          ))}
                          {personMemories.length === 0 && (
                            <p className="text-xs text-natural-muted italic py-4 text-center">No memories tagged for this member yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Person Contributed Recipes */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-natural-muted">Recipes Attributed To {person.name} ({personRecipes.length})</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {personRecipes.map(r => (
                            <div key={r.id} className="bg-white p-3 rounded-xl border border-natural-border text-xs flex gap-3">
                              <img src={r.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                              <div className="space-y-1">
                                <p className="font-bold text-natural-text">{r.name}</p>
                                <span className="text-[9px] bg-gold/15 text-gold font-bold px-1.5 py-0.5 rounded-sm">Attributed Recipe</span>
                              </div>
                            </div>
                          ))}
                          {personRecipes.length === 0 && (
                            <p className="text-xs text-natural-muted italic py-4 text-center">No recipes attributed to this member yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3">
                <Heart className="w-12 h-12 text-natural-muted animate-pulse" />
                <p className="text-natural-muted font-medium text-sm">Select a family member on the left panel to browse their personalized timeline, receipts, and diaries.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ANNUAL MEMORY KEEPSAKE BOOK */}
      {activeTab === 'anuualBook' && (
        <div className="bg-natural-light p-6 rounded-3xl border border-natural-border" id="annual-book-view">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Visual Book Showcase mockup */}
            <div className="bg-white p-8 rounded-2xl border border-natural-border shadow-xs space-y-6 relative overflow-hidden" id="book-mockup">
              <span className="absolute top-4 right-4 bg-gold/15 text-gold text-[10px] font-bold px-2.5 py-1 rounded-full border border-gold/20">Preloading 2026 Archive</span>
              
              {/* Spine/Flipping simulation book cover */}
              <div className="w-64 h-80 bg-sage rounded-r-2xl shadow-xl flex flex-col justify-between p-6 text-white relative border-l-8 border-[#3D3D2B] mx-auto transform hover:-rotate-1 hover:scale-102 transition-all">
                {/* Gold Foil Frame */}
                <div className="absolute inset-2 border border-gold/30 rounded-r-lg pointer-events-none"></div>
                
                <div className="space-y-2 mt-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gold">The Rossi Family Chronicles</span>
                  <h3 className="serif font-semibold text-2xl text-white tracking-tight pt-2">Kin Annual Keepsake</h3>
                  <div className="w-12 h-0.5 bg-gold mx-auto my-3"></div>
                  <span className="text-xs text-white/80 italic font-serif">Year of 2026</span>
                </div>

                <div className="text-center text-[10px] text-white/75 mb-4 uppercase tracking-wider font-mono">
                  Printed in Rome & Barcelona
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-natural-muted">Preview of Inside Pages</p>
                <div className="flex justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sage"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-light"></span>
                </div>
              </div>
            </div>

            {/* Premium upsell purchase panel */}
            <div className="space-y-6">
              <span className="bg-sage/10 text-sage border border-sage/20 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">Premium Keepsake Opportunity</span>
              <h3 className="text-3xl font-semibold serif text-[#2C2C2C] leading-snug">Your year, beautifully bound.</h3>
              <p className="text-natural-text text-xs leading-relaxed">
                At the end of each year, Kin automatically compiles every single moment, tagged photo, recipe explanation, and slow postcard into a beautiful linen-bound hardback. One purchase secures it in physical print, mailed right to Nonna or your family storage room.
              </p>

              <div className="bg-white p-4.5 rounded-xl border border-natural-border space-y-3 shadow-3xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-natural-border">
                  <div>
                    <span className="text-xs font-bold text-natural-text">Linen Hardcover Book</span>
                    <span className="text-[10px] text-natural-muted block">Mailed worldwide with priority printing.</span>
                  </div>
                  <span className="text-lg font-bold text-sage">€24.99 <span className="text-xs text-natural-muted font-normal">flat</span></span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-natural-muted">
                  <span>Free on Heirloom subscription tier</span>
                  <span className="text-sage font-bold uppercase text-[10px]">Included!</span>
                </div>
              </div>

              {bookOrdered ? (
                <div className="bg-sage/10 p-4 rounded-xl border border-sage/25 text-center space-y-1">
                  <p className="text-sm font-bold text-sage">🎉 Order simulation successful!</p>
                  <p className="text-xs text-natural-text">Your Rossi Family 2026 printed book has been compiled and handed off to our printing press in Milan. Transit starts soon!</p>
                </div>
              ) : (
                <button
                  onClick={() => setBookOrdered(true)}
                  className="w-full bg-sage text-white font-bold uppercase tracking-wider text-xs py-3 px-4 rounded-xl hover:bg-sage/95 shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Order 2026 Hardcover Memory Book
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DROP A MOMENT ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="add-moment-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-xl animate-scale-up space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Add a moment to the scrapbook drawer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Select Media Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('photo')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      newType === 'photo' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    📸 Photographic
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('voice')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      newType === 'voice' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    🔊 Voice Memo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewType('note'); setNewPhotoUrl(''); }}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      newType === 'note' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    📝 Journal Note
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Topic or Moment Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunday hike behind Montserrat, Barcelona"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-emerald-500"
                />
              </div>

              {newType === 'photo' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Select a Photographic Mood</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handlePhotoSelectSuggestion('nature')} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md">Nature Landscape</button>
                    <button type="button" onClick={() => handlePhotoSelectSuggestion('food')} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md">Food Platter</button>
                    <button type="button" onClick={() => handlePhotoSelectSuggestion('feast')} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md">Family Reunion</button>
                  </div>
                  {newPhotoUrl && (
                    <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                      <img src={newPhotoUrl} alt="Selected mood" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {newType === 'voice' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Simulate Microphone Input</label>
                  <button
                    type="button"
                    onClick={() => setAudioRecording(!audioRecording)}
                    className={`w-full py-3 px-4 border rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      audioRecording 
                        ? 'bg-rose-50 border-rose-500 text-rose-700 animate-pulse font-bold' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {audioRecording ? '🔴 Tap to Stop Recording (0:45 seconds cap reached)' : '🎤 Start Recording (Up to 3 mins)'}
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Memory Narrative / Journal Story</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-emerald-500"
                  placeholder="The details we might otherwise forget details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tag Family Member</label>
                  <select
                    value={newTaggedPerson}
                    onChange={(e) => setNewTaggedPerson(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2.5"
                  >
                    <option value="">No Tag</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Category Tags (comma-sep)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. Hiking, Spain, Weekend"
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2.5"
                  />
                </div>
              </div>

              {/* Kin Capsule parameters */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="capsuleCheck"
                  checked={capsuleCheck}
                  onChange={(e) => setCapsuleCheck(e.target.checked)}
                  className="mt-1"
                />
                <div className="text-xs">
                  <label htmlFor="capsuleCheck" className="font-bold text-indigo-900 block cursor-pointer">Lock this as a Kin Capsule</label>
                  <span className="text-[11px] text-slate-500 block">Locked details can only be unlocked/opened on a future graduation or wedding date.</span>
                  {capsuleCheck && (
                    <input
                      type="date"
                      value={capsuleDate}
                      onChange={(e) => setCapsuleDate(e.target.value)}
                      className="mt-2 text-xs border border-indigo-200 rounded-md p-1 bg-white"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  Save Moment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
