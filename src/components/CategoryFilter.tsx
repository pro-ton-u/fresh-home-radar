
import React from 'react';
import { Button } from "@/components/ui/button";
import { useFoodInventory } from '@/contexts/FoodInventoryContext';

const CategoryFilter = () => {
  const { selectedCategory, setSelectedCategory } = useFoodInventory();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        onClick={() => setSelectedCategory('all')}
        variant={selectedCategory === 'all' ? "default" : "outline"}
        className="flex-1 min-w-[80px]"
      >
        All
      </Button>
      
      <Button
        onClick={() => setSelectedCategory('fruits')}
        variant={selectedCategory === 'fruits' ? "default" : "outline"}
        className="flex-1 min-w-[80px] bg-category-fruits text-black hover:text-black hover:bg-category-fruits/90"
        style={{ 
          backgroundColor: selectedCategory === 'fruits' ? 'var(--category-fruits, #FDE1D3)' : '',
          color: 'black',
          borderColor: '#FDE1D3'
        }}
      >
        Fruits
      </Button>
      
      <Button
        onClick={() => setSelectedCategory('vegetables')}
        variant={selectedCategory === 'vegetables' ? "default" : "outline"}
        className="flex-1 min-w-[80px] bg-category-vegetables text-black hover:text-black hover:bg-category-vegetables/90"
        style={{ 
          backgroundColor: selectedCategory === 'vegetables' ? 'var(--category-vegetables, #F2FCE2)' : '',
          color: 'black',
          borderColor: '#F2FCE2'
        }}
      >
        Vegetables
      </Button>
      
      <Button
        onClick={() => setSelectedCategory('dairy')}
        variant={selectedCategory === 'dairy' ? "default" : "outline"}
        className="flex-1 min-w-[80px] bg-category-dairy text-black hover:text-black hover:bg-category-dairy/90"
        style={{ 
          backgroundColor: selectedCategory === 'dairy' ? 'var(--category-dairy, #D3E4FD)' : '',
          color: 'black',
          borderColor: '#D3E4FD'
        }}
      >
        Dairy
      </Button>
      
      <Button
        onClick={() => setSelectedCategory('packed')}
        variant={selectedCategory === 'packed' ? "default" : "outline"}
        className="flex-1 min-w-[80px] bg-category-packed text-black hover:text-black hover:bg-category-packed/90"
        style={{ 
          backgroundColor: selectedCategory === 'packed' ? 'var(--category-packed, #FEF7CD)' : '',
          color: 'black',
          borderColor: '#FEF7CD'
        }}
      >
        Packed
      </Button>
    </div>
  );
};

export default CategoryFilter;
