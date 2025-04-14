
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="text-2xl font-bold text-white">PORNO<span className="text-pornoretro-orange">RETRO</span>.IT</span>
    </Link>
  );
};

export default Logo;
