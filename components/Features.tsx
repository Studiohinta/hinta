import React from 'react';
import {
    Box,
    Map,
    Layers,
    Image as ImageIcon,
    Cpu,
    Share2,
    Zap,
    MousePointer2
} from 'lucide-react';

interface FeatureProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureProps> = ({ title, description, icon }) => (
    <div className="glass-card group p-8 rounded-3xl border border-white/10 hover:border-brand-accent/30 transition-all duration-500">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-accent/20 transition-all duration-500">
            <div className="text-brand-primary dark:text-brand-accent">
                {icon}
            </div>
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter mb-3 text-brand-primary dark:text-white">
            {title}
        </h3>
        <p className="text-sm text-brand-muted dark:text-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

export const Features = () => {
    const features = [
        {
            title: "Interactive Editor",
            description: "Map out complex polygons and camera points directly on your project renders with pixel perfection.",
            icon: <MousePointer2 size={24} />,
        },
        {
            title: "Unit Management",
            description: "Bulk import residential units and automatically match fact sheets. Keep track of status and prices effortlessly.",
            icon: <Layers size={24} />,
        },
        {
            title: "Global Media Library",
            description: "Centralized storage for all your high-resolution renders, videos, and 360° panoramas.",
            icon: <ImageIcon size={24} />,
        },
        {
            title: "AI Descriptions",
            description: "Leverage Google Gemini to generate compelling sales descriptions and metadata for your units.",
            icon: <Cpu size={24} />,
        },
        {
            title: "Seamless Sharing",
            description: "Instantly generate QR codes and public links for any project or specific view.",
            icon: <Share2 size={24} />,
        },
        {
            title: "Nordic Cinematic",
            description: "Built-in design system that ensures your projects always look premium and minimalist.",
            icon: <Zap size={24} />,
        }
    ];

    return (
        <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent mb-4">
                    Platform Capabilities
                </h2>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-brand-primary dark:text-white">
                    Visualisera <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-white/60">Framtiden</span>
                </h1>
                <p className="text-brand-muted dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
                    HINTA kombinerar avancerad teknik med nordisk estetik för att skapa
                    marknadens mest intuitiva bostadsväljare.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {features.map((feature, index) => (
                    <FeatureCard key={index} title={feature.title} description={feature.description} icon={feature.icon} />
                ))}
            </div>
        </section>
    );
};
