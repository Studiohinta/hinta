import React, { useRef, MouseEvent, useState, useEffect, useCallback } from 'react';
import { Hotspot, Coordinate, View } from '../types';
import { Icons } from './Icons';

type DragState =
  | { type: 'hotspotVertex'; hotspotId: string; vertexIndex: number }
  | { type: 'midpoint'; hotspotId: string; vertexIndex: number };

interface InteractiveMapProps {
  imageUrl: string | null;
  hotspots: Hotspot[];
  drawingPoints: Coordinate[];
  selectedHotspotId: string | null;
  onMapClick: (coords: Coordinate) => void;
  onHotspotClick: (hotspotId: string) => void;
  onUpdateHotspot: (hotspot: Hotspot) => void;
  isDrawing: boolean;
  transform: { scale: number; translateX: number; translateY: number };
  onTransformChange: (newTransform: { scale: number; translateX: number; translateY: number }) => void;
  fitViewToggle: boolean;
}

function coordinatesToString(coords: Coordinate[]): string {
  return coords.map(c => c.join(',')).join(' ');
}

const getMidpoint = (p1: Coordinate, p2: Coordinate): Coordinate => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  imageUrl,
  hotspots,
  drawingPoints,
  selectedHotspotId,
  onMapClick,
  onHotspotClick,
  onUpdateHotspot,
  isDrawing,
  transform,
  onTransformChange,
  fitViewToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredHandle, setHoveredHandle] = useState<{ type: 'vertex' | 'midpoint', hotspotId: string, index: number } | null>(null);
  const [highlightedHotspotIds, setHighlightedHotspotIds] = useState<string[]>([]);

  const calculateFitTransform = useCallback(() => {
    if (!containerRef.current || !imgRef.current || !imgRef.current.naturalWidth) {
      return;
    }
    const container = containerRef.current;
    const image = imgRef.current;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    if (imageWidth === 0 || imageHeight === 0) return;

    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);

    const translateX = 0;
    const translateY = 0;

    onTransformChange({ scale, translateX, translateY });
  }, [onTransformChange]);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    const handleLoad = () => {
      setImageDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight });
      calculateFitTransform();
    };

    imgElement.addEventListener('load', handleLoad);
    if (imgElement.complete && imgElement.naturalWidth > 0) {
      handleLoad();
    }

    const containerElement = containerRef.current;
    const resizeObserver = new ResizeObserver(() => {
      calculateFitTransform();
    });

    if (containerElement) {
      resizeObserver.observe(containerElement);
    }

    return () => {
      imgElement.removeEventListener('load', handleLoad);
      if (containerElement) {
        resizeObserver.unobserve(containerElement);
      }
    };
  }, [imageUrl, calculateFitTransform]);

  useEffect(() => {
    calculateFitTransform();
  }, [fitViewToggle, calculateFitTransform]);


  const getRelativeCoords = (e: MouseEvent): Coordinate | null => {
    if (!containerRef.current || !imageDimensions.width || !imageDimensions.height) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const imageX = (mouseX - transform.translateX) / transform.scale;
    const imageY = (mouseY - transform.translateY) / transform.scale;

    const relativeX = (imageX / imageDimensions.width) * 100;
    const relativeY = (imageY / imageDimensions.height) * 100;

    return [relativeX, relativeY];
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (dragState || isDrawing) return;

    const target = e.target as SVGElement;
    if (target.closest('polygon, circle, rect, g')) return;

    setIsPanning(true);
    setPanStart({
      x: e.clientX - transform.translateX,
      y: e.clientY - transform.translateY,
    });
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const coords = getRelativeCoords(e);
    if (!coords) return;

    if (dragState) {
      if (dragState.type === 'hotspotVertex' || dragState.type === 'midpoint') {
        const hotspotToUpdate = hotspots.find(h => h.id === dragState.hotspotId);
        if (!hotspotToUpdate) return;

        let newCoordinates = hotspotToUpdate.coordinates.map((coord, index) =>
          index === dragState.vertexIndex ? coords : coord
        );
        onUpdateHotspot({ ...hotspotToUpdate, coordinates: newCoordinates });
      }
    } else if (isPanning) {
      const newTranslateX = e.clientX - panStart.x;
      const newTranslateY = e.clientY - panStart.y;
      onTransformChange({ ...transform, translateX: newTranslateX, translateY: newTranslateY });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0
      ? Math.min(transform.scale * zoomFactor, 4)
      : Math.max(transform.scale / zoomFactor, 0.25);

    if (newScale === transform.scale) return;

    const imagePointX = (mouseX - transform.translateX) / transform.scale;
    const imagePointY = (mouseY - transform.translateY) / transform.scale;

    const newTranslateX = mouseX - imagePointX * newScale;
    const newTranslateY = mouseY - imagePointY * newScale;

    onTransformChange({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
  };

  const handleMapClick = (e: MouseEvent) => {
    // Don't handle clicks if the click originated from a button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('aside') || target.closest('.sidebar')) {
      return;
    }

    // Also check if the event was stopped from propagating
    if (e.defaultPrevented) {
      return;
    }

    if (!isDrawing) return;
    const coords = getRelativeCoords(e);
    if (coords) {
      onMapClick(coords);
    }
  };

  const relativeToAbsolute = (coords: Coordinate): Coordinate => {
    if (!imageDimensions.width || !imageDimensions.height) return [0, 0];
    const x = (coords[0] / 100) * imageDimensions.width;
    const y = (coords[1] / 100) * imageDimensions.height;
    return [x, y];
  };

  const getCursor = () => {
    if (isDrawing) return 'crosshair';
    if (isPanning) return 'grabbing';
    return 'grab';
  }

  const handleVertexMouseDown = (e: React.MouseEvent, hotspotId: string, vertexIndex: number) => {
    e.stopPropagation();
    if (e.altKey) { // Alt key held down
      const hotspotToUpdate = hotspots.find(h => h.id === hotspotId);
      if (hotspotToUpdate && hotspotToUpdate.type === 'polygon' && hotspotToUpdate.coordinates.length > 3) {
        const newCoordinates = hotspotToUpdate.coordinates.filter((_, i) => i !== vertexIndex);
        onUpdateHotspot({ ...hotspotToUpdate, coordinates: newCoordinates });
      }
    } else {
      setDragState({ type: 'hotspotVertex', hotspotId, vertexIndex });
    }
  };

  const renderHotspot = (hotspot: Hotspot) => {
    const isSelected = selectedHotspotId === hotspot.id;
    const isHighlighted = highlightedHotspotIds.includes(hotspot.id);

    if (hotspot.type === 'polygon') {
      return (
        <polygon
          key={hotspot.id}
          points={coordinatesToString(hotspot.coordinates.map(relativeToAbsolute))}
          fill={hotspot.color}
          fillOpacity={isHighlighted ? Math.min(1, hotspot.opacity + 0.2) : hotspot.opacity}
          stroke={isSelected ? '#3b82f6' : isHighlighted ? '#0ea5e9' : '#FFFFFF'}
          strokeWidth={(isSelected || isHighlighted ? 2 : 1) / transform.scale}
          strokeDasharray={isSelected ? `${4 / transform.scale}` : '0'}
          className="cursor-pointer transition-all duration-200"
          style={{ vectorEffect: 'non-scaling-stroke' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDrawing) {
              onHotspotClick(hotspot.id);
            }
          }}
        />
      );
    }

    if (hotspot.type === 'info' || hotspot.type === 'camera') {
      if (hotspot.coordinates.length === 0) return null;
      const absCoord = relativeToAbsolute(hotspot.coordinates[0]);
      const radius = 20 / transform.scale;
      const iconSize = 24 / transform.scale;

      return (
        <g
          key={hotspot.id}
          transform={`translate(${absCoord[0]}, ${absCoord[1]})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDrawing) {
              onHotspotClick(hotspot.id);
            }
          }}
          onMouseEnter={() => {
            if (hotspot.type === 'camera' && hotspot.linkedHotspotIds) {
              setHighlightedHotspotIds(hotspot.linkedHotspotIds);
            }
          }}
          onMouseLeave={() => {
            if (hotspot.type === 'camera') {
              setHighlightedHotspotIds([]);
            }
          }}
        >
          <circle
            r={radius}
            fill={isSelected ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.9)"}
            stroke={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.2)"}
            strokeWidth={1.5 / transform.scale}
          />
          <g transform={`translate(-${iconSize / 2}, -${iconSize / 2})`}>
            {hotspot.type === 'info' && <Icons.Info className="text-gray-800" width={iconSize} height={iconSize} />}
            {hotspot.type === 'camera' && <Icons.Camera className="text-gray-800" width={iconSize} height={iconSize} />}
          </g>
        </g>
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-hidden"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleMapClick}
      onMouseDownCapture={(e) => {
        // Prevent map interactions when clicking on buttons or sidebar
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('aside') || target.closest('.sidebar')) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onClickCapture={(e) => {
        // Also prevent in capture phase for clicks
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('aside') || target.closest('.sidebar')) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {imageUrl ? (
        <div
          className="relative"
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            willChange: 'transform'
          }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Project view"
            className="block shadow-lg"
            style={{ maxWidth: 'none', maxHeight: 'none', pointerEvents: 'none' }}
          />
          {imageDimensions.width > 0 && (
            <svg
              className="absolute top-0 left-0"
              width={imageDimensions.width}
              height={imageDimensions.height}
              style={{ pointerEvents: isPanning ? 'none' : 'auto' }}
            >
              {hotspots.map(renderHotspot)}

              {drawingPoints.length > 0 && (
                <polyline
                  points={coordinatesToString(drawingPoints.map(relativeToAbsolute))}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2 / transform.scale}
                  strokeDasharray={`${4 / transform.scale}`}
                />
              )}
              {drawingPoints.map((point, index) => {
                const absPoint = relativeToAbsolute(point);
                return (
                  <circle
                    key={index}
                    cx={absPoint[0]}
                    cy={absPoint[1]}
                    r={4 / transform.scale}
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth={2 / transform.scale}
                  />
                )
              })}

              {hotspots.map(hotspot => {
                if (selectedHotspotId === hotspot.id && !isDrawing) {
                  const renderedHandles: React.ReactNode[] = [];

                  // Render vertex handles
                  hotspot.coordinates.forEach((coord, index) => {
                    const absCoord = relativeToAbsolute(coord);
                    const isHovered = hoveredHandle?.type === 'vertex' && hoveredHandle.hotspotId === hotspot.id && hoveredHandle.index === index;
                    renderedHandles.push(
                      <circle
                        key={`${hotspot.id}-vertex-${index}`}
                        cx={absCoord[0]}
                        cy={absCoord[1]}
                        r={(isHovered ? 8 : 6) / transform.scale}
                        fill="#FFFFFF"
                        stroke="#3b82f6"
                        strokeWidth={2 / transform.scale}
                        className="cursor-move vertex-handle"
                        onMouseEnter={() => setHoveredHandle({ type: 'vertex', hotspotId: hotspot.id, index })}
                        onMouseLeave={() => setHoveredHandle(null)}
                        onMouseDown={(e) => handleVertexMouseDown(e, hotspot.id, index)}
                      />
                    );
                  });

                  // Render midpoint handles for polygons
                  if (hotspot.type === 'polygon') {
                    hotspot.coordinates.forEach((coord, index) => {
                      const nextCoord = hotspot.coordinates[(index + 1) % hotspot.coordinates.length];
                      const midpoint = getMidpoint(coord, nextCoord);
                      const absMidpoint = relativeToAbsolute(midpoint);
                      const isHovered = hoveredHandle?.type === 'midpoint' && hoveredHandle.hotspotId === hotspot.id && hoveredHandle.index === index;
                      const rectSize = isHovered ? 10 : 8;

                      renderedHandles.push(
                        <rect
                          key={`${hotspot.id}-midpoint-${index}`}
                          x={absMidpoint[0] - (rectSize / 2 / transform.scale)}
                          y={absMidpoint[1] - (rectSize / 2 / transform.scale)}
                          width={rectSize / transform.scale}
                          height={rectSize / transform.scale}
                          fill="#FFFFFF"
                          stroke="#3b82f6"
                          strokeWidth={1.5 / transform.scale}
                          className="cursor-pointer midpoint-handle"
                          onMouseEnter={() => setHoveredHandle({ type: 'midpoint', hotspotId: hotspot.id, index })}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const newPointCoords = getRelativeCoords(e as unknown as MouseEvent);
                            if (!newPointCoords) return;

                            const newCoordinates = [...hotspot.coordinates];
                            const newVertexIndex = index + 1;
                            newCoordinates.splice(newVertexIndex, 0, newPointCoords);

                            onUpdateHotspot({ ...hotspot, coordinates: newCoordinates });
                            setDragState({ type: 'midpoint', hotspotId: hotspot.id, vertexIndex: newVertexIndex });
                          }}
                        />
                      );
                    });
                  }
                  return renderedHandles;
                }
                return null;
              })}
            </svg>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold text-[#2E2E2E]">No Image Uploaded</h3>
            <p className="text-sm text-gray-500 mt-1">Please upload an image to begin mapping hotspots.</p>
          </div>
        </div>
      )}
    </div>
  );
};