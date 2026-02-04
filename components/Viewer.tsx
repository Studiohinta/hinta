
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Project, View, Hotspot, Coordinate, Unit, UnitStatus, ProjectAsset } from '../types';
import { Icons } from './Icons';
import { UnitListSidebar } from './UnitListSidebar';

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
  // Filter hotspots to only show those from the current view (not from child views/sub-levels)
  const currentViewHotspots = useMemo(() => {
    return hotspots.filter(h => h.viewId === currentView.id);
  }, [hotspots, currentView.id]);

  // State for static fit-to-screen display (no zoom/pan)
  const [imageDisplaySize, setImageDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedHotspotIds, setHighlightedHotspotIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<string>('home');
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [sidebarHoveredUnitId, setSidebarHoveredUnitId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [isMobileDetailsExpanded, setIsMobileDetailsExpanded] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Reset expansion state when selection changes
  useEffect(() => {
    setIsMobileDetailsExpanded(false);
  }, [selectedUnitId]);

  // Update active tab when navigating to root view
  useEffect(() => {
    if (currentView.parentId === null) {
      setActiveNavTab('home');
    }
  }, [currentView.parentId]);

  // Calculate displayed image size whenever image loads or container resizes
  const updateImageDisplaySize = useCallback(() => {
    if (imgRef.current && imageContainerRef.current) {
      const container = imageContainerRef.current;
      const img = imgRef.current;

      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Calculate fit-to-screen size (100vh or 100vw, whichever constraint is hit first)
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerW / containerH;

        let displayWidth, displayHeight;
        if (imgAspect > containerAspect) {
          // Image is wider - constrain by width
          displayWidth = containerW;
          displayHeight = containerW / imgAspect;
        } else {
          // Image is taller - constrain by height
          displayHeight = containerH;
          displayWidth = containerH * imgAspect;
        }

        setImageDisplaySize({ width: displayWidth, height: displayHeight });
      }
    }
  }, []);


  // Update image display size on load and resize
  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      setIsImageLoaded(false);

      const handleLoad = () => {
        setTimeout(() => {
          updateImageDisplaySize();
          setIsImageLoaded(true);
        }, 10);
      };

      if (img.complete && img.naturalWidth > 0) {
        handleLoad();
      } else {
        img.addEventListener('load', handleLoad);
        return () => img.removeEventListener('load', handleLoad);
      }
    }
  }, [currentView.imageURL, updateImageDisplaySize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateImageDisplaySize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateImageDisplaySize]);


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

  const hoveredHotspot = useMemo(() =>
    hotspots.find(hs => hs.id === hoveredHotspotId) ||
    (isMobile && selectedUnitId && !isMobileDetailsExpanded ? hotspots.find(hs => hs.linkedUnitId === selectedUnitId) : null),
    [hotspots, hoveredHotspotId, isMobile, selectedUnitId, isMobileDetailsExpanded]
  );

  const hoveredUnit = useMemo(() => {
    if (!hoveredHotspot?.linkedUnitId) return null;
    return allProjectUnits.find(u => u.id === hoveredHotspot.linkedUnitId);
  }, [hoveredHotspot, allProjectUnits]);

  // Point-in-polygon test using ray casting algorithm
  const isPointInPolygon = useCallback((point: [number, number], polygon: number[][]): boolean => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }, []);


  // Simplified card position - just position above or below the hovered area
  const cardPosition = useMemo(() => {
    if ((!hoverPosition && !isMobile) || !hoveredHotspot || !imageContainerRef.current) return null;

    let targetX = 0;
    let targetY = 0;

    if (hoverPosition) {
      targetX = hoverPosition.x;
      targetY = hoverPosition.y;
    } else if (isMobile && hoveredHotspot && imgRef.current) {
      // Calculate center of hotspot for mobile view
      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      const scaleX = rect.width / img.naturalWidth;
      const scaleY = rect.height / img.naturalHeight;

      if (hoveredHotspot.type === 'polygon') {
        // Calculate polygon center
        const coords = hoveredHotspot.coordinates;
        const centerX = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const centerY = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

        targetX = rect.left + (centerX / 100 * img.naturalWidth) * scaleX;
        targetY = rect.top + (centerY / 100 * img.naturalHeight) * scaleY;

        // Adjust Y to be at top of polygon approximate
        const minY = Math.min(...coords.map(c => c[1]));
        targetY = rect.top + (minY / 100 * img.naturalHeight) * scaleY - 20;

      } else {
        // Icon center
        const [x, y] = hoveredHotspot.coordinates[0];
        targetX = rect.left + (x / 100 * img.naturalWidth) * scaleX;
        targetY = rect.top + (y / 100 * img.naturalHeight) * scaleY - 40;
      }
    } else {
      return null;
    }

    const cardWidth = Math.min(220, window.innerWidth * 0.45);
    const cardHeight = 180;
    const padding = 16;

    const containerRect = imageContainerRef.current.getBoundingClientRect();

    // Default: position above mouse/target
    let x = targetX;
    let y = targetY - padding - cardHeight;
    let transformX = '-50%';
    let transformY = '0%';

    // If card would go above container, position below instead
    if (y < containerRect.top + padding) {
      y = targetY + padding;
    }

    // Keep within horizontal bounds
    const halfCard = cardWidth / 2;
    if (x - halfCard < containerRect.left + padding) {
      x = containerRect.left + padding + halfCard;
    } else if (x + halfCard > containerRect.right - padding) {
      x = containerRect.right - padding - halfCard;
    }

    // Keep within vertical bounds
    if (y + cardHeight > containerRect.bottom - padding) {
      y = containerRect.bottom - padding - cardHeight;
    }
    if (y < containerRect.top + padding) {
      y = containerRect.top + padding;
    }

    return { x, y, transformX, transformY };
  }, [hoverPosition, hoveredHotspot, isMobile]);


  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync hovered hotspot with sidebar hover
  const effectiveHoveredHotspotId = hoveredHotspotId || (
    sidebarHoveredUnitId
      ? hotspots.find(h => h.linkedUnitId === sidebarHoveredUnitId)?.id || null
      : null
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isMobile ? 'h-screen flex flex-col overflow-hidden' : 'h-screen max-h-screen overflow-hidden grid lg:grid-cols-[auto_1fr]'} bg-gray-950 select-none`}
      style={{ minHeight: '-webkit-fill-available' }}
    >
      {/* Overlay UI Controls */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          {onExit && (
            <button
              onClick={onExit}
              className="bg-black/30 backdrop-blur-xl text-white p-3.5 rounded-2xl hover:bg-black/50 transition-all border border-white/10 shadow-2xl group"
              title="Exit Viewer"
            >
              <Icons.Close className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {currentView.parentId && (
            <button
              onClick={() => onNavigate(currentView.parentId!)}
              className="bg-black/30 backdrop-blur-xl text-white p-3.5 rounded-2xl hover:bg-black/50 transition-all border border-white/10 shadow-2xl group"
              title="Back"
            >
              <Icons.ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
        </div>


        <div className="pointer-events-auto flex gap-4">

        </div>
      </div>

      {/* Main Exploration Area - Static fit-to-screen image */}
      <div ref={imageContainerRef} className={`${isMobile ? 'w-full aspect-[4/3] relative flex-shrink-0' : 'flex-1 relative overflow-hidden'} bg-gray-950 flex items-center justify-center`}>
        {/* Image container with CSS contain behavior */}
        <div className={`relative ${isMobile ? 'w-full h-full' : 'w-full h-full'} flex items-center justify-center`}>
          <img
            ref={imgRef}
            src={currentView.imageURL}
            alt={currentView.title}
            className="max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-500"
            style={{ opacity: isImageLoaded ? 1 : 0 }}
            onError={(e) => {
              console.error('Image failed to load:', currentView.imageURL);
            }}
          />
          {/* Hotspots overlay - positioned absolutely on top of image */}
          {isImageLoaded && imageDisplaySize.width > 0 && (
            <svg
              className="absolute pointer-events-auto transition-opacity duration-500 ease-out"
              style={{
                width: imageDisplaySize.width,
                height: imageDisplaySize.height,
                opacity: 1,
              }}
              viewBox={`0 0 ${imgRef.current?.naturalWidth || 100} ${imgRef.current?.naturalHeight || 100}`}

            >
              {currentViewHotspots.map(hs => {
                if (hs.type === 'polygon') {
                  const points = hs.coordinates
                    .map(c => `${(c[0] / 100) * (imgRef.current?.naturalWidth || 100)},${(c[1] / 100) * (imgRef.current?.naturalHeight || 100)}`)
                    .join(' ');
                  const isHovered = effectiveHoveredHotspotId === hs.id;
                  const isHighlighted = highlightedHotspotIds.includes(hs.id) || (sidebarHoveredUnitId && hs.linkedUnitId === sidebarHoveredUnitId);

                  // Get linked unit for label display
                  const linkedUnit = hs.linkedUnitId
                    ? allProjectUnits.find(u => u.id === hs.linkedUnitId)
                    : null;
                  const isAvailable = linkedUnit?.status === 'for-sale';

                  // Calculate polygon center for label positioning
                  const coordsInPixels = hs.coordinates.map(c => [
                    (c[0] / 100) * (imgRef.current?.naturalWidth || 100),
                    (c[1] / 100) * (imgRef.current?.naturalHeight || 100)
                  ]);
                  const centerX = coordsInPixels.reduce((sum, c) => sum + c[0], 0) / coordsInPixels.length;
                  const centerY = coordsInPixels.reduce((sum, c) => sum + c[1], 0) / coordsInPixels.length;

                  return (
                    <g key={hs.id}>
                      <polygon
                        points={points}
                        fill={hs.color}
                        fillOpacity={isHovered || isHighlighted ? hs.opacity * 0.6 : 0}
                        className="cursor-pointer transition-all duration-300"
                        onClick={() => handleHotspotClick(hs)}
                        onMouseEnter={(e) => {
                          setHoveredHotspotId(hs.id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoverPosition({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 40
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredHotspotId(null);
                          setHoverPosition(null);
                        }}
                        onMouseMove={(e) => {
                          if (hoveredHotspotId === hs.id) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoverPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.top - 40
                            });
                          }
                        }}
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth={isHovered || isHighlighted ? "3" : "0"}
                        strokeOpacity={isHovered || isHighlighted ? "1" : "0"}
                      />
                    </g>
                  );
                }
                const [x, y] = hs.coordinates[0] || [0, 0];
                const absX = (x / 100) * (imgRef.current?.naturalWidth || 100);
                const absY = (y / 100) * (imgRef.current?.naturalHeight || 100);
                const isHovered = hoveredHotspotId === hs.id;
                // Fixed size for icon hotspots in SVG coordinate space
                const iconSize = 24;
                const circleRadius = 20;
                return (
                  <g
                    key={hs.id}
                    transform={`translate(${absX}, ${absY})`}
                    className="cursor-pointer group"
                    onClick={() => handleHotspotClick(hs)}
                    onMouseEnter={(e) => {
                      setHoveredHotspotId(hs.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Position card above the icon, outside the circle
                      const cardOffset = 50; // Distance from icon center
                      setHoverPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - cardOffset // Position above the icon
                      });
                      // If this is a camera hotspot, highlight linked hotspots
                      if (hs.type === 'camera' && hs.linkedHotspotIds) {
                        setHighlightedHotspotIds(hs.linkedHotspotIds);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredHotspotId(null);
                      setHoverPosition(null);
                      // Clear highlighted hotspots when leaving camera hotspot
                      if (hs.type === 'camera') {
                        setHighlightedHotspotIds([]);
                      }
                    }}
                    style={{
                      opacity: 1,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                  >
                    <circle
                      r={isHovered ? circleRadius + 5 : circleRadius}
                      fill="white"
                      fillOpacity={isHovered ? "0.95" : "0.85"}
                      stroke="rgba(0, 0, 0, 0.15)"
                      strokeWidth="1.5"
                      className="shadow-lg transition-all duration-300"
                    />
                    <g transform={`translate(-${iconSize / 2}, -${iconSize / 2})`}>
                      {hs.type === 'camera'
                        ? <Icons.Viewer className="text-gray-800" width={iconSize} height={iconSize} />
                        : <Icons.Info className="text-gray-800" width={iconSize} height={iconSize} />
                      }
                    </g>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>


      {/* Hover Info Card */}
      {hoveredUnit && cardPosition && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${cardPosition.x}px`,
            top: `${cardPosition.y}px`,
            transform: `translate(${cardPosition.transformX}, ${cardPosition.transformY})`,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), top 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="rounded-[2rem] p-3 md:p-4 min-w-[160px] max-w-[200px] animate-fadeIn"
            style={{
              background: isDarkMode
                ? 'rgba(26, 26, 26, 0.5)'
                : 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              /* Material Design elevation level 8 */
              boxShadow: isDarkMode
                ? '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)'
                : '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
              /* Material Design transition */
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="mb-3">
              <span
                className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${hoveredUnit.status === 'for-sale' ? 'text-green-700 dark:text-green-300 bg-green-50/80 dark:bg-green-900/40' :
                  hoveredUnit.status === 'reserved' ? 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/40' :
                    hoveredUnit.status === 'sold' ? 'text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/40' :
                      'text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40'
                  }`}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {hoveredUnit.status === 'for-sale' ? 'TILL SALU' :
                  hoveredUnit.status === 'reserved' ? 'RESERVERAD' :
                    hoveredUnit.status === 'sold' ? 'SÅLD' : 'KOMMANDE'}
              </span>
            </div>
            <h3 className="text-lg font-black text-brand-primary dark:text-white leading-none tracking-tighter mb-3">
              {hoveredUnit.name}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200 flex items-center gap-1">
                  <Icons.Area className="w-3 h-3" />
                </span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.size} kvm</span>
              </div>
              <div className="flex justify-between items-center transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200 flex items-center gap-1">
                  <Icons.Rooms className="w-3 h-3" />
                </span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.rooms} rok</span>
              </div>
              <div className="flex justify-between items-center transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200 flex items-center gap-1">
                  <Icons.Tag className="w-3 h-3" />
                </span>
                <span className="text-sm font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.price.toLocaleString()} SEK</span>
              </div>
              <div className="flex justify-between items-center transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200 flex items-center gap-1">AVGIFT</span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.fee.toLocaleString()} kr/mån</span>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Unit Details Sidebar / Modal */}
      {
        selectedUnit && (!isMobile || isMobileDetailsExpanded) && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md animate-fadeIn flex items-center justify-center p-4 md:p-8" onClick={() => setSelectedUnitId(null)}>
            <div
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150 w-full max-w-xl h-full max-h-[92vh] rounded-3xl md:rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slideInRight border border-white/20 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedUnitId(null)}
                className="absolute top-4 right-4 md:top-10 md:right-10 p-3 md:p-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-md rounded-2xl md:rounded-3xl z-50 shadow-sm border border-white/20"
              >
                <Icons.Close className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="p-6 md:p-14 overflow-y-auto flex flex-col h-full custom-scrollbar">
                <div className="mb-8 md:mb-12">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-6 md:mb-8 shadow-sm backdrop-blur-sm ${selectedUnit.status === 'for-sale' ? 'bg-green-100/80 text-green-800' :
                    selectedUnit.status === 'reserved' ? 'bg-amber-100/80 text-amber-800' :
                      selectedUnit.status === 'sold' ? 'bg-red-100/80 text-red-800' :
                        'bg-gray-100/80 text-gray-800'
                    }`}>
                    {selectedUnit.status.replace('-', ' ')}
                  </span>
                  <h3 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-3 md:mb-4">{selectedUnit.name}</h3>
                  <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{project.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12 md:gap-y-12 mb-10 md:mb-14">
                  <div className="">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Pris</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.price.toLocaleString()} SEK</p>
                  </div>
                  <div className="">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Icons.Area className="w-3 h-3" />
                      Boarea
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.size} m²</p>
                  </div>
                  <div className="">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Icons.Rooms className="w-3 h-3" />
                      Rum
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.rooms} rok</p>
                  </div>
                  <div className="">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Avgift</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.fee.toLocaleString()} kr/mån</p>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8 flex-grow">
                  <div className="bg-gray-50/50 dark:bg-gray-800/30 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-gray-100/50 dark:border-gray-700/30 shadow-inner backdrop-blur-sm">
                    <h4 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-[0.3em] mb-4 md:mb-6">Om bostaden</h4>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{selectedUnit.selections}</p>
                  </div>

                  {selectedUnit.files && selectedUnit.files.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedUnit.files.map(file => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-6 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all shadow-sm hover:shadow-md group backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-100/80 dark:bg-gray-900/80 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <Icons.Download className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                          </div>
                          <Icons.ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-gray-200/50 dark:border-gray-700/50">
                  <button className="w-full py-6 md:py-8 bg-gray-950/90 dark:bg-white/90 text-white dark:text-gray-950 rounded-2xl md:rounded-[2.5rem] font-black shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-xs backdrop-blur-sm">
                    Skicka Intresseanmälan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Desktop Sidebar - Always visible on large screens */}
      <UnitListSidebar
        units={allProjectUnits}
        selectedUnitId={selectedUnitId}
        hoveredUnitId={sidebarHoveredUnitId}
        onUnitSelect={(id) => setSelectedUnitId(id)}
        onUnitHover={setSidebarHoveredUnitId}
        projectName={project.name}
        isDarkMode={isDarkMode}
        isOpen={false}
        onClose={() => { }}
        isMobile={isMobile}
        onNavigateHome={() => {
          const rootView = allProjectViews.find(v => v.parentId === null);
          if (rootView) {
            onNavigate(rootView.id);
            setActiveNavTab('home');
          }
        }}
        onShowNavigation={() => {
          setShowNavigationModal(true);
          setActiveNavTab('navigation');
        }}
        onShowGallery={() => {
          setShowGalleryModal(true);
          setActiveNavTab('gallery');
        }}
        activeTab={activeNavTab}
      />

      {/* Floating nav removed - moved to sidebar */}

      {/* Navigation Modal - Breadcrumb/Hierarchy */}
      {
        showNavigationModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end animate-fadeIn"
            onClick={() => {
              setShowNavigationModal(false);
              setActiveNavTab('home');
            }}
          >
            <div
              className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto animate-slideInUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Navigering</h2>
                <button
                  onClick={() => {
                    setShowNavigationModal(false);
                    setActiveNavTab('home');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Icons.Close className="w-6 h-6" />
                </button>
              </div>

              {project.navigationMapImageUrl ? (
                <div className="mb-6 rounded-2xl overflow-hidden">
                  <img
                    src={project.navigationMapImageUrl}
                    alt="Navigation Map"
                    className="w-full h-auto"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                {(() => {
                  const breadcrumbs: View[] = [];
                  let current: View | undefined = currentView;
                  while (current) {
                    breadcrumbs.unshift(current);
                    current = current.parentId ? allProjectViews.find(v => v.id === current.parentId) : undefined;
                  }
                  return breadcrumbs.map((view, index) => (
                    <button
                      key={view.id}
                      onClick={() => {
                        onNavigate(view.id);
                        setShowNavigationModal(false);
                        setActiveNavTab('home');
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all ${view.id === currentView.id
                        ? 'bg-brand-primary/10 dark:bg-white/10 text-brand-primary dark:text-white font-black border-2 border-brand-primary dark:border-white'
                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {index > 0 && <Icons.ChevronRight className="w-4 h-4 text-gray-400" />}
                        <span>{view.title}</span>
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        )
      }

      {/* Gallery Modal */}
      {
        showGalleryModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end animate-fadeIn"
            onClick={() => {
              setShowGalleryModal(false);
              setActiveNavTab('home');
            }}
          >
            <div
              className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slideInUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Galleri</h2>
                <button
                  onClick={() => {
                    setShowGalleryModal(false);
                    setActiveNavTab('home');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Icons.Close className="w-6 h-6" />
                </button>
              </div>

              {project.assets && project.assets.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {project.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative group rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      {asset.type === 'image' || asset.type === 'panorama' || asset.type === 'floorplan' ? (
                        <img
                          src={asset.thumbnailUrl || asset.url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icons.Download className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-black text-sm">{asset.title}</p>
                          {asset.description && (
                            <p className="text-white/80 text-xs mt-1">{asset.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Icons.Gallery className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-bold">Inga bilder i galleriet ännu</p>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};
