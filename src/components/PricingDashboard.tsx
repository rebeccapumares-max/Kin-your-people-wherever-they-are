import React from 'react';
import { UserState } from '../types';
import { Check, ShieldCheck, Gem, User, HelpCircle, Star } from 'lucide-react';

interface PricingDashboardProps {
  userState: UserState;
  onUpgradeTier: (tier: 'free' | 'family' | 'heirloom') => void;
}

export default function PricingDashboard({ userState, onUpgradeTier }: PricingDashboardProps) {
  const tiers = [
    {
      id: 'free' as const,
      name: 'Free Starter',
      price: '€0',
      period: 'forever',
      badge: 'Starter Sanctuary',
      description: 'Keep connected with outer bubbles, timezone grids, and warm voice chains.',
      features: [
        'Up to 3 family members slots',
        'Interactive Map + Green Dots system',
        '20 private scrapbook memories limit',
        '5 attributed recipes limit',
        'Asynchronous Voice Chains'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'bg-natural-light text-natural-muted border border-natural-border cursor-not-allowed text-xs py-2.5 rounded-xl font-bold w-full'
    },
    {
      id: 'family' as const,
      name: 'Kin Family',
      price: '€4.99',
      period: 'month',
      badge: 'Most Popular',
      description: 'Perfect for extended setups, saving for trips, and locking tender capsules.',
      features: [
        'Up to 15 family members slots',
        'Unlimited scrapbook memories & notes',
        'Unlimited attributed recipe cards',
        'Collaborative Visit Funds & packing lists',
        'Time-locked Kin Capsule vaults',
        'Annual Keepsake Book export layout (PDF)'
      ],
      buttonText: 'Upgrade to Family',
      buttonClass: 'bg-gold hover:bg-gold/95 text-white text-xs py-2.5 rounded-xl font-bold w-full shadow-2xs cursor-pointer text-center block uppercase tracking-wider transition-colors'
    },
    {
      id: 'heirloom' as const,
      name: 'Kin Heirloom',
      price: '€9.99',
      period: 'month',
      badge: 'Generational Shield',
      description: 'The ultimate physical and digital legacy. Printed books loaded directly on your shelf.',
      features: [
        'Unlimited family members slots',
        '1 Free printed hardcover Album/year (€24.99 retail value!)',
        '2 Free physical Slow Postcards every month',
        'Priority printing press placement',
        'Ancestors Family Tree Tagging nodes'
      ],
      buttonText: 'Upgrade to Heirloom',
      buttonClass: 'bg-sage hover:bg-sage/95 text-white text-xs py-2.5 rounded-xl font-bold w-full shadow-2xs cursor-pointer text-center block uppercase tracking-wider transition-colors'
    }
  ];

  return (
    <div className="space-y-6" id="pricing-dashboard-container">
      {/* Intro details */}
      <div className="text-center space-y-2">
        <span className="bg-[#FAF8F5] text-natural-muted border border-natural-border text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Kin Pricing</span>
        <h2 className="text-3xl font-semibold serif text-[#2C2C2C] tracking-tight">Simple, honest pricing. Family-sized.</h2>
        <p className="text-natural-muted text-xs max-w-lg mx-auto leading-relaxed">
          No ad engines, no tracking scripts, no public walls. Just private sanctuaries for relationships that matter. Choose a model that supports actual craftsmanship.
        </p>
      </div>

      {/* Grid of tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" id="pricing-tiers-cards">
        {tiers.map(plan => {
          const isActive = userState.tier === plan.id;
          return (
            <div
              key={plan.id}
               className={`bg-white p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between space-y-6 ${
                isActive 
                  ? 'border-sage shadow-xs ring-4 ring-sage/10' 
                  : plan.id === 'family' 
                    ? 'border-gold/60 shadow-xs' 
                    : 'border-natural-border'
              }`}
              id={`pricing-card-${plan.id}`}
            >
              {/* Highlight badge overlay */}
              {plan.id === 'family' && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gold text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1 border border-gold/20 shadow-xs">
                  <Star className="w-3" /> Most Popular Tier
                </span>
              )}

              {/* Top info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted block">{plan.badge}</span>
                    <h3 className="text-lg font-bold serif text-[#2C2C2C] mt-1">{plan.name}</h3>
                  </div>
                  {isActive && (
                    <span className="bg-sage/10 text-sage border border-sage/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono">
                      Selected Plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-4xl font-bold serif text-[#2C2C2C]">{plan.price}</span>
                  <span className="text-xs text-natural-muted font-medium">/{plan.period}</span>
                </div>

                <p className="text-xs text-natural-muted leading-relaxed font-sans">{plan.description}</p>
                <hr className="border-natural-border" />

                {/* Features list */}
                <ul className="space-y-2.5 text-left">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-natural-text">
                      <Check className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upgrade triggers */}
              <div>
                {isActive ? (
                  <button className={plan.buttonClass} disabled>
                    Selected Plan Active
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpgradeTier(plan.id);
                      alert(`🎉 Successfully upgraded status! Welcome to the Kin ${plan.name} simulation level.`);
                    }}
                    className={plan.buttonClass}
                  >
                    Activate {plan.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional rates footnote */}
      <div className="p-4 bg-slate-50 rounded-2xl border text-center max-w-xl mx-auto space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Refill postage fees & Printed keepsakes</span>
        <p className="text-xs text-slate-500">
          Slow postage: <strong>€2.50 EU / €3.50 global</strong> per card envelope. Extra printed Linen Hardcover Books: <strong>€24.99 per album</strong> flat. No contracts, cancel online instantly.
        </p>
      </div>
    </div>
  );
}
