import React, { useState } from 'react';
import { Recipe, FamilyMember } from '../types';
import { ChefHat, BookOpen, Clock, Users, Play, Pause, Plus, Heart, HelpCircle, CornerDownRight, Volume2, MessageSquare, PlusCircle } from 'lucide-react';

interface RecipeVaultProps {
  recipes: Recipe[];
  members: FamilyMember[];
  activeMemberId: string;
  onAddRecipe: (recipe: Recipe) => void;
  onAddAnnotation: (recipeId: string, annotationText: string) => void;
}

export default function RecipeVault({ recipes, members, activeMemberId, onAddRecipe, onAddAnnotation }: RecipeVaultProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(recipes[0]?.id || null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState(0);

  // New Recipe Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newTaughtById, setNewTaughtById] = useState(members[0]?.id || '');
  const [newPassedDownFrom, setNewPassedDownFrom] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [newTags, setNewTags] = useState('');

  // Voice Recording simulation state
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);

  // New Annotation state
  const [annotationInput, setAnnotationInput] = useState('');

  const activeRecipe = recipes.find(r => r.id === selectedRecipeId);
  const activeUser = members.find(m => m.id === activeMemberId);

  // Audio simulation timer
  React.useEffect(() => {
    let interval: any;
    if (isPlayingVoice) {
      interval = setInterval(() => {
        setVoicePlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlayingVoice(false);
            return 0;
          }
          return prev + 2;
        });
      }, 400);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingVoice]);

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !ingredientsText || !instructionsText) return;

    // Split textareas by newlines
    const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(Boolean);
    const instructions = instructionsText.split('\n').map(i => i.trim()).filter(Boolean);

    const recipe: Recipe = {
      id: `r_${Date.now()}`,
      name: newName,
      coverUrl: newCoverUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      taughtById: newTaughtById,
      passedDownFromId: newPassedDownFrom || undefined,
      ingredients,
      instructions,
      tags: newTags ? newTags.split(',').map(t => t.trim()) : ['Family Dinner'],
      voiceUrl: recordedVoiceUrl || undefined,
      annotations: []
    };

    onAddRecipe(recipe);
    setShowAddForm(false);

    // Reset Form
    setNewName('');
    setNewCoverUrl('');
    setIngredientsText('');
    setInstructionsText('');
    setNewTags('');
    setRecordedVoiceUrl(null);
  };

  const submitAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotationInput.trim() || !selectedRecipeId) return;

    onAddAnnotation(selectedRecipeId, annotationInput.trim());
    setAnnotationInput('');
  };

  const getMemberName = (id: string, suffixFallback = '') => {
    const m = members.find(member => member.id === id);
    return m ? m.name : suffixFallback;
  };

  const getMemberAvatar = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80';
  };

  const selectCoverKeyword = (keyword: string) => {
    let url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'tiramisu') url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'ribs') url = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'pasta') url = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80';
    if (keyword === 'cookie') url = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80';
    setNewCoverUrl(url);
  };

  return (
    <div className="space-y-6" id="recipe-vault-container">
      {/* Header and Add Button row */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-natural-border shadow-xs" id="recipe-header">
        <div>
          <h2 className="text-2xl font-semibold serif text-[#2C2C2C] flex items-center gap-2" id="recipe-title">
            <ChefHat className="w-5 h-5 text-terracotta" />
            The Family Cookbook
          </h2>
          <p className="text-xs text-natural-muted mt-0.5 animate-fade-in">Passed down recipes, annotated with generational experiments and voice notes from the kitchen.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-sage text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:bg-sage/95 transition-colors shadow-2xs cursor-pointer"
          id="add-recipe-btn"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Back to Vault' : 'Write Recipe'}
        </button>
      </div>

      {showAddForm ? (
        /* Create Recipe Form Option */
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200" id="create-recipe-form-card">
          <form onSubmit={handleCreateRecipe} className="max-w-3xl mx-auto space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Document a New Recipe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Recipe Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Great-Aunt Lucia's Lemon Gnocchi"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white shadow-xs focus:outline-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Who taught you this recipe?</label>
                  <select
                    value={newTaughtById}
                    onChange={(e) => setNewTaughtById(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white shadow-xs"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Passed down from ancestor? (Optional Legacy Tagging)</label>
                  <input
                    type="text"
                    value={newPassedDownFrom}
                    onChange={(e) => setNewPassedDownFrom(e.target.value)}
                    placeholder="e.g. Great-Grandmother Sofia Rossi (1912-1988)"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Help preserve ancestors' names on the family tree legacy card.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Cover Image Theme Preset</label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => selectCoverKeyword('pasta')} className="bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">Italian Pasta</button>
                    <button type="button" onClick={() => selectCoverKeyword('ribs')} className="bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">BBQ Roast</button>
                    <button type="button" onClick={() => selectCoverKeyword('tiramisu')} className="bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">Dessert Cream</button>
                    <button type="button" onClick={() => selectCoverKeyword('cookie')} className="bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">Cookies / Baking</button>
                  </div>
                  {newCoverUrl && (
                    <div className="mt-2 h-16 w-1/2 rounded-xl overflow-hidden border">
                      <img src={newCoverUrl} alt="Cover preset" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Voice note recorder inside recipe form */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tape kitchen advice (simulated voice recording)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (recordingVoice) {
                        setRecordingVoice(false);
                        setRecordedVoiceUrl('recorded_voice_user_advice');
                      } else {
                        setRecordingVoice(true);
                        setRecordedVoiceUrl(null);
                      }
                    }}
                    className={`w-full py-3 px-4 border rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      recordingVoice 
                      ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse font-bold' 
                      : recordedVoiceUrl 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {recordingVoice ? '🔴 Recording Grandma explain the dish... Click to Save' : recordedVoiceUrl ? '✅ Cooking companion audio recorded!' : '🎤 Record Voice Instruction Memo (companion)'}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Ingredients list (one per line)</label>
                  <textarea
                    required
                    rows={4}
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    placeholder="e.g.&#10;500g Gnocchi dough&#10;Juice of 2 Sicilian Lemons&#10;50g Salted Butter"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 bg-white focus:outline-amber-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Preparation Steps (one per line)</label>
                  <textarea
                    required
                    rows={4}
                    value={instructionsText}
                    onChange={(e) => setInstructionsText(e.target.value)}
                    placeholder="e.g.&#10;Boil heavily salted water.&#10;Melt butter in deep iron pan.&#10;Squeeze lemon juice in during final whisking."
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 bg-white focus:outline-amber-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Assemble Recipe Cards
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Recipe Viewer layout split pane */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="recipe-view-split">
          {/* Left panel: Recipe Cards list */}
          <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-1" id="recipe-cards-sidebar">
            <span className="text-[10px] font-bold tracking-wider text-natural-muted uppercase">Available Family Vault</span>
            {recipes.map(recipe => {
              const isSelected = selectedRecipeId === recipe.id;
              const teacher = members.find(m => m.id === recipe.taughtById);

              return (
                <button
                  key={recipe.id}
                  onClick={() => { setSelectedRecipeId(recipe.id); setIsPlayingVoice(false); setVoicePlaybackProgress(0); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? 'bg-gold/10 border-gold shadow-3xs' 
                      : 'bg-white border-natural-border hover:bg-natural-light/60'
                  }`}
                  id={`recipe-summary-box-${recipe.id}`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative shadow-inner">
                    <img src={recipe.coverUrl} alt={recipe.name} className="w-full h-full object-cover" />
                    {recipe.passedDownFromId && (
                      <span className="absolute top-0.5 left-0.5 bg-rose-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-wide shadow-xs">Legacy</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{recipe.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      {teacher && (
                        <div className="flex items-center gap-1">
                          <img src={teacher.avatar} alt={teacher.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                          <span className="text-[11px] truncate">By {teacher.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right panel: Active Full Recipe Instruction book */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200" id="recipe-detailed-book">
            {activeRecipe ? (
              <div className="space-y-6" id="active-recipe-notebook">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-sans text-slate-900 tracking-tight">{activeRecipe.name}</h3>
                    
                    {/* Legacy family tree tags */}
                    {activeRecipe.passedDownFromId ? (
                      <div className="bg-rose-50 text-rose-800 text-[10px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Passed down from {activeRecipe.passedDownFromId}
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Taught directly by {getMemberName(activeRecipe.taughtById, 'Older Generations')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Recipe Source</span>
                    <img src={getMemberAvatar(activeRecipe.taughtById)} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-amber-300" />
                  </div>
                </div>

                {/* Companion Player - Grandma voice simulation */}
                {activeRecipe.voiceUrl && (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 flex flex-col md:flex-row items-center gap-4 justify-between" id="recipe-voice-player">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                        className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full cursor-pointer shadow-md transition-all shrink-0 animate-bounce-slow"
                      >
                        {isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <div className="text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5"><Volume2 className="w-4 h-4" /> Hands-Free Cooking Companion active</span>
                        <p className="text-slate-600 font-serif text-[11px] leading-tight italic mt-0.5">
                          {isPlayingVoice ? '"Make sure you whisk until the Mascarpone starts holding stiff peaks..."' : 'Listen to Nonna Maria explain the exact step details while cooking'}
                        </p>
                      </div>
                    </div>

                    {/* Simple progress bar mock */}
                    <div className="w-full md:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${voicePlaybackProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Ingredients & Instructions columns */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Ingredients (Column 2/5) */}
                  <div className="md:col-span-2 space-y-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Essential Ingredients</h4>
                    <ul className="space-y-2 text-xs text-slate-700 font-mono">
                      {activeRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold font-sans">·</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preparation steps (Column 3/5) */}
                  <div className="md:col-span-3 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">Kitchen Steps</h4>
                    <ol className="space-y-3 text-xs leading-relaxed text-slate-700 font-sans">
                      {activeRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-2 p-1.5 rounded-lg hover:bg-slate-50">
                          <span className="font-bold text-amber-800 bg-amber-50 h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                          <p className="text-left">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Generational Variants & Shared Edits (Annotations Box) */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4" id="shared-annotations">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-400" /> Annotations & Custom Variants 🍳 ({activeRecipe.annotations.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Branches do not overwrite master recipe</span>
                  </div>

                  {activeRecipe.annotations.length > 0 ? (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {activeRecipe.annotations.map(annotation => (
                        <div key={annotation.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-3 text-xs">
                          <img src={getMemberAvatar(annotation.authorId)} alt="" className="w-6 h-6 rounded-full object-cover border" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-[11px]">{getMemberName(annotation.authorId, 'Another member')}</span>
                              <span className="text-[9px] text-slate-400">{annotation.date}</span>
                            </div>
                            <p className="text-slate-600 italic">"{annotation.text}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No shared variants written yet. Be the first to add your annotations!</p>
                  )}

                  {/* Add Annotation Form */}
                  <form onSubmit={submitAnnotation} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={annotationInput}
                      onChange={(e) => setAnnotationInput(e.target.value)}
                      placeholder={`Add kitchen annotation (e.g. Try almond milk or add cinnamon)...`}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-indigo-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 border border-slate-900 text-white text-xs font-bold px-4 rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Annotate
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center h-full space-y-3">
                <ChefHat className="w-12 h-12 text-slate-300 animate-bounce" />
                <p className="text-slate-600 font-medium text-sm">Select a delicious recipe cards on the left navigation to open inside.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
