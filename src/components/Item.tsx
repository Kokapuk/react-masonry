// import { useState } from 'react';

interface Props {
  color: string;
  height: number;
  id: number;
  expanded?: boolean;
  onClick?(): void;
}

const Item = ({ color, height, id, expanded, onClick }: Props) => {
  // const [isExpanded, setExpanded] = useState(false);

  return (
    <div
      className="item"
      style={{ backgroundColor: color, height: height * (expanded ? 2 : 1) }}
      // onClick={() => setExpanded((prev) => !prev)}
      onClick={onClick}
    >
      <span className="label">#{id + 1}</span>
    </div>
  );
};

export default Item;
