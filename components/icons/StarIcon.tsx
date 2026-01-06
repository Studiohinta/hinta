import React from 'react';

export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.321h5.365c.527 0 .745.714.362 1.011l-4.33 3.162a.563.563 0 0 0-.178.643l2.125 5.111a.563.563 0 0 1-.84.622l-4.33-3.162a.563.563 0 0 0-.671 0l-4.33 3.162a.563.563 0 0 1-.84-.622l2.125-5.111a.563.563 0 0 0-.178-.643l-4.33-3.162a.563.563 0 0 1 .362-1.011h5.365a.563.563 0 0 0 .475-.321l2.125-5.111Z"
    />
  </svg>
);