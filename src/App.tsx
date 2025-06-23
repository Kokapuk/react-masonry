import { useEffect, useState } from 'react';
import './App.css';
import Item from './components/Item';
import Masonry from './components/Masonry';
import { getRandomColor } from './utils';

interface Item {
  id: number;
  color: string;
  height: number;
}

const PER_PAGE = 25;

const App = () => {
  const [items, setItems] = useState<Item[]>(() =>
    Array.from({ length: PER_PAGE }).map(
      (_, index) => ({ id: index, color: getRandomColor(), height: Math.random() * 200 + 50 } as Item)
    )
  );
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        event.preventDefault();

        setItems((prev) => [
          ...prev,
          ...Array.from({ length: PER_PAGE }).map(
            (_, index) =>
              ({ id: index + prev.length, color: getRandomColor(), height: Math.random() * 200 + 50 } as Item)
          ),
        ]);
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div style={{ width: 750, marginInline: 'auto', paddingBlock: 50 }}>
      <h1 style={{ width: 'fit-content', margin: '0 auto 25px auto' }}>Press Alt to append items</h1>
      <Masonry columns={3} rowGap={30} columnGap={30} cacheItemSizes>
        {items.map((i) => (
          <Item
            key={i.id}
            {...i}
            expanded={expandedItemIndex === i.id}
            onClick={() => setExpandedItemIndex((prev) => (prev === i.id ? null : i.id))}
          />
        ))}
      </Masonry>
    </div>
  );
};

export default App;
