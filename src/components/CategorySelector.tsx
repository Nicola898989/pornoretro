
import React from 'react';
import { CardType } from '@/types/retro';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreVertical, Flame, ThumbsDown, HeartHandshake, ArrowRightLeft } from 'lucide-react';

interface CategorySelectorProps {
  currentType: CardType;
  onChangeCategory: (newType: CardType) => void;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentType,
  onChangeCategory,
  disabled = false
}) => {
  const categories = [
    { type: 'hot' as CardType, label: 'Hot Moments', icon: Flame, color: 'text-green-500' },
    { type: 'disappointment' as CardType, label: 'Disappointments', icon: ThumbsDown, color: 'text-red-500' },
    { type: 'fantasy' as CardType, label: 'Team Fantasy', icon: HeartHandshake, color: 'text-pornoretro-orange' }
  ];

  const handleCategoryChange = (newType: CardType) => {
    if (newType !== currentType) {
      onChangeCategory(newType);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-pornoretro-orange"
          disabled={disabled}
        >
          <ArrowRightLeft className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-pornoretro-black border-pornoretro-orange/30 z-50"
      >
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isCurrentCategory = category.type === currentType;
          
          return (
            <DropdownMenuItem
              key={category.type}
              onClick={() => handleCategoryChange(category.type)}
              disabled={isCurrentCategory}
              className={`flex items-center gap-2 ${isCurrentCategory ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/20'}`}
            >
              <IconComponent className={`h-4 w-4 ${category.color}`} />
              <span className="text-white">
                {category.label}
                {isCurrentCategory && ' (attuale)'}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategorySelector;
