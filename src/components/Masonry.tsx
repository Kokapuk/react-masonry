import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';

interface Props {
  children: ReactNode[];
  columns: number;
  rowGap: number;
  columnGap: number;
}

const Masonry = ({ children, columns, rowGap, columnGap }: Props) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const [columnSortedChildren, setColumnSortedChildren] = useState<number[][]>(() =>
    Array.from({ length: columns }).map(() => [])
  );

  useLayoutEffect(() => {
    if (!wrapper.current) {
      return;
    }

    console.time('Rendered');

    const referenceColumn = wrapper.current.children[0];

    const calculationColumn = document.createElement('div');
    calculationColumn.style.position = 'fixed';
    calculationColumn.style.display = 'flex';
    calculationColumn.style.flexDirection = 'column';
    calculationColumn.style.width = `${referenceColumn.getBoundingClientRect().width}px`;
    calculationColumn.inert = true;
    calculationColumn.style.opacity = '0';
    calculationColumn.innerHTML = renderToString(children);

    document.body.append(calculationColumn);

    const columnHeights = Array(columns).fill(0);
    const items = Array.from(calculationColumn.children);
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
      columnHeights[shortestColumnIndex] += items[i].getBoundingClientRect().height + rowGap;
    }

    calculationColumn.remove();
    setColumnSortedChildren(columnSortedChildren);

    console.timeEnd('Rendered');
  }, [children, columns, rowGap]);

  return (
    <div ref={wrapper} style={{ display: 'flex', gap: columnGap }}>
      {columnSortedChildren.map((column, columnIndex) => (
        <div key={columnIndex} style={{ display: 'flex', flexDirection: 'column', gap: rowGap, width: '100%' }}>
          {column.map((itemIndex) => children[itemIndex])}
        </div>
      ))}
    </div>
  );
};

export default memo(Masonry);
