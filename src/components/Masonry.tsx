import { memo, useCallback, useEffect, useRef, useState, type Key, type ReactElement } from 'react';

interface Props {
  children: ReactElement[];
  columns: number;
  rowGap: number;
  columnGap: number;
  cacheItemSizes?: boolean;
  itemSizesCacheKey?: Key;
}

const Masonry = ({ children, columns, rowGap, columnGap, cacheItemSizes, itemSizesCacheKey }: Props) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const [columnSortedChildren, setColumnSortedChildren] = useState<number[][]>(() =>
    Array.from({ length: columns }).map(() => [])
  );
  const cachedItemSizes = useRef<Map<Key, number>>(new Map());
  const [columnWidth, setColumnWidth] = useState(0);

  useEffect(() => {
    cachedItemSizes.current.clear();
  }, [itemSizesCacheKey, cacheItemSizes]);

  useEffect(() => {
    if (!wrapper.current) {
      return;
    }

    const referenceColumn = wrapper.current.children[0];
    setColumnWidth(referenceColumn.getBoundingClientRect().width);
  }, [columns, columnGap]);

  const recalculate = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        return;
      }

      const columnHeights = Array(columns).fill(0);
      const items = Array.from(node.children);
      const columnSortedChildren: number[][] = Array.from({ length: columns }).map(() => []);

      const getShortestColumnIndex = () => {
        let shortestColumnIndex = 0;
        let shortestColumnHeight = columnHeights[shortestColumnIndex];

        for (let j = 0; j < columnHeights.length; j++) {
          const columnHeight = columnHeights[j];

          if (columnHeights[j] < shortestColumnHeight) {
            shortestColumnHeight = columnHeight;
            shortestColumnIndex = j;
          }
        }

        return shortestColumnIndex;
      };

      for (let i = 0; i < items.length; i++) {
        const shortestColumnIndex = getShortestColumnIndex();
        columnSortedChildren[shortestColumnIndex].push(i);

        const childKey = children[i].key;

        if (!childKey) {
          throw Error('Key is required in masonry children');
        }

        const itemHeight = cachedItemSizes.current.get(childKey) ?? items[i].getBoundingClientRect().height;

        if (cacheItemSizes && !cachedItemSizes.current.has(childKey)) {
          cachedItemSizes.current.set(childKey, itemHeight);
        }

        columnHeights[shortestColumnIndex] += itemHeight + rowGap;
      }

      setColumnSortedChildren(columnSortedChildren);
    },
    [cacheItemSizes, children, columns, rowGap]
  );

  return (
    <>
      <div ref={wrapper} style={{ display: 'flex', gap: columnGap, position: 'relative', overflow: 'hidden' }}>
        {columnSortedChildren.map((column, columnIndex) => (
          <div key={columnIndex} style={{ display: 'flex', flexDirection: 'column', gap: rowGap, width: '100%' }}>
            {column.map((i) => children[i])}
          </div>
        ))}

        {!!columnWidth && (
          <div
            ref={recalculate}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: rowGap,
              width: columnWidth,
              position: 'absolute',
              visibility: 'hidden',
            }}
            inert
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(Masonry);
