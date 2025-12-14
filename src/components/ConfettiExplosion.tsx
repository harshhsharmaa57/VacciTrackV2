import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface ConfettiExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
}

const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({ trigger, onComplete }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isActive) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.3}
      colors={['#0d9488', '#6366f1', '#f59e0b', '#10b981', '#f43f5e']}
    />
  );
};

export default ConfettiExplosion;
