import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Hotspot, HotspotStatus, Coordinate, View, Project, Unit, HotspotType } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { HotspotEditor } from './HotspotEditor';
import { Icons } from './Icons';
import { Viewer } from './Viewer';
import { Modal } from './Modal';

interface EditorProps {
  project: Project;
  view: View;
  /** Canonical view id from route (selectedViewId). Use this for save to avoid stale view reference. */
  viewId: string;
  viewHotspots: Hotspot[];
  allProjectHotspots: Hotspot[];
  onSave: (viewId: string, hotspots: Hotspot[]) => void;
  onBack: () => void;
  allProjectViews: View[];
  allProjectUnits: Unit[];
}

// Custom hook for managing state history (undo/redo)
const useHistoryState = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory(currentHistory => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prevState: T) => T)(currentHistory[currentIndex])
        : newState;
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(resolvedState);
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(c => c + 1);
    }
  }, [currentIndex, history.length]);

  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo, reset };
};


export const Editor: React.FC<EditorProps> = ({
  project,
  view,
  viewId: canonicalViewId,
  viewHotspots,
  allProjectHotspots,
  onSave,
  onBack,
  allProjectViews,
  allProjectUnits,
}) => {
  const {
    state: hotspots,
    setState: setHotspotsHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHotspotsHistory
  } = useHistoryState(viewHotspots);

  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingType, setDrawingType] = useState<HotspotType>('polygon');
  const [drawingPoints, setDrawingPoints] = useState<Coordinate[]>([]);
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [fitViewToggle, setFitViewToggle] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewViewId, setPreviewViewId] = useState<string | null>(null);

  const [hotspotToDelete, setHotspotToDelete] = useState<Hotspot | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Track previous canonical view id to only reset when route actually changes
  const prevViewIdRef = useRef<string>(canonicalViewId);

  // Reset view state when canonical view id (route) changes, but only if not drawing
  useEffect(() => {
    if (prevViewIdRef.current !== canonicalViewId) {
      prevViewIdRef.current = canonicalViewId;
      if (!isDrawingRef.current && !startDrawingRef.current) {
        resetHotspotsHistory(viewHotspots);
        setSelectedHotspotId(null);
        setIsDrawing(false);
        isDrawingRef.current = false;
        setDrawingPoints([]);
        setFitViewToggle(v => !v);
      }
    }
  }, [canonicalViewId, viewHotspots, resetHotspotsHistory]);

  const selectedHotspot = useMemo(
    () => hotspots.find(h => h.id === selectedHotspotId),
    [hotspots, selectedHotspotId]
  );

  const startDrawingRef = useRef(false);
  const isDrawingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  const startDrawing = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }

    // Set flag to prevent immediate deactivation
    startDrawingRef.current = true;
    isDrawingRef.current = true;

    // Set state immediately
    setIsDrawing(true);
    setSelectedHotspotId(null);
    setDrawingPoints([]);

    // Auto open sidebar if drawing
    if (!isSidebarOpen) setIsSidebarOpen(true);

    // Reset flag after a delay to ensure all events have been processed
    setTimeout(() => {
      startDrawingRef.current = false;
    }, 200);
  }, [isSidebarOpen]);

  const finishDrawing = useCallback(() => {
    if (drawingPoints.length < 3) {
      alert("A polygon hotspot must have at least 3 points.");
      setDrawingPoints([]);
      setIsDrawing(false);
      isDrawingRef.current = false;
      return;
    }

    const newHotspot: Hotspot = {
      id: `hotspot_${new Date().getTime()} `,
      viewId: canonicalViewId,
      label: `Area ${hotspots.length + 1} `,
      type: 'polygon',
      coordinates: drawingPoints,
      status: HotspotStatus.ForSale,
      color: "#5C7263",
      opacity: 0.6,
    };

    setHotspotsHistory(prev => [...prev, newHotspot]);
    setDrawingPoints([]);
    setIsDrawing(false);
    isDrawingRef.current = false;
    startDrawingRef.current = false; // Reset the flag as well
    setSelectedHotspotId(newHotspot.id);
  }, [drawingPoints, hotspots.length, canonicalViewId, setHotspotsHistory]);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    isDrawingRef.current = false;
    startDrawingRef.current = false;
    setDrawingPoints([]);
  }, []);

  const handleMapClick = (coords: Coordinate) => {
    // Don't handle map clicks if we just started drawing (to prevent immediate deactivation)
    if (startDrawingRef.current) {
      return;
    }
    if (!isDrawing || !isDrawingRef.current) {
      return;
    }
    if (isDrawing && isDrawingRef.current) {
      if (drawingType === 'polygon') {
        setDrawingPoints(prev => [...prev, coords]);
      } else {
        const newHotspot: Hotspot = {
          id: `hotspot_${new Date().getTime()} `,
          viewId: canonicalViewId,
          label: `${drawingType === 'info' ? 'Info Point' : 'Camera Point'} ${hotspots.length + 1} `,
          type: drawingType,
          coordinates: [coords],
          status: HotspotStatus.ForSale,
          color: "#FFFFFF",
          opacity: 1,
        };
        setHotspotsHistory(prev => [...prev, newHotspot]);
        setIsDrawing(false);
        isDrawingRef.current = false;
        startDrawingRef.current = false;
        setSelectedHotspotId(newHotspot.id);
      }
    }
  };

  const handleHotspotClick = (hotspotId: string) => {
    // Don't handle hotspot clicks if we just started drawing
    if (startDrawingRef.current) {
      return;
    }
    if (!isDrawing) {
      setSelectedHotspotId(hotspotId);
      // Auto open sidebar to show properties
      if (!isSidebarOpen) setIsSidebarOpen(true);
    }
  };

  const updateHotspot = (updatedHotspot: Hotspot) => {
    setHotspotsHistory(prev => prev.map(h => (h.id === updatedHotspot.id ? updatedHotspot : h)));
  };

  const handleDeleteHotspot = (hotspot: Hotspot) => {
    setHotspotToDelete(hotspot);
  };

  const confirmDelete = () => {
    if (!hotspotToDelete) return;
    setHotspotsHistory(prev => prev.filter(h => h.id !== hotspotToDelete.id));
    if (selectedHotspotId === hotspotToDelete.id) {
      setSelectedHotspotId(null);
    }
    setHotspotToDelete(null);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (hotspots.length !== viewHotspots.length) return true;
    // Deep comparison would be better, but for now just check length and IDs
    const hotspotIds = new Set(hotspots.map(h => h.id));
    const viewHotspotIds = new Set(viewHotspots.map(h => h.id));
    if (hotspotIds.size !== viewHotspotIds.size) return true;
    for (const id of hotspotIds) {
      if (!viewHotspotIds.has(id)) return true;
    }
    return false;
  }, [hotspots, viewHotspots]);

  const handleSave = useCallback(() => {
    onSave(canonicalViewId, hotspots);
    resetHotspotsHistory(hotspots);
    // Reset drawing state after save
    setIsDrawing(false);
    isDrawingRef.current = false;
    startDrawingRef.current = false;
    setDrawingPoints([]);
    setSelectedHotspotId(null);
  }, [onSave, canonicalViewId, hotspots, resetHotspotsHistory]);

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    const newScale = Math.max(0.25, Math.min(4, transform.scale * factor));
    setTransform({ ...transform, scale: newScale });
  };

  const handleFitToScreen = () => {
    setFitViewToggle(v => !v);
  };

  // Preview handlers
  const handleStartPreview = () => {
    setPreviewViewId(view.id);
    setIsPreviewing(true);
  };

  const handleExitPreview = () => {
    setIsPreviewing(false);
    setPreviewViewId(null);
  };

  const handlePreviewNavigate = (viewId: string) => {
    setPreviewViewId(viewId);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if an input/textarea is focused or modals are open
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) ||
        isPreviewing ||
        hotspotToDelete
      ) {
        return;
      }

      // Delete / Backspace: Delete selected hotspot
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedHotspotId) {
        const hs = hotspots.find(h => h.id === selectedHotspotId);
        if (hs) handleDeleteHotspot(hs);
      }

      // Escape: Cancel drawing or deselect
      if (e.key === 'Escape') {
        if (isDrawing) {
          cancelDrawing();
        } else if (selectedHotspotId) {
          setSelectedHotspotId(null);
        }
      }

      // Enter: Finish drawing
      if (e.key === 'Enter' && isDrawing && drawingType === 'polygon') {
        finishDrawing();
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            undo();
          }
        }
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedHotspotId,
    hotspots,
    isDrawing,
    drawingType,
    canUndo,
    canRedo,
    undo,
    redo,
    handleSave,
    finishDrawing,
    cancelDrawing,
    isPreviewing,
    hotspotToDelete
  ]);

  // Create a single source of truth for all hotspots in preview mode.
  // In preview mode, we want to show all hotspots from the project so navigation works correctly
  const liveProjectHotspots = useMemo(() => {
    if (isPreviewing) {
      // In preview mode, combine current view hotspots with all project hotspots
      // This ensures navigation to other views shows their hotspots correctly
      const currentViewHotspotIds = new Set(hotspots.map(h => h.id));
      // Merge: current view hotspots (edited) + all other project hotspots
      const otherHotspots = allProjectHotspots.filter(h => !currentViewHotspotIds.has(h.id));
      return [...hotspots, ...otherHotspots];
    }
    // When not previewing, only use hotspots from the current view being edited
    return hotspots;
  }, [hotspots, allProjectHotspots, isPreviewing]);


  return (
    <div className="h-full w-full flex relative overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 bg-[#E9E6E1] dark:bg-gray-900 flex flex-col min-w-0 transition-all duration-300 relative">
        <div className="w-full h-full flex flex-col">
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 flex-shrink-0 transition-colors"
              >
                <Icons.Back className="w-4 h-4" />
              </button>
              <div className="truncate text-gray-900 dark:text-white">
                <h2 className="font-semibold truncate">{view.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{view.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartPreview();
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Icons.Eye className="w-5 h-5" />
                Preview
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartPreview();
                }}
                className="sm:hidden p-2 text-gray-700 bg-white border border-gray-300 rounded-md transition hover:bg-gray-50"
                title="Preview"
              >
                <Icons.Eye className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={!hasUnsavedChanges}
                className="px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md transition hover:bg-opacity-90 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                aria-label="Save (Ctrl+S)"
              >
                Save
              </button>
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 ml-2 shadow-sm bg-white dark:bg-gray-800"
                  title="Open Sidebar"
                >
                  <Icons.ChevronDoubleLeft className="w-4 h-4 mr-2" />
                </button>
              )}
            </div>
          </header>
          <div className="flex-1 min-h-0 relative">
            <InteractiveMap
              imageUrl={view.imageURL}
              hotspots={hotspots}
              drawingPoints={drawingPoints}
              selectedHotspotId={selectedHotspotId}
              onMapClick={handleMapClick}
              onHotspotClick={handleHotspotClick}
              onUpdateHotspot={updateHotspot}
              isDrawing={isDrawing && !startDrawingRef.current}
              transform={transform}
              onTransformChange={setTransform}
              fitViewToggle={fitViewToggle}
            />

            {/* Floating Undo/Redo Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    undo();
                  }}
                  disabled={!canUndo}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed border-r border-gray-100 dark:border-gray-700"
                  title="Undo (Ctrl+Z)"
                >
                  <Icons.Undo className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    redo();
                  }}
                  disabled={!canRedo}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Icons.Redo className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Floating Zoom Controls - Moved to Top Right as requested */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleZoom('in');
                  }}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                  title="Zoom In"
                >
                  <Icons.ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFitToScreen();
                  }}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                  title="Fit to Screen"
                >
                  <Icons.FitToScreen className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleZoom('out');
                  }}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Zoom Out"
                >
                  <Icons.ZoomOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {/* Responsive Behavior: Absolute positioned overlay on mobile, static flex item on larger screens */}
      <aside className={`
bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
            fixed md:relative right-0 top-0 bottom-0 z-30 h-full shadow-2xl md:shadow-none
            ${isSidebarOpen ? 'w-full sm:w-80 translate-x-0' : 'w-0 translate-x-full border-l-0 overflow-hidden'}
`}>
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-3 left-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 z-10 shadow-sm"
            title="Collapse Sidebar"
          >
            <Icons.ChevronDoubleRight className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-200" />
          </button>
        )}

        <div className="p-4 border-b dark:border-gray-700 flex justify-end items-center h-[57px]">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mr-auto ml-10">Properties</h2>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-3 w-full sm:w-80">
          {selectedHotspot ? (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-700/50">
              <HotspotEditor
                key={selectedHotspot.id}
                hotspot={selectedHotspot}
                onUpdate={updateHotspot}
                onDelete={() => handleDeleteHotspot(selectedHotspot)}
                availableViews={allProjectViews}
                availableUnits={allProjectUnits}
                projectAssets={project.assets || []}
                allViewHotspots={hotspots}
                currentViewId={view.id}
              />
            </div>
          ) : isDrawing ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 space-y-3">
              <p className="font-medium">Drawing Mode Active</p>
              <p>Click on the image to add points. You need at least 3 points for a polygon.</p>
              <div className="flex gap-2 pt-2">
                {drawingType === 'polygon' && (
                  <button onClick={finishDrawing} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md hover:bg-opacity-90 transition">Finish Polygon (Enter)</button>
                )}
                <button onClick={cancelDrawing} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition">Cancel (Esc)</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p>Select a hotspot to edit properties, or start drawing a new area.</p>
            </div>
          )}

          <div className="border-t dark:border-gray-700 pt-4 mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base text-gray-800 dark:text-white">Hotspots ({hotspots.length})</h3>
              {!isDrawing && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    // Prevent the click from reaching the map
                    startDrawing(e);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#5C7263] dark:text-green-400 hover:text-[#2E2E2E] dark:hover:text-white transition bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md"
                >
                  <Icons.Plus className="w-4 h-4" /> Ny hotspot
                </button>
              )}
            </div>

            {!isDrawing && (
              <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-around gap-1 mb-4">
                <button
                  onClick={() => setDrawingType('polygon')}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition ${drawingType === 'polygon' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} `}
                  title="Draw Polygon Area"
                >
                  <Icons.Polygon className="w-5 h-5" /> Polygon
                </button>
                <button
                  onClick={() => setDrawingType('info')}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition ${drawingType === 'info' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} `}
                  title="Add Info Point"
                >
                  <Icons.Info className="w-3.5 h-3.5" /> Info
                </button>
                <button
                  onClick={() => setDrawingType('camera')}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition ${drawingType === 'camera' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} `}
                  title="Add Camera Point"
                >
                  <Icons.Camera className="w-5 h-5" /> Camera
                </button>
              </div>
            )}


            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {hotspots.length > 0 ? hotspots.map(hotspot => (
                <div
                  key={hotspot.id}
                  onClick={() => handleHotspotClick(hotspot.id)}
                  className={`p-2.5 rounded-md cursor-pointer border transition group ${selectedHotspotId === hotspot.id ? 'bg-[#F3F4F6] dark:bg-gray-700 border-[#5C7263] dark:border-green-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'} `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {hotspot.type === 'polygon' ? (
                        <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10 shadow-sm" style={{ backgroundColor: hotspot.color, opacity: 1 }}></span>
                      ) : hotspot.type === 'info' ? (
                        <Icons.Info className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      ) : (
                        <Icons.Camera className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      )}
                      <p className={`font-medium text-sm truncate ${selectedHotspotId === hotspot.id ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'} `}>{hotspot.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hotspot.type === 'polygon' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${hotspot.status === 'for-sale' ? 'bg-green-100 text-green-800' : (hotspot.status === 'sold' ? 'bg-red-100 text-red-800' : (hotspot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'))} `}>{hotspot.status.replace('-', ' ')}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHotspot(hotspot);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Hotspot"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-sm text-gray-500 py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                  <p>No hotspots created yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>


      {/* Preview Modal */}
      {isPreviewing && previewViewId && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50" role="dialog" aria-modal="true">
          <Viewer
            project={project}
            currentView={allProjectViews.find(v => v.id === previewViewId)!}
            allProjectViews={allProjectViews}
            // FIX: Pass the 'allProjectUnits' prop to the Viewer component.
            allProjectUnits={allProjectUnits}
            hotspots={liveProjectHotspots}
            onNavigate={handlePreviewNavigate}
            onExit={handleExitPreview}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {hotspotToDelete && (
        <Modal onClose={() => setHotspotToDelete(null)}>
          <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">Confirm Deletion</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Are you sure you want to permanently delete the hotspot <strong className="font-semibold">{hotspotToDelete.label}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={() => setHotspotToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};