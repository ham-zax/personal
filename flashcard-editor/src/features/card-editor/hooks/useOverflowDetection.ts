import { useEffect, useRef, useState } from 'react';

export const useOverflowDetection = (
  dependencies: unknown[] = []
): [React.RefObject<HTMLDivElement>, boolean] => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const element = contentRef.current;
      if (!element) return;

      const isContentOverflowing =
        element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth;

      setIsOverflowing(isContentOverflowing);
    };

    // Check immediately
    checkOverflow();

    // Setup resize observer
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Cleanup
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [contentRef, ...dependencies]);

  return [contentRef, isOverflowing];
};
