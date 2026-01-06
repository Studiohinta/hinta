
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Project, View, Hotspot, Coordinate, Unit, UnitStatus, ProjectAsset } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { InfoIcon } from './icons/InfoIcon';
import { CloseIcon } from './icons/CloseIcon';
import { FilterIcon } from './icons/FilterIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { SunIcon } from './icons/SunIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { StarIcon } from './icons/StarIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface ViewerProps {
  project: Project;
  currentView: View;
  allProjectViews: View[];
  allProjectUnits: Unit[];
  hotspots: Hotspot[];
  onNavigate: (viewId: string) => void;
  onExit?: () => void;
}

/**
 * Viewer component provides an interactive exploration interface for the project.
 * It renders hotspots on a zoomable image and handles navigation between different project views.
 */
export const Viewer: React.FC<ViewerProps> = ({
  project,
  currentView,
  allProjectViews,
  allProjectUnits,
  hotspots,
  onNavigate,
  onExit,
}) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize and update the zoom scale based on image and container dimensions
  const updateInitialTransform = useCallback(() => {
    if (imgRef.current && containerRef.current && imgRef.current.naturalWidth) {
      const container = containerRef.current;
      const img = imgRef.current;
      const scaleX = container.clientWidth / img.naturalWidth;
      const scaleY = container.clientHeight / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Center the image if it's smaller than the container
      const x = (container.clientWidth - img.naturalWidth * scale) / 2;
      const y = (container.clientHeight - img.naturalHeight * scale) / 2;
      
      setTransform({ scale, x, y });
    }
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      if (img.complete) {
        updateInitialTransform();
      } else {
        img.addEventListener('load', updateInitialTransform);
        return () => img.removeEventListener('load', updateInitialTransform);
      }
    }
  }, [currentView.imageURL, updateInitialTransform]);

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.linkedViewId) {
      onNavigate(hotspot.linkedViewId);
    } else if (hotspot.linkedUnitId) {
      setSelectedUnitId(hotspot.linkedUnitId);
    }
  };

  const selectedUnit = useMemo(() => 
    allProjectUnits.find(u => u.id === selectedUnitId),
    [allProjectUnits, selectedUnitId]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-950 overflow-hidden flex flex-col select-none">
      {/* Overlay UI Controls */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          {onExit && (
            <button 
              onClick={onExit}
              className="bg-black/30 backdrop-blur-xl text-white p-3.5 rounded-2xl hover:bg-black/50 transition-all border border-white/10 shadow-2xl group"
              title="Exit Viewer"
            >
              <CloseIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {currentView.parentId && (
            <button 
              onClick={() => onNavigate(currentView.parentId!)}
              className="bg-black/30 backdrop-blur-xl text-white p-3.5 rounded-2xl hover:bg-black/50 transition-all border border-white/10 shadow-2xl group"
              title="Back"
            >
              <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
        </div>
        
        <div className="pointer-events-auto flex flex-col items-center">
            <div className="bg-black/30 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] text-white border border-white/10 shadow-2xl text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{project.name}</h2>
              <p className="text-[10px] opacity-50 font-bold uppercase tracking-[0.4em]">{currentView.title}</p>
            </div>
        </div>

        <div className="pointer-events-auto flex gap-4">
           {/* Secondary top-right controls could go here */}
        </div>
      </div>

      {/* Main Exploration Area */}
      <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
        <div 
          className="absolute origin-top-left"
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          <img 
            ref={imgRef}
            src={currentView.imageURL} 
            alt={currentView.title}
            className="block"
          />
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-auto"
            viewBox={`0 0 ${imgRef.current?.naturalWidth || 100} ${imgRef.current?.naturalHeight || 100}`}
          >
            {hotspots.map(hs => {
              if (hs.type === 'polygon') {
                const points = hs.coordinates
                  .map(c => `${(c[0] / 100) * (imgRef.current?.naturalWidth || 100)},${(c[1] / 100) * (imgRef.current?.naturalHeight || 100)}`)
                  .join(' ');
                return (
                  <polygon
                    key={hs.id}
                    points={points}
                    fill={hs.color}
                    fillOpacity={hs.opacity * 0.5}
                    className="cursor-pointer hover:fill-opacity-80 transition-all duration-300"
                    onClick={() => handleHotspotClick(hs)}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeOpacity="0.2"
                  />
                );
              }
              const [x, y] = hs.coordinates[0] || [0,0];
              const absX = (x / 100) * (imgRef.current?.naturalWidth || 100);
              const absY = (y / 100) * (imgRef.current?.naturalHeight || 100);
              return (
                <g 
                  key={hs.id} 
                  transform={`translate(${absX}, ${absY})`} 
                  className="cursor-pointer group" 
                  onClick={() => handleHotspotClick(hs)}
                >
                  <circle 
                    r="20" 
                    fill="white" 
                    className="shadow-2xl group-hover:scale-125 transition-transform duration-500" 
                  />
                  <g className="text-gray-950">
                    {hs.type === 'camera' 
                        ? <CameraIcon className="w-8 h-8 -translate-x-4 -translate-y-4" /> 
                        : <InfoIcon className="w-8 h-8 -translate-x-4 -translate-y-4" />
                    }
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Unit Details Sidebar / Modal */}
      {selectedUnit && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md animate-fadeIn flex items-center justify-end p-8" onClick={() => setSelectedUnitId(null)}>
            <div 
              className="bg-white dark:bg-gray-900 w-full max-w-xl h-full max-h-[92vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slideInRight border border-white/5 relative"
              onClick={e => e.stopPropagation()}
            >
                <button 
                  onClick={() => setSelectedUnitId(null)}
                  className="absolute top-10 right-10 p-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-50 dark:bg-gray-800 rounded-3xl z-50 shadow-sm"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>

                <div className="p-14 overflow-y-auto flex flex-col h-full">
                    <div className="mb-12">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-8 ${
                            selectedUnit.status === 'for-sale' ? 'bg-green-100 text-green-800' : 
                            selectedUnit.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {selectedUnit.status.replace('-', ' ')}
                        </span>
                        <h3 className="text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-4">{selectedUnit.name}</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{project.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-12 mb-14">
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pris</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.price.toLocaleString()} SEK</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Boarea</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.size} m²</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rum</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.rooms} rok</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avgift</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.fee.toLocaleString()} kr/mån</p>
                        </div>
                    </div>

                    <div className="space-y-8 flex-grow">
                        <div className="bg-gray-50 dark:bg-gray-800/40 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner">
                             <h4 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-[0.3em] mb-6">Om bostaden</h4>
                             <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{selectedUnit.selections}</p>
                        </div>

                        {selectedUnit.files && selectedUnit.files.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                                {selectedUnit.files.map(file => (
                                    <a 
                                      key={file.id}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-500">
                                                <DownloadIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                                        </div>
                                        <ChevronRightIcon className="w-6 h-6 text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800">
                        <button className="w-full py-8 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-[2.5rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-xs">
                            Skicka Intresseanmälan
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
