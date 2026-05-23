import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { isGreenDotActive, getLocalWeather, getUpcomingHolidays, getTimezoneOffsetHours } from '../data';
import { MapPin, Clock, Sun, CloudSun, CloudRain, Moon, Sparkles, AlertCircle, Compass, Calendar, ChevronRight, User } from 'lucide-react';

interface FamilyMapProps {
  members: FamilyMember[];
  currentTimeStr: string;
  activeMemberId: string;
}

export default function FamilyMap({ members, currentTimeStr, activeMemberId }: FamilyMapProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(members[0]?.id || null);
  const [showOverlap, setShowOverlap] = useState(false);

  // Time-of-day offset calculation relative to UTC
  const utcDate = new Date(currentTimeStr);

  const selectedMember = members.find(m => m.id === selectedPinId);
  const activeMember = members.find(m => m.id === activeMemberId);

  // Overlap Finder logic: Calculate "Golden Hour" windows
  // Find which of the 24 hours (in UTC) yields peak availability across ALL family members
  const calculateGoldenHours = () => {
    const hoursAvailability = Array.from({ length: 24 }, (_, utcHour) => {
      let count = 0;
      const availableList: string[] = [];
      const asleepList: string[] = [];

      members.forEach(member => {
        const offset = getTimezoneOffsetHours(member.timezone);
        const localHour = (utcHour + offset + 24) % 24;
        const isAwake = !member.quietMode && localHour >= member.typicalSchedule.startHour && localHour < member.typicalSchedule.endHour;
        if (isAwake) {
          count++;
          availableList.push(member.name);
        } else {
          asleepList.push(member.name);
        }
      });

      return { utcHour, count, availableList, asleepList };
    });

    // Sort by most available members, then closest to midday
    return hoursAvailability
      .map(item => {
        // Find local hour for the active viewing member
        const activeOffset = activeMember ? getTimezoneOffsetHours(activeMember.timezone) : 0;
        const localViewingHour = (item.utcHour + activeOffset + 24) % 24;
        return {
          ...item,
          localViewingHour,
          rating: item.count
        };
      })
      .sort((a, b) => b.rating - a.rating || (12 - Math.abs(12 - a.localViewingHour)) - (12 - Math.abs(12 - b.localViewingHour)));
  };

  const goldenHours = calculateGoldenHours();
  const topGoldenHour = goldenHours[0];

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" id="icon-sun" />;
      case 'CloudSun': return <CloudSun className="w-5 h-5 text-gray-400" id="icon-cloud-sun" />;
      case 'CloudRain': return <CloudRain className="w-5 h-5 text-blue-400 animate-bounce" id="icon-cloud-rain" />;
      default: return <Compass className="w-5 h-5 text-teal-500" id="icon-weather-default" />;
    }
  };

  // Coordinates for placing pins on a responsive conceptual "World Board"
  // Rome: European, Barcelona: European, Boston: East US, Tokyo: Far East
  const getCoordinates = (city: string) => {
    switch (city) {
      case 'Boston': return { top: '38%', left: '20%' };
      case 'Barcelona': return { top: '44%', left: '46%' };
      case 'Rome': return { top: '43%', left: '53%' };
      case 'Tokyo': return { top: '42%', left: '84%' };
      default: return { top: '50%', left: '50%' };
    }
  };

  return (
    <div className="space-y-6" id="family-map-container">
      {/* Upper Panel: Status Board & Golden Hour Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-natural-light p-5 rounded-2xl shadow-2xs border border-natural-border" id="map-header-panel">
        <div>
          <h2 className="text-2xl font-semibold serif text-natural-text tracking-tight" id="map-title">The World Board</h2>
          <p className="text-xs text-natural-muted" id="map-subtitle">See everyone at a glance. City-level only, respecting individual privacy and natural schedules.</p>
        </div>
        <button
          onClick={() => setShowOverlap(!showOverlap)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-2xs cursor-pointer ${
            showOverlap 
            ? 'bg-terracotta text-white hover:bg-terracotta/90' 
            : 'bg-sage text-white hover:bg-sage/90'
          }`}
          id="overlap-finder-btn"
        >
          <Sparkles className="w-4 h-4" />
          {showOverlap ? 'Back to Board' : 'Find Golden Hour'}
        </button>
      </div>

      {showOverlap ? (
        /* Overlap Finder Panel */
        <div className="bg-natural-light/40 p-6 rounded-2xl border border-natural-border" id="overlap-panel">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="bg-sage/10 text-sage text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-sage/20" id="overlap-badge">Golden Hour Engine</span>
              <h3 className="text-3xl font-bold text-natural-text serif" id="overlap-title">When can we all talk?</h3>
              <p className="text-natural-muted text-sm max-w-lg mx-auto">
                Kin scans global timezone offsets and schedule limits to pinpoint hours where we can chat without waking anyone up.
              </p>
            </div>

            {/* Best Overlap Result Card */}
            {topGoldenHour && (
              <div className="bg-white p-6 rounded-xl border-l-4 border-sage shadow-2xs space-y-4" id="best-overlap-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-sage tracking-wider">Perfect Shared window</h4>
                    <p className="text-lg font-bold text-natural-text mt-1">
                      Best Time: {topGoldenHour.count === members.length ? 'Golden Alignment! (100% Awake)' : `${Math.round((topGoldenHour.count / members.length) * 100)}% Cross-awake Hour`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-natural-muted">Your Local Time</span>
                    <p className="text-base font-bold text-sage">
                      {((topGoldenHour.localViewingHour % 12) || 12)}:00 {topGoldenHour.localViewingHour >= 12 ? 'PM' : 'AM'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-natural-border">
                  <div>
                    <span className="text-xs font-semibold text-natural-muted block mb-1">🌤️ Awake / Contactable ({topGoldenHour.availableList.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {topGoldenHour.availableList.map((name, i) => (
                        <span key={i} className="bg-sage/10 text-sage text-xs px-2.5 py-1 rounded-md font-medium">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-natural-muted block mb-1">💤 Resting / Out of Range ({topGoldenHour.asleepList.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {topGoldenHour.asleepList.map((name, i) => (
                        <span key={i} className="bg-[#EAE2D9] text-[#2C2C2C] text-xs px-2.5 py-1 rounded-md">{name}</span>
                      ))}
                      {topGoldenHour.asleepList.length === 0 && <span className="text-xs text-natural-muted italic">No one resting!</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline comparison */}
            <div className="bg-white p-5 rounded-xl border border-natural-border space-y-5" id="timeline-comparison">
              <h4 className="text-sm font-semibold text-natural-text">24-Hour Alignment Map (UTC based)</h4>
              <div className="space-y-4 overflow-x-auto pb-2">
                {members.map(member => {
                  const offset = getTimezoneOffsetHours(member.timezone);
                  return (
                    <div key={member.id} className="min-w-[600px] flex items-center gap-4">
                      <div className="w-28 flex items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover border border-natural-border" />
                        <span className="text-xs font-bold text-natural-text truncate">{member.name}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-24 gap-0.5" id={`timeline-grid-${member.id}`}>
                        {Array.from({ length: 24 }).map((_, h) => {
                          const localHr = (h + offset + 24) % 24;
                          const isAwake = !member.quietMode && localHr >= member.typicalSchedule.startHour && localHr <= member.typicalSchedule.endHour;
                          const isTarget = topGoldenHour && topGoldenHour.utcHour === h;
                          return (
                            <div
                              key={h}
                              className={`h-6 flex flex-col items-center justify-center text-[9px] font-mono transition-all duration-200 border-r border-natural-border/30 first:rounded-l last:rounded-r ${
                                isTarget 
                                  ? 'ring-2 ring-terracotta z-10 bg-terracotta/10 text-terracotta border-terracotta/30 font-bold'
                                  : isAwake 
                                    ? 'bg-sage/15 text-sage font-medium' 
                                    : 'bg-natural-light text-natural-muted/65 opacity-60'
                              }`}
                              title={`${member.name}: ${localHr}:00 (${isAwake ? 'Awake' : 'Resting'})`}
                            >
                              {localHr}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-natural-muted text-center leading-relaxed">Numbers inside cells indicate corresponding local hours. Soft sage blocks show available waking schedules. The highlighted terracotta selection is the optimized unified Golden Hour window.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Map & Pin Board View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="map-active-grid">
          {/* Main Visual Map (Columns 1 & 2) */}
          <div className="lg:col-span-2 bg-gradient-to-tr from-[#E0F2FE] via-[#FEF3C7] to-[#CCFBF1] rounded-3xl h-[450px] relative overflow-hidden border-2 border-natural-border shadow-inner" id="map-board-canvas">
            
            {/* Soft decorative cloud shapes to make it super fun and cute */}
            <div className="absolute top-10 left-12 h-8 w-24 bg-white/70 rounded-full blur-xs animate-pulse opacity-80 pointer-events-none"></div>
            <div className="absolute bottom-20 right-16 h-10 w-32 bg-white/80 rounded-full blur-xs opacity-75 pointer-events-none"></div>
            
            {/* World Board Outline Overlay */}
            <div className="absolute inset-0 opacity-25 pointer-events-none" id="map-world-contours">
              <svg className="w-full h-full" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M150,150 Q250,50 350,150 T550,150" stroke="#475569" strokeWidth="2" strokeDasharray="5 5"/>
                <path d="M50,300 Q150,200 250,300 T450,300" stroke="#475569" strokeWidth="2" strokeDasharray="5 5"/>
                <path d="M600,200 Q700,100 800,200 T950,200" stroke="#475569" strokeWidth="2" strokeDasharray="5 5"/>
                <circle cx="200" cy="180" r="100" stroke="#475569" strokeWidth="1" strokeDasharray="2 2"/>
                <circle cx="500" cy="220" r="120" stroke="#475569" strokeWidth="1" strokeDasharray="2 2"/>
                <circle cx="800" cy="200" r="90" stroke="#475569" strokeWidth="1" strokeDasharray="2 2"/>
              </svg>
            </div>

            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-natural-border text-[11px] font-bold text-[#2C2C2C] flex items-center gap-4 shadow-md z-10">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-[#14B8A6] rounded-full animate-ping"></span> 🟢 Awake & Chatty</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-[#F59E0B] rounded-full"></span> 🟡 Rest Zone</span>
            </div>

            {/* Pins on Map */}
            {members.map(member => {
              const { active, localTimeFormatted } = isGreenDotActive(currentTimeStr, member);
              const coords = getCoordinates(member.city);
              const isSelected = selectedPinId === member.id;
              
              // Dynamic flag symbols
              const getFlag = (city: string) => {
                if (city === 'Boston') return '🇺🇸';
                if (city === 'Barcelona') return '🇪🇸';
                if (city === 'Rome') return '🇮🇹';
                if (city === 'Tokyo') return '🇯🇵';
                return '📍';
              };

              return (
                <div
                  key={member.id}
                  className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: coords.top, left: coords.left }}
                >
                  <button
                    onClick={() => setSelectedPinId(member.id)}
                    className="group relative flex flex-col items-center focus:outline-hidden cursor-pointer"
                    id={`pin-btn-${member.id}`}
                  >
                    {/* Pulsing ring around person's avatar if awake */}
                    {active && (
                      <span className="absolute -inset-2 bg-[#14B8A6]/30 rounded-full animate-ping pointer-events-none"></span>
                    )}
                    {member.quietMode && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-white p-1 rounded-full border-2 border-white z-20 shadow-md">
                        <Moon className="w-3 h-3 fill-white text-white" />
                      </span>
                    )}

                    {/* Avatar Container with color-coded halo glow effect */}
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-300 transform active:scale-95 ${
                      isSelected 
                        ? active 
                          ? 'border-[#14B8A6] ring-4 ring-[#14B8A6]/20 scale-110 z-30 shadow-lg' 
                          : 'border-[#F59E0B] ring-4 ring-[#F59E0B]/20 scale-110 z-30 shadow-lg'
                        : active 
                          ? 'border-white hover:border-[#14B8A6]/60 group-hover:scale-105 shadow-md' 
                          : 'border-white hover:border-[#F59E0B]/60 group-hover:scale-105 shadow-md'
                    }`}>
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Simple Tooltip on Map with fun matching badges */}
                    <div className={`mt-2 border text-white text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-md flex items-center gap-1.5 transition-all duration-300 ${
                      isSelected 
                        ? active 
                          ? 'opacity-100 z-30 scale-100 bg-[#14B8A6] border-emerald-400' 
                          : 'opacity-100 z-30 scale-100 bg-[#F59E0B] border-amber-400 text-white'
                        : 'opacity-90 group-hover:opacity-100 bg-[#2C2C2C] border-transparent'
                    }`}>
                      <span>{getFlag(member.city)}</span>
                      <span className="font-bold">{member.name}</span>
                      <span className="opacity-90 font-mono text-[9px]">• {localTimeFormatted}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Local Information Context Panel (Column 3) */}
          <div className="bg-natural-light p-6 rounded-3xl border border-natural-border" id="local-context-view">
            {selectedMember ? (
              <div className="space-y-6 animate-fade-in" id="context-info-box">
                {/* Header User Row */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-16 h-16 rounded-full object-cover border-2 border-natural-border shadow-xs" />
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      isGreenDotActive(currentTimeStr, selectedMember).active ? 'bg-sage' : 'bg-gold'
                    }`}></span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sage bg-sage/10 border border-sage/20 px-2.5 py-0.5 rounded-full">{selectedMember.relation}</span>
                    <h3 className="text-lg font-semibold serif text-[#2C2C2C] mt-1">{selectedMember.name}</h3>
                    <p className="text-xs text-natural-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-natural-muted" /> {selectedMember.city}</p>
                  </div>
                </div>

                <hr className="border-natural-border" />

                {/* Local Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-natural-border flex items-center gap-3">
                    <Clock className="w-5 h-5 text-terracotta shrink-0" />
                    <div>
                      <span className="text-[10px] text-natural-muted block uppercase font-bold">Local Time</span>
                      <span className="text-xs font-bold text-natural-text">
                        {isGreenDotActive(currentTimeStr, selectedMember).localTimeFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-natural-border flex items-center gap-3">
                    <div className="shrink-0">{getWeatherIcon(getLocalWeather(selectedMember.city).icon)}</div>
                    <div>
                      <span className="text-[10px] text-natural-muted block uppercase font-bold">Weather</span>
                      <span className="text-xs font-bold text-natural-text">
                        {getLocalWeather(selectedMember.city).temp}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-natural-border space-y-2">
                  <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block">Local Context & Weather Summary</span>
                  <p className="text-xs text-[#2C2C2C] leading-relaxed italic">
                    "{getLocalWeather(selectedMember.city).summary}."
                  </p>
                </div>

                {/* Upcoming Holidays / Events */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sage" /> Upcoming local context</span>
                  {getUpcomingHolidays(selectedMember.city).length > 0 ? (
                    <div className="space-y-2.5">
                      {getUpcomingHolidays(selectedMember.city).map((holiday, idx) => (
                        <div key={idx} className="bg-sage/5 p-3 rounded-xl border border-sage/15 flex items-start gap-2.5 text-xs">
                          <span className="bg-sage/10 text-sage font-bold px-2 py-1 rounded-md text-[10px] shrink-0 font-mono">{holiday.date}</span>
                          <div>
                            <p className="font-semibold text-[#2C2C2C]">{holiday.name}</p>
                            <p className="text-[11px] text-[#2C2C2C]/70 mt-0.5">{holiday.info}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-natural-border text-center text-xs text-natural-muted">
                      No key national holidays coming up next month.
                    </div>
                  )}
                </div>

                {/* Availability Call Indicator */}
                <div className="p-4 rounded-xl border text-xs leading-relaxed space-y-2.5 transition-all duration-300 bg-white border-natural-border">
                  <div className="flex gap-2">
                    <span className="mt-0.5 select-none">
                      {isGreenDotActive(currentTimeStr, selectedMember).active ? '📞' : '🌙'}
                    </span>
                    <div>
                      <p className="font-semibold text-natural-text">
                        {isGreenDotActive(currentTimeStr, selectedMember).active 
                          ? 'Perfect hour to reach out!' 
                          : 'Quiet Hours / Asleep'}
                      </p>
                      <p className="text-[11px] text-natural-muted mt-0.5">
                        {isGreenDotActive(currentTimeStr, selectedMember).active 
                          ? `Currently fits inside schedule availability limits.` 
                          : `Schedules limit contact here. Better send an async Voice Chain or slow Postcard instead!`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3" id="no-pin-selected">
                <Compass className="w-12 h-12 text-natural-muted animate-spin-slow" />
                <p className="text-natural-muted font-medium text-sm">Select a family member pin on the world map to retrieve their dynamic local context.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
