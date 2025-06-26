import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Item from './components/Item';
import Masonry from './components/Masonry';
import { getRandomColor } from './utils';

interface Item {
  id: number;
  color: string;
  height: number;
}

const PER_PAGE = 5000;

const App = () => {
  const [items, setItems] = useState<Item[]>(() =>
    Array.from({ length: PER_PAGE }).map(
      (_, index) => ({ id: index, color: getRandomColor(), height: Math.random() * 200 + 50 } as Item)
    )
  );
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(3);
  const [scrollArea, setScrollArea] = useState<HTMLElement | null>(null);

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

  const handleItemClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const id = +(event.currentTarget.dataset.id as string);
    setExpandedItemIndex((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div
      ref={setScrollArea}
      style={{ width: 750, marginInline: 'auto', paddingBlock: 50, maxHeight: '100vh', overflow: 'auto' }}
    >
      <h1 style={{ width: 'fit-content', margin: '0 auto 25px auto' }}>Press Alt to append items</h1>
      <input
        type="number"
        value={columns}
        onChange={(e) => setColumns(e.currentTarget.valueAsNumber)}
        style={{ position: 'sticky', top: 0, zIndex: 500 }}
      />
      <Masonry columns={columns} rowGap={30} columnGap={30} virtualizedViewportTarget={scrollArea}>
        {items.map((i) => (
          <Item key={i.id} {...i} expanded={expandedItemIndex === i.id} onClick={handleItemClick} />
        ))}
      </Masonry>
    </div>
  );
};

export default App;
