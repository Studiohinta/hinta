import React from 'react';

export const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}>
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9 6.75V15m6-6v8.25m.5-10.5h-7a.5.5 0 0 0-.5.5v12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4.75a.5.5 0 0 0-.5-.5Z" />
    </svg>
);