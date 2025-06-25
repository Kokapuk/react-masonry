export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
};

export const throttle = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: T | null = null;

  return (...args: T) => {
    lastArgs = args;

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          callback(...lastArgs);
          lastArgs = null;
        }
        timeoutId = null;
      }, delay);
    }
  };
};
