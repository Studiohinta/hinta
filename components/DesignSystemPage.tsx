import React from 'react';
import { Features } from './Features';
import { brandAssets } from '../lib/brandAssets';

export const DesignSystemPage = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-screen bg-transparent animate-fadeIn">
            {/* Header */}
            <div className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-black/5 rounded-xl transition-colors dark:hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white">Design System</h1>
                        <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Studio Hinta v1.0</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-primary shadow-sm border border-white/10"></div>
                        <div className="w-6 h-6 rounded-full bg-brand-accent shadow-sm border border-white/10"></div>
                        <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full">
                        Premium Build
                    </span>
                </div>
            </div>

            <main className="pb-20">
                {/* Features Showcase */}
                <Features />

                {/* Color Palette & Typography Sample etc could go here */}
                <div className="max-w-7xl mx-auto px-6 md:px-10 mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter border-l-4 border-brand-accent pl-4">Typography</h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-muted mb-2">Heading 1</p>
                                    <h1 className="text-6xl font-black uppercase tracking-tighter">Nordic Noir</h1>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-muted mb-2">Heading 2</p>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">Cinematic Experience</h2>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-muted mb-2">Body Text</p>
                                    <p className="text-sm font-medium text-brand-muted leading-relaxed">
                                        Minimalistisk, premium och immersiv. Vår designfilosofi vilar på idén att bilden är hjälten och gränssnittet dess trogna följeslagare.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter border-l-4 border-brand-accent pl-4">Interactive Elements</h2>
                            <div className="flex flex-wrap gap-4">
                                <button className="bg-brand-primary text-white font-black rounded-2xl px-6 py-3 uppercase tracking-wider text-xs shadow-lg hover:scale-105 transition-all">
                                    Primary Action
                                </button>
                                <button className="bg-brand-accent text-brand-primary font-black rounded-2xl px-6 py-3 uppercase tracking-wider text-xs shadow-lg hover:scale-105 transition-all">
                                    Accent Action
                                </button>
                                <button className="glass-card font-black rounded-2xl px-6 py-3 uppercase tracking-wider text-xs shadow-md">
                                    Secondary
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="aspect-square rounded-3xl glass-card flex items-center justify-center group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest z-10">Glass</span>
                                </div>
                                <div className="aspect-square rounded-3xl bg-brand-primary flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Dark</span>
                                </div>
                                <div className="aspect-square rounded-3xl border-2 border-dashed border-brand-muted/30 flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Border</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
