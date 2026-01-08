
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
import { HomeIcon } from './icons/HomeIcon';
import { MapIcon } from './icons/MapIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

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
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
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
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Update active tab when navigating to root view
  useEffect(() => {
    if (currentView.parentId === null) {
      setActiveNavTab('home');
    }
  }, [currentView.parentId]);

  // Initialize and update the zoom scale based on image and container dimensions
  const updateInitialTransform = useCallback(() => {
    if (imgRef.current && containerRef.current && imgRef.current.naturalWidth > 0) {
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
      // Only reset image loaded state - keep transform to avoid zoom jump
      setIsImageLoaded(false);
      
      const handleLoad = () => {
        // Small delay to ensure naturalWidth/Height are set
        setTimeout(() => {
          updateInitialTransform();
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

  const hoveredHotspot = useMemo(() => 
    hotspots.find(hs => hs.id === hoveredHotspotId),
    [hotspots, hoveredHotspotId]
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

  // Helper function to check if card overlaps with active hotspot area
  const doesCardOverlapHotspot = useCallback((cardX: number, cardY: number, cardWidth: number, cardHeight: number, transformX: string, transformY: string, hotspot: Hotspot): boolean => {
    if (!imgRef.current) return false;
    
    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;
    const scale = transform.scale;
    const offsetX = transform.x;
    const offsetY = transform.y;
    
    // Calculate card bounds in viewport coordinates
    const cardLeft = transformX === '-50%' ? cardX - cardWidth / 2 : (transformX === '0%' ? cardX : cardX - cardWidth / 2);
    const cardRight = transformX === '-50%' ? cardX + cardWidth / 2 : (transformX === '0%' ? cardX + cardWidth : cardX + cardWidth / 2);
    const cardTop = transformY === '-100%' ? cardY - cardHeight : (transformY === '0%' ? cardY : cardY - cardHeight / 2);
    const cardBottom = transformY === '-100%' ? cardY : (transformY === '0%' ? cardY + cardHeight : cardY + cardHeight / 2);
    
    // Convert card bounds to image coordinates
    const cardLeftImg = ((cardLeft - offsetX) / scale);
    const cardRightImg = ((cardRight - offsetX) / scale);
    const cardTopImg = ((cardTop - offsetY) / scale);
    const cardBottomImg = ((cardBottom - offsetY) / scale);
    
    // Get all four corners of the card in image coordinates
    const cardCorners: [number, number][] = [
      [cardLeftImg, cardTopImg],
      [cardRightImg, cardTopImg],
      [cardRightImg, cardBottomImg],
      [cardLeftImg, cardBottomImg]
    ];
    
    if (hotspot.type === 'polygon' && hotspot.coordinates.length >= 3) {
      // Convert polygon coordinates to image coordinates
      const polyPoints = hotspot.coordinates.map(c => [
        (c[0] / 100) * imgWidth,
        (c[1] / 100) * imgHeight
      ]);
      
      // Check if any corner of the card is inside the polygon
      for (const corner of cardCorners) {
        if (isPointInPolygon(corner, polyPoints)) {
          return true;
        }
      }
      
      // Also check if card center is inside polygon
      const cardCenterX = (cardLeftImg + cardRightImg) / 2;
      const cardCenterY = (cardTopImg + cardBottomImg) / 2;
      if (isPointInPolygon([cardCenterX, cardCenterY], polyPoints)) {
        return true;
      }
      
      // Check if any polygon point is inside the card (for small polygons)
      for (const polyPoint of polyPoints) {
        if (polyPoint[0] >= cardLeftImg && polyPoint[0] <= cardRightImg &&
            polyPoint[1] >= cardTopImg && polyPoint[1] <= cardBottomImg) {
          return true;
        }
      }
      
      return false;
    } else if (hotspot.coordinates.length > 0) {
      // For circle hotspots (info/camera)
      const [x, y] = hotspot.coordinates[0];
      const centerX = (x / 100) * imgWidth;
      const centerY = (y / 100) * imgHeight;
      const radius = 50; // Increased radius for better separation
      
      // Check if any corner of the card is within the circle
      for (const corner of cardCorners) {
        const distance = Math.sqrt(Math.pow(corner[0] - centerX, 2) + Math.pow(corner[1] - centerY, 2));
        if (distance < radius) {
          return true;
        }
      }
      
      // Check if card center is within circle
      const cardCenterX = (cardLeftImg + cardRightImg) / 2;
      const cardCenterY = (cardTopImg + cardBottomImg) / 2;
      const distance = Math.sqrt(Math.pow(cardCenterX - centerX, 2) + Math.pow(cardCenterY - centerY, 2));
      
      return distance < radius + Math.max(cardWidth / scale, cardHeight / scale) / 2;
    }
    
    return false;
  }, [transform, isPointInPolygon]);

  // Calculate card position to keep it within image container but outside active hotspot area
  const cardPosition = useMemo(() => {
    if (!hoverPosition || !hoveredHotspotId || !imgRef.current || !imageContainerRef.current) return null;
    
    // Mobile-first: smaller card that scales with screen size
    const cardWidth = Math.min(200, window.innerWidth * 0.4); // Max 200px, or 40% of screen width
    const cardHeight = 180; // Fixed height
    const padding = 12; // Reduced padding for mobile
    const minDistanceFromHotspot = 12; // Allow much closer placement while staying outside the active hotspot
    
    // Get hotspot bounds from the hovered hotspot
    const hoveredHotspot = currentViewHotspots.find(h => h.id === hoveredHotspotId);
    if (!hoveredHotspot) return null;
    
    // Get image container bounds (the actual visible image area, not viewport)
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerTop = containerRect.top;
    const containerRight = containerRect.right;
    const containerBottom = containerRect.bottom;
    const containerCenterX = containerLeft + (containerRight - containerLeft) / 2;
    const containerCenterY = containerTop + (containerBottom - containerTop) / 2;
    
    // Ensure card stays within container bounds (image container, not viewport)
    const halfCardWidth = cardWidth / 2;
    const minX = containerLeft + padding;
    const maxX = containerRight - padding;
    const minY = containerTop + padding;
    const maxY = containerBottom - padding;
    
    // Use mouse position as primary reference for card placement
    const mouseX = hoverPosition.x;
    const mouseY = hoverPosition.y;
    
    // Calculate hotspot center in viewport coordinates
    let hotspotCenterX = mouseX;
    let hotspotCenterY = mouseY;
    
    if (hoveredHotspot.type === 'polygon' && hoveredHotspot.coordinates.length >= 3) {
      const polyPoints = hoveredHotspot.coordinates.map(c => [
        (c[0] / 100) * (imgRef.current?.naturalWidth || 100),
        (c[1] / 100) * (imgRef.current?.naturalHeight || 100)
      ]);
      const polyMinX = Math.min(...polyPoints.map(p => p[0]));
      const polyMaxX = Math.max(...polyPoints.map(p => p[0]));
      const polyMinY = Math.min(...polyPoints.map(p => p[1]));
      const polyMaxY = Math.max(...polyPoints.map(p => p[1]));
      const polyCenterX = (polyMinX + polyMaxX) / 2;
      const polyCenterY = (polyMinY + polyMaxY) / 2;
      
      // Convert to viewport coordinates
      hotspotCenterX = (polyCenterX * transform.scale) + transform.x;
      hotspotCenterY = (polyCenterY * transform.scale) + transform.y;
    }
    
    // Calculate hotspot bounds for better positioning
    let hotspotBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null;
    if (hoveredHotspot.type === 'polygon' && hoveredHotspot.coordinates.length >= 3) {
      const polyPoints = hoveredHotspot.coordinates.map(c => [
        (c[0] / 100) * (imgRef.current?.naturalWidth || 100),
        (c[1] / 100) * (imgRef.current?.naturalHeight || 100)
      ]);
      const polyMinX = Math.min(...polyPoints.map(p => p[0]));
      const polyMaxX = Math.max(...polyPoints.map(p => p[0]));
      const polyMinY = Math.min(...polyPoints.map(p => p[1]));
      const polyMaxY = Math.max(...polyPoints.map(p => p[1]));
      
      // Convert to viewport coordinates
      hotspotBounds = {
        minX: (polyMinX * transform.scale) + transform.x,
        maxX: (polyMaxX * transform.scale) + transform.x,
        minY: (polyMinY * transform.scale) + transform.y,
        maxY: (polyMaxY * transform.scale) + transform.y
      };
    } else if (hoveredHotspot.coordinates.length > 0) {
      const [x, y] = hoveredHotspot.coordinates[0];
      const centerX = (x / 100) * (imgRef.current?.naturalWidth || 100);
      const centerY = (y / 100) * (imgRef.current?.naturalHeight || 100);
      const radius = 50 * transform.scale; // Circle radius in viewport coordinates
      hotspotBounds = {
        minX: (centerX * transform.scale) + transform.x - radius,
        maxX: (centerX * transform.scale) + transform.x + radius,
        minY: (centerY * transform.scale) + transform.y - radius,
        maxY: (centerY * transform.scale) + transform.y + radius
      };
    }
    
    // Try to position card near mouse position, avoiding hotspot
    // Prefer positions that are closer to the mouse for natural following behavior
    const candidatePositions: Array<{x: number, y: number, transformX: string, transformY: string, score: number}> = [];
    
    // Generate candidate positions near the mouse/hotspot, prioritizing proximity to mouse
    const positionsToTry: Array<{x: number, y: number, tx: string, ty: string, priority: number}> = [];
    
    // Primary positions: Directly relative to mouse/hotspot position (highest priority)
    if (hotspotBounds) {
      // Above mouse/hotspot - most natural for following mouse
      positionsToTry.push({ 
        x: mouseX, 
        y: hotspotBounds.minY - minDistanceFromHotspot, 
        tx: '-50%', 
        ty: '-100%',
        priority: 1 
      });
      
      // Below mouse/hotspot
      positionsToTry.push({ 
        x: mouseX, 
        y: hotspotBounds.maxY + minDistanceFromHotspot, 
        tx: '-50%', 
        ty: '0%',
        priority: 2 
      });
      
      // Right of mouse/hotspot, aligned with mouse Y
      positionsToTry.push({ 
        x: hotspotBounds.maxX + halfCardWidth + minDistanceFromHotspot, 
        y: mouseY, 
        tx: '0%', 
        ty: '-50%',
        priority: 2 
      });
      
      // Left of mouse/hotspot, aligned with mouse Y
      positionsToTry.push({ 
        x: hotspotBounds.minX - halfCardWidth - minDistanceFromHotspot, 
        y: mouseY, 
        tx: '0%', 
        ty: '-50%',
        priority: 2 
      });
      
      // Diagonal positions near mouse
      positionsToTry.push({ 
        x: hotspotBounds.maxX + halfCardWidth + minDistanceFromHotspot, 
        y: hotspotBounds.minY - minDistanceFromHotspot, 
        tx: '0%', 
        ty: '-100%',
        priority: 3 
      });
      positionsToTry.push({ 
        x: hotspotBounds.minX - halfCardWidth - minDistanceFromHotspot, 
        y: hotspotBounds.minY - minDistanceFromHotspot, 
        tx: '0%', 
        ty: '-100%',
        priority: 3 
      });
      positionsToTry.push({ 
        x: hotspotBounds.maxX + halfCardWidth + minDistanceFromHotspot, 
        y: hotspotBounds.maxY + minDistanceFromHotspot, 
        tx: '0%', 
        ty: '0%',
        priority: 3 
      });
      positionsToTry.push({ 
        x: hotspotBounds.minX - halfCardWidth - minDistanceFromHotspot, 
        y: hotspotBounds.maxY + minDistanceFromHotspot, 
        tx: '0%', 
        ty: '0%',
        priority: 3 
      });
    }
    
    // Secondary positions: Container edges as fallback (lower priority)
    positionsToTry.push({ 
      x: maxX - halfCardWidth - padding, 
      y: mouseY, 
      tx: '0%', 
      ty: '-50%',
      priority: 10 
    });
    positionsToTry.push({ 
      x: minX + halfCardWidth + padding, 
      y: mouseY, 
      tx: '0%', 
      ty: '-50%',
      priority: 10 
    });
    positionsToTry.push({ 
      x: mouseX, 
      y: minY + cardHeight / 2 + padding, 
      tx: '-50%', 
      ty: '-50%',
      priority: 10 
    });
    positionsToTry.push({ 
      x: mouseX, 
      y: maxY - cardHeight / 2 - padding, 
      tx: '-50%', 
      ty: '-50%',
      priority: 10 
    });
    
    // Test each candidate position
    for (const pos of positionsToTry) {
      let candidateX = pos.x;
      let candidateY = pos.y;
      let candidateTransformX = pos.tx;
      let candidateTransformY = pos.ty;
      
      // Ensure position is within bounds
      if (candidateTransformX === '-50%') {
        if (candidateX - halfCardWidth < minX || candidateX + halfCardWidth > maxX) continue;
      } else if (candidateTransformX === '0%') {
        if (candidateX < minX || candidateX + cardWidth > maxX) continue;
      }
      
      if (candidateTransformY === '-50%') {
        if (candidateY - cardHeight / 2 < minY || candidateY + cardHeight / 2 > maxY) continue;
      } else if (candidateTransformY === '-100%') {
        if (candidateY - cardHeight < minY) continue;
      } else if (candidateTransformY === '0%') {
        if (candidateY + cardHeight > maxY) continue;
      }
      
      // Check if position overlaps hotspot
      if (!doesCardOverlapHotspot(candidateX, candidateY, cardWidth, cardHeight, candidateTransformX, candidateTransformY, hoveredHotspot)) {
        // Score based on distance from mouse position (lower = closer to mouse = better)
        // Priority gives bonus to preferred positions
        const distanceFromMouse = Math.abs(candidateX - mouseX) + Math.abs(candidateY - mouseY);
        const score = distanceFromMouse + (pos.priority * 100); // Priority heavily influences score
        candidatePositions.push({
          x: candidateX,
          y: candidateY,
          transformX: candidateTransformX,
          transformY: candidateTransformY,
          score: score
        });
      }
    }
    
    // Sort candidates by score (lower = closer to mouse and higher priority = better)
    candidatePositions.sort((a, b) => a.score - b.score);
    
    let x = hoverPosition.x;
    let y = hoverPosition.y;
    let transformX = '-50%';
    let transformY = '-50%';
    
    if (candidatePositions.length > 0) {
      // Use the best candidate (closest to center)
      const bestCandidate = candidatePositions[0];
      x = bestCandidate.x;
      y = bestCandidate.y;
      transformX = bestCandidate.transformX;
      transformY = bestCandidate.transformY;
    } else {
      // Fallback: position card relative to mouse, away from hotspot
      // Try to place it near the mouse but outside hotspot bounds
      const dx = mouseX - hotspotCenterX;
      const dy = mouseY - hotspotCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Move away from hotspot center towards mouse, but keep outside hotspot
        const offsetX = dx / distance * (minDistanceFromHotspot + halfCardWidth);
        const offsetY = dy / distance * (minDistanceFromHotspot + cardHeight / 2);
        
        x = hotspotCenterX + offsetX;
        y = hotspotCenterY + offsetY;
        transformX = '-50%';
        transformY = '-50%';
      } else {
        // If mouse is exactly at hotspot center, place above
        x = mouseX;
        y = mouseY - minDistanceFromHotspot - cardHeight / 2;
        transformX = '-50%';
        transformY = '-50%';
      }
      
      // Ensure bounds
      if (transformX === '-50%') {
        x = Math.max(minX + halfCardWidth, Math.min(maxX - halfCardWidth, x));
      } else {
        x = Math.max(minX, Math.min(maxX - cardWidth, x));
      }
      
      if (transformY === '-50%') {
        y = Math.max(minY + cardHeight / 2, Math.min(maxY - cardHeight / 2, y));
      } else if (transformY === '-100%') {
        y = Math.max(minY + cardHeight, y);
      } else {
        y = Math.min(maxY - cardHeight, y);
      }
    }
    
    // Final bounds check - ensure card stays within container
    if (x - halfCardWidth < minX) {
      x = minX + halfCardWidth;
      transformX = '0%';
    } else if (x + halfCardWidth > maxX) {
      x = maxX - halfCardWidth;
      transformX = '0%';
    }
    
    if (transformY === '-50%') {
      if (y - cardHeight / 2 < minY) {
        y = minY + cardHeight / 2;
      } else if (y + cardHeight / 2 > maxY) {
        y = maxY - cardHeight / 2;
      }
    } else if (transformY === '-100%') {
      if (y - cardHeight < minY) {
        y = minY + cardHeight;
      }
    } else if (transformY === '0%') {
      if (y + cardHeight > maxY) {
        y = maxY - cardHeight;
      }
    }
    
    // Final safety check: ensure card is never inside active hotspot
    // Try a few iterations to find a valid position (reduced attempts for smoother movement)
    let attempts = 0;
    const maxAttempts = 3;
    while (doesCardOverlapHotspot(x, y, cardWidth, cardHeight, transformX, transformY, hoveredHotspot) && attempts < maxAttempts) {
      attempts++;
      
      // Calculate direction from hotspot to mouse (prefer direction towards mouse)
      const dx = mouseX - hotspotCenterX;
      const dy = mouseY - hotspotCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Move in direction from hotspot towards mouse, with increasing distance
        const moveDistance = minDistanceFromHotspot + (cardWidth / 2) + (attempts * 30);
        x = hotspotCenterX + (dx / distance) * moveDistance;
        y = hotspotCenterY + (dy / distance) * moveDistance;
        transformX = '-50%';
        transformY = '-50%';
      } else {
        // If hotspot is at mouse, move towards container center
        const dx2 = containerCenterX - hotspotCenterX;
        const dy2 = containerCenterY - hotspotCenterY;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (distance2 > 0) {
          const moveDistance = minDistanceFromHotspot + cardWidth / 2;
          x = hotspotCenterX + (dx2 / distance2) * moveDistance;
          y = hotspotCenterY + (dy2 / distance2) * moveDistance;
          transformX = '-50%';
          transformY = '-50%';
        } else {
          // Fallback to top edge
          x = mouseX;
          y = minY + cardHeight + padding;
          transformX = '-50%';
          transformY = '-100%';
        }
      }
      
      // Re-check bounds
      if (transformX === '-50%') {
        if (x - halfCardWidth < minX) {
          x = minX + halfCardWidth;
          transformX = '0%';
        } else if (x + halfCardWidth > maxX) {
          x = maxX - halfCardWidth;
          transformX = '0%';
        }
      } else {
        if (x < minX) {
          x = minX;
        } else if (x + cardWidth > maxX) {
          x = maxX - cardWidth;
        }
      }
      
      if (transformY === '-50%') {
        if (y - cardHeight / 2 < minY) {
          y = minY + cardHeight / 2;
        } else if (y + cardHeight / 2 > maxY) {
          y = maxY - cardHeight / 2;
        }
      } else if (transformY === '-100%') {
        if (y - cardHeight < minY) {
          y = minY + cardHeight;
        }
      } else {
        if (y + cardHeight > maxY) {
          y = maxY - cardHeight;
        }
      }
    }
    
    // If still overlapping after all attempts, hide the card
    if (doesCardOverlapHotspot(x, y, cardWidth, cardHeight, transformX, transformY, hoveredHotspot)) {
      return null;
    }
    
    return { x, y, transformX, transformY };
  }, [hoverPosition, hoveredHotspotId, currentViewHotspots, doesCardOverlapHotspot, transform, imgRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen max-h-screen bg-gray-950 overflow-hidden flex flex-col select-none"
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
        

        <div className="pointer-events-auto flex gap-4">
           {/* Secondary top-right controls could go here */}
        </div>
      </div>

      {/* Main Exploration Area */}
      <div ref={imageContainerRef} className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
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
            onError={(e) => {
              console.error('Image failed to load:', currentView.imageURL);
            }}
          />
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-auto transition-opacity duration-500 ease-out"
            style={{ 
              opacity: isImageLoaded && transform.scale > 0.001 ? 1 : 0,
              pointerEvents: isImageLoaded && transform.scale > 0.001 ? 'auto' : 'none'
            }}
            viewBox={`0 0 ${imgRef.current?.naturalWidth || 100} ${imgRef.current?.naturalHeight || 100}`}
          >
            {currentViewHotspots.map(hs => {
              if (hs.type === 'polygon') {
                const points = hs.coordinates
                  .map(c => `${(c[0] / 100) * (imgRef.current?.naturalWidth || 100)},${(c[1] / 100) * (imgRef.current?.naturalHeight || 100)}`)
                  .join(' ');
                const isHovered = hoveredHotspotId === hs.id;
                const isHighlighted = highlightedHotspotIds.includes(hs.id);
                return (
                  <polygon
                    key={hs.id}
                    points={points}
                    fill={hs.color}
                    fillOpacity={isHovered || isHighlighted ? hs.opacity * 0.6 : 0}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => handleHotspotClick(hs)}
                    onMouseEnter={(e) => {
                      setHoveredHotspotId(hs.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Position card above the polygon, outside the hotspot area
                      const cardOffset = 40; // Distance from hotspot edge
                      setHoverPosition({ 
                        x: rect.left + rect.width / 2, 
                        y: rect.top - cardOffset // Position above the polygon
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredHotspotId(null);
                      setHoverPosition(null);
                    }}
                    onMouseMove={(e) => {
                      if (hoveredHotspotId === hs.id) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        // Keep card above the polygon
                        const cardOffset = 40;
                        setHoverPosition({ 
                          x: rect.left + rect.width / 2, 
                          y: rect.top - cardOffset
                        });
                      }
                    }}
                    stroke="white"
                    strokeWidth={isHovered || isHighlighted ? "2" : "0"}
                    strokeOpacity={isHovered || isHighlighted ? "0.8" : "0"}
                  />
                );
              }
              const [x, y] = hs.coordinates[0] || [0,0];
              const absX = (x / 100) * (imgRef.current?.naturalWidth || 100);
              const absY = (y / 100) * (imgRef.current?.naturalHeight || 100);
              const isHovered = hoveredHotspotId === hs.id;
              // Use fixed size in SVG coordinates - SVG is already scaled by transform.scale on the parent div
              // No need to compensate, just use fixed pixel values in SVG coordinate space
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
                >
                  <circle 
                    r={isHovered ? circleRadius + 5 : circleRadius} 
                    fill="white" 
                    fillOpacity={isHovered ? "0.95" : "0.85"}
                    stroke="rgba(0, 0, 0, 0.15)"
                    strokeWidth="1.5"
                    className="shadow-lg transition-all duration-300" 
                  />
                  <g transform={`translate(-${iconSize/2}, -${iconSize/2})`}>
                    {hs.type === 'camera' 
                        ? <CameraIcon className="text-gray-800" width={iconSize} height={iconSize} /> 
                        : <InfoIcon className="text-gray-800" width={iconSize} height={iconSize} />
                    }
                  </g>
                </g>
              );
            })}
          </svg>
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
                className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                  hoveredUnit.status === 'for-sale' ? 'text-green-700 dark:text-green-300 bg-green-50/80 dark:bg-green-900/40' : 
                  hoveredUnit.status === 'reserved' ? 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/40' : 
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
              <div className="flex justify-between items-center border-l-[3px] border-brand-primary/20 dark:border-white/20 pl-2 transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200">YTA</span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.size} kvm</span>
              </div>
              <div className="flex justify-between items-center border-l-[3px] border-brand-primary/20 dark:border-white/20 pl-2 transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200">PRIS</span>
                <span className="text-sm font-black text-brand-accent dark:text-brand-accent tracking-tight transition-all duration-200">{hoveredUnit.price.toLocaleString()} SEK</span>
              </div>
              <div className="flex justify-between items-center border-l-[3px] border-brand-primary/20 dark:border-white/20 pl-2 transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200">ROK</span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.rooms} rok</span>
              </div>
              <div className="flex justify-between items-center border-l-[3px] border-brand-primary/20 dark:border-white/20 pl-2 transition-all duration-200 hover:border-brand-primary/40 dark:hover:border-white/40">
                <span className="text-[8px] font-bold text-brand-primary/70 dark:text-white/70 uppercase tracking-widest transition-colors duration-200">AVGIFT</span>
                <span className="text-xs font-black text-brand-primary dark:text-white tracking-tight transition-all duration-200">{hoveredUnit.fee.toLocaleString()} kr/mån</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit Details Sidebar / Modal */}
      {selectedUnit && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md animate-fadeIn flex items-center justify-end p-4 md:p-8" onClick={() => setSelectedUnitId(null)}>
            <div 
              className="bg-white dark:bg-gray-900 w-full max-w-xl h-full max-h-[92vh] rounded-3xl md:rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slideInRight border border-white/5 relative"
              onClick={e => e.stopPropagation()}
            >
                <button 
                  onClick={() => setSelectedUnitId(null)}
                  className="absolute top-4 right-4 md:top-10 md:right-10 p-3 md:p-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-50 dark:bg-gray-800 rounded-2xl md:rounded-3xl z-50 shadow-sm"
                >
                  <CloseIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div className="p-6 md:p-14 overflow-y-auto flex flex-col h-full">
                    <div className="mb-8 md:mb-12">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-6 md:mb-8 ${
                            selectedUnit.status === 'for-sale' ? 'bg-green-100 text-green-800' : 
                            selectedUnit.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {selectedUnit.status.replace('-', ' ')}
                        </span>
                        <h3 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-3 md:mb-4">{selectedUnit.name}</h3>
                        <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{project.name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12 md:gap-y-12 mb-10 md:mb-14">
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-4 md:pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pris</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.price.toLocaleString()} SEK</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-4 md:pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Boarea</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.size} m²</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-4 md:pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rum</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.rooms} rok</p>
                        </div>
                        <div className="border-l-4 border-gray-100 dark:border-gray-800 pl-4 md:pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avgift</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedUnit.fee.toLocaleString()} kr/mån</p>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 flex-grow">
                        <div className="bg-gray-50 dark:bg-gray-800/40 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner">
                             <h4 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-[0.3em] mb-4 md:mb-6">Om bostaden</h4>
                             <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{selectedUnit.selections}</p>
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

                    <div className="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-gray-100 dark:border-gray-800">
                        <button className="w-full py-6 md:py-8 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-2xl md:rounded-[2.5rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-xs">
                            Skicka Intresseanmälan
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Glassmorphism Style */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-3rem)]">
        <div 
          className="glass-panel rounded-[2rem] px-2 py-3 shadow-2xl"
          style={{
            background: isDarkMode 
              ? 'rgba(26, 26, 26, 0.7)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="flex items-center justify-around">
            {/* Start */}
            <button
              onClick={() => {
                const rootView = allProjectViews.find(v => v.parentId === null);
                if (rootView) {
                  onNavigate(rootView.id);
                  setActiveNavTab('home');
                }
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative group min-w-[60px]"
            >
              <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                activeNavTab === 'home' 
                  ? isDarkMode 
                    ? 'bg-white/10' 
                    : 'bg-gray-100/80'
                  : ''
              }`} />
              <HomeIcon className={`w-5 h-5 relative z-10 transition-colors ${
                activeNavTab === 'home'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
              <span className={`text-[10px] font-black relative z-10 transition-colors ${
                activeNavTab === 'home'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                Start
              </span>
            </button>

            {/* Navigering */}
            <button
              onClick={() => {
                setShowNavigationModal(true);
                setActiveNavTab('navigation');
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative group min-w-[60px]"
            >
              <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                activeNavTab === 'navigation' 
                  ? isDarkMode 
                    ? 'bg-white/10' 
                    : 'bg-gray-100/80'
                  : ''
              }`} />
              <MapIcon className={`w-5 h-5 relative z-10 transition-colors ${
                activeNavTab === 'navigation'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
              <span className={`text-[10px] font-black relative z-10 transition-colors ${
                activeNavTab === 'navigation'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                Navigering
              </span>
            </button>

            {/* Galleri */}
            <button
              onClick={() => {
                setShowGalleryModal(true);
                setActiveNavTab('gallery');
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative group min-w-[60px]"
            >
              <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                activeNavTab === 'gallery' 
                  ? isDarkMode 
                    ? 'bg-white/10' 
                    : 'bg-gray-100/80'
                  : ''
              }`} />
              <GalleryIcon className={`w-5 h-5 relative z-10 transition-colors ${
                activeNavTab === 'gallery'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
              <span className={`text-[10px] font-black relative z-10 transition-colors ${
                activeNavTab === 'gallery'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                Galleri
              </span>
            </button>

            {/* Solstudie */}
            <button
              disabled
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative group min-w-[60px] opacity-50 cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-2xl" />
              <SunIcon className="w-5 h-5 relative z-10 text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] font-black relative z-10 text-gray-400 dark:text-gray-500">
                Solstudie
              </span>
            </button>

            {/* Sök */}
            <button
              onClick={() => {
                setShowSearchModal(true);
                setActiveNavTab('search');
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative group min-w-[60px]"
            >
              <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                activeNavTab === 'search' 
                  ? isDarkMode 
                    ? 'bg-white/10' 
                    : 'bg-gray-100/80'
                  : ''
              }`} />
              <MagnifyingGlassIcon className={`w-5 h-5 relative z-10 transition-colors ${
                activeNavTab === 'search'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
              <span className={`text-[10px] font-black relative z-10 transition-colors ${
                activeNavTab === 'search'
                  ? 'text-brand-primary dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                Sök
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Modal - Breadcrumb/Hierarchy */}
      {showNavigationModal && (
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
                <CloseIcon className="w-6 h-6" />
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
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      view.id === currentView.id
                        ? 'bg-brand-primary/10 dark:bg-white/10 text-brand-primary dark:text-white font-black border-2 border-brand-primary dark:border-white'
                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {index > 0 && <ChevronRightIcon className="w-4 h-4 text-gray-400" />}
                      <span>{view.title}</span>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
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
                <CloseIcon className="w-6 h-6" />
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
                        <DownloadIcon className="w-12 h-12 text-gray-400" />
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
                <GalleryIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Inga bilder i galleriet ännu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Modal - Unit List */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end animate-fadeIn"
          onClick={() => {
            setShowSearchModal(false);
            setActiveNavTab('home');
          }}
        >
          <div 
            className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto animate-slideInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Lägenheter</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setActiveNavTab('home');
                }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            {allProjectUnits.length > 0 ? (
              <div className="space-y-3">
                {allProjectUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setSelectedUnitId(unit.id);
                      setShowSearchModal(false);
                      setActiveNavTab('home');
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-lg">{unit.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">{unit.size} kvm • {unit.rooms} rok</p>
                      </div>
                      <p className="font-black text-brand-accent text-lg">{unit.price.toLocaleString()} SEK</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Inga lägenheter tillgängliga</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
