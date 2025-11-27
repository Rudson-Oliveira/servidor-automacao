import { useEffect, useRef } from 'react';

/**
 * Hook de debugging para identificar quais props causaram re-render
 * 
 * @example
 * ```tsx
 * function MyComponent(props) {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}
