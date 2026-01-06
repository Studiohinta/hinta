
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    pannellum: any;
  }
}

interface PanoramaViewerProps {
  url: string;
  title?: string;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ url, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && window.pannellum) {
      // Destroy previous instance if it exists
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn("Pannellum destroy failed", e);
        }
      }

      viewerRef.current = window.pannellum.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: url,
        autoLoad: true,
        title: title || '',
        author: 'Hinta',
        compass: true,
        hfov: 110,
        vaov: 180,
      });
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [url, title]);

  return (
    <div className="w-full h-full flex flex-col">
        <div ref={containerRef} className="flex-1 w-full h-full bg-black rounded-xl overflow-hidden" />
    </div>
  );
};
