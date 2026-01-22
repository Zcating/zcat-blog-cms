import React from 'react';

export function useAsync<T>(
  initialValue: T | (() => T),
  fn: () => Promise<T>,
  deps: React.DependencyList,
): [T, boolean, Error | null] {
  const [data, setData] = React.useState<T>(initialValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fn()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [data, loading, error];
}
