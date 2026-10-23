import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRatingInput({ value = 0, onChange, size = 'md' }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(index + (isHalf ? 0.5 : 1));
  };

  const currentDisplay = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[0, 1, 2, 3, 4].map(i => {
        const fillValue = currentDisplay - i;
        
        return (
          <div 
            key={i} 
            className="p-1 -m-1"
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={() => hoverValue !== null && onChange(hoverValue)}
          >
            {fillValue >= 1 ? (
              <Star className={`${sizeClasses[size]} fill-warning text-warning`} />
            ) : fillValue >= 0.5 ? (
              <StarHalf className={`${sizeClasses[size]} fill-warning text-warning`} />
            ) : (
              <Star className={`${sizeClasses[size]} text-default-300`} />
            )}
          </div>
        );
      })}
      
      <span className="ml-2 text-sm font-medium text-default-600 w-8">
        {currentDisplay > 0 ? currentDisplay.toFixed(1) : '0'}
      </span>
    </div>
  );
}
