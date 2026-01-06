import React from 'react';

export const CompassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9 9 2.121 5.121a.5.5 0 0 0 .758.219L15 12l-2.121-5.121a.5.5 0 0 0-.758-.219L9 9Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 12V3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      transform-origin="center"
    >
        <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="10s"
            repeatCount="indefinite"
        />
    </path>
     <text x="12" y="5" textAnchor="middle" fontSize="3" fill="currentColor" fontWeight="bold">N</text>
  </svg>
);