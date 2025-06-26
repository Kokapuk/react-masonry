import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Key,
  type ReactElement,
} from 'react';
import { throttle } from '../utils';

interface Props {
  children: ReactElement[];
  columns: number;
  rowGap: number;
  columnGap: number;
  cacheItemSizes?: boolean;
  itemSizesCacheDeps?: DependencyList;
  virtualizedViewportTarget?: HTMLElement | null;
  virtualizedViewportThreshold?: number;
  virtualizedUpdateThrottle?: number;
}

interface ColumnItemData {
  itemIndex: number;
  height: number;
  top: number;
  visible?: boolean;
}

const Masonry = ({
  children,
  columns,
  rowGap,
  columnGap,
  cacheItemSizes,
  itemSizesCacheDeps,
  virtualizedViewportTarget,
  virtualizedViewportThreshold = 500,
  virtualizedUpdateThrottle = 100,
}: Props) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const [columnSortedChildren, setColumnSortedChildren] = useState<ColumnItemData[][]>(() =>
    Array.from({ length: columns }).map(() => [])
  );
  const columnSortedChildrenRef = useRef(columnSortedChildren);
  const cachedItemSizes = useRef<Map<Key, number>>(new Map());
  const [columnTopFillers, setColumnTopFillers] = useState(() => Array.from({ length: columns }).map(() => 0));
  const [columnBottomFillers, setColumnBottomFillers] = useState(() => Array.from({ length: columns }).map(() => 0));
  const calculationColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cachedItemSizes.current.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheItemSizes, ...(itemSizesCacheDeps ?? [])]);

  const recalculateVirtualization = useCallback(
    (columnSortedChildren: ColumnItemData[][]) => {
      if (!virtualizedViewportTarget) {
        setColumnTopFillers((prev) => prev.map(() => 0));
        setColumnBottomFillers((prev) => prev.map(() => 0));
        return columnSortedChildren.map((column) => column.map((item) => ({ ...item, visible: true })));
      }

      const virtualizedHeight = virtualizedViewportTarget.getBoundingClientRect().height;

      return columnSortedChildren.map((column, columnIndex) => {
        const newColumn = column.map((item) => {
          let visible = false;

          if (
            item.top + item.height - virtualizedViewportTarget.scrollTop > -virtualizedViewportThreshold &&
            virtualizedHeight - (item.top - virtualizedViewportTarget.scrollTop) > -virtualizedViewportThreshold
          ) {
            visible = true;
          }

          return { ...item, visible };
        });

        const columnTopHiddenChildren: ColumnItemData[] = [];
        const columnBottomHiddenChildren: ColumnItemData[] = [];
        let top = true;

        for (const item of newColumn) {
          if (item.visible) {
            top = false;
            continue;
          }

          if (top) {
            columnTopHiddenChildren.push(item);
          } else {
            columnBottomHiddenChildren.push(item);
          }
        }

        setColumnTopFillers((prev) => {
          const prevCopy = [...prev];
          prevCopy[columnIndex] = Math.max(
            columnTopHiddenChildren.reduce((acc, val) => acc + val.height + rowGap, 0) - rowGap,
            0
          );

          return prevCopy;
        });
        setColumnBottomFillers((prev) => {
          const prevCopy = [...prev];
          prevCopy[columnIndex] = Math.max(
            columnBottomHiddenChildren.reduce((acc, val) => acc + val.height + rowGap, 0) - rowGap,
            0
          );

          return prevCopy;
        });

        return newColumn;
      });
    },
    [rowGap, virtualizedViewportTarget, virtualizedViewportThreshold]
  );

  useEffect(() => {
    columnSortedChildrenRef.current = columnSortedChildren;
  }, [columnSortedChildren]);

  useEffect(() => {
    if (!virtualizedViewportTarget) {
      return;
    }

    const handleScroll = throttle(
      () => setColumnSortedChildren(recalculateVirtualization(columnSortedChildrenRef.current)),
      virtualizedUpdateThrottle
    );

    virtualizedViewportTarget.addEventListener('scroll', handleScroll);

    return () => {
      virtualizedViewportTarget.addEventListener('scroll', handleScroll);
    };
  }, [recalculateVirtualization, virtualizedViewportTarget, virtualizedUpdateThrottle]);

  const recalculate = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !wrapper.current) {
        return;
      }

      const columnHeights = Array(columns).fill(0);
      const items = Array.from(node.children);
      const columnSortedChildren: ColumnItemData[][] = Array.from({ length: columns }).map(() => []);

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

      const wrapperTop =
        wrapper.current.getBoundingClientRect().top -
        (virtualizedViewportTarget?.getBoundingClientRect().top ?? 0) +
        (virtualizedViewportTarget?.scrollTop ?? 0);
      console.log(wrapperTop);

      for (let i = 0; i < items.length; i++) {
        const shortestColumnIndex = getShortestColumnIndex();

        const childKey = children[i].key;

        if (!childKey) {
          throw Error('Key is required in masonry children');
        }

        const itemHeight = cachedItemSizes.current.get(childKey) ?? items[i].getBoundingClientRect().height;
        const shortestColumn = columnSortedChildren[shortestColumnIndex];
        const previousItem = shortestColumn[shortestColumn.length - 1] as ColumnItemData | null;

        shortestColumn.push({
          itemIndex: i,
          height: itemHeight,
          top: previousItem ? previousItem.top + previousItem.height + rowGap : wrapperTop,
        });

        if (cacheItemSizes && !cachedItemSizes.current.has(childKey)) {
          cachedItemSizes.current.set(childKey, itemHeight);
        }

        columnHeights[shortestColumnIndex] += itemHeight + rowGap;
      }

      setColumnSortedChildren(recalculateVirtualization(columnSortedChildren));
    },
    [cacheItemSizes, children, columns, recalculateVirtualization, rowGap, virtualizedViewportTarget]
  );

  useEffect(() => {
    if (!calculationColumnRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      recalculate(calculationColumnRef.current);
    });

    observer.observe(calculationColumnRef.current);

    return () => {
      observer.disconnect();
    };
  }, [recalculate]);

  return (
    <>
      <div ref={wrapper} style={{ display: 'flex', gap: columnGap, position: 'relative', overflow: 'hidden' }}>
        {columnSortedChildren.map((column, columnIndex) => (
          <div
            key={columnIndex}
            style={{ display: 'flex', flexDirection: 'column', gap: rowGap, width: '100%', position: 'relative' }}
          >
            <>
              {!!columnTopFillers[columnIndex] && <div style={{ height: columnTopFillers[columnIndex] }} />}
              {column.filter((i) => i.visible).map((i) => children[i.itemIndex])}
              {!!columnBottomFillers[columnIndex] && <div style={{ height: columnBottomFillers[columnIndex] }} />}

              {columnIndex === 0 && (
                <div
                  ref={calculationColumnRef}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: rowGap,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    visibility: 'hidden',
                  }}
                  inert
                >
                  {children}
                </div>
              )}
            </>
          </div>
        ))}
      </div>
    </>
  );
};

export default memo(Masonry);
