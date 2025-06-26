import { memo, type Ref } from 'react';

interface Props {
  color: string;
  height: number;
  id: number;
  expanded?: boolean;
  onClick?(event: React.MouseEvent<HTMLDivElement>): void;
  ref?: Ref<HTMLDivElement>;
}

const Item = ({ color, height, id, expanded, onClick, ref }: Props) => {
  return (
    <div
      ref={ref}
      className="item"
      style={{ backgroundColor: color, height: height * (expanded ? 2 : 1) }}
      onClick={onClick}
      data-id={id}
    >
      <span className="label">#{id}</span>
    </div>
  );
};

export default memo(Item);
