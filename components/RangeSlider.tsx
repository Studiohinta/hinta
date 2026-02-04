import React, { useState, useEffect, useRef } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatLabel?: (value: number) => string;
    className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    formatLabel,
    className = ''
}) => {
    const [minVal, setMinVal] = useState(value[0]);
    const [maxVal, setMaxVal] = useState(value[1]);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

    // Update local state when props change
    useEffect(() => {
        setMinVal(value[0]);
        setMaxVal(value[1]);
    }, [value]);

    // Update range background
    useEffect(() => {
        if (range.current) {
            const minPercent = getPercent(minVal);
            const maxPercent = getPercent(maxVal);

            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, maxVal, min, max]);

    // Handle drag/change
    const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(event.target.value), maxVal - step);
        setMinVal(value);
        onChange([value, maxVal]);
    };

    const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(event.target.value), minVal + step);
        setMaxVal(value);
        onChange([minVal, value]);
    };

    return (
        <div className={`container ${className}`}>
            <div className="relative w-full h-8 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minVal}
                    onChange={handleMinChange}
                    className="thumb thumb--left"
                    style={{ zIndex: minVal > max - 100 ? 5 : undefined }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxVal}
                    onChange={handleMaxChange}
                    className="thumb thumb--right"
                />

                <div className="slider relative w-full">
                    <div className="slider__track absolute rounded-full bg-gray-200 dark:bg-gray-700 h-1.5 w-full z-0" />
                    <div
                        ref={range}
                        className="slider__range absolute rounded-full bg-black dark:bg-white h-1.5 z-10"
                    />
                </div>
            </div>

            {/* Labels below */}
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatLabel ? formatLabel(minVal) : minVal}</span>
                <span>{formatLabel ? formatLabel(maxVal) : maxVal}</span>
            </div>

            <style>{`
        .thumb {
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
          z-index: 3;
        }

        .thumb::-webkit-slider-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          -webkit-appearance: none;
          background-color: white;
          border: 2px solid currentColor;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Dark mode overrides if parent has dark class or system preference, 
           but simplifying here by using currentColor which inherits from text-black/white wrapper possibly */
        .thumb::-webkit-slider-thumb:hover {
           transform: scale(1.1);
        }

        .thumb--left {
          z-index: 4;
        }

        .thumb--right {
          z-index: 5;
        }
      `}</style>
        </div>
    );
};
