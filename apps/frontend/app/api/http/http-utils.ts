export function createQueryPath(path: string, params?: Record<string, any>) {
  if (!params) {
    return path;
  }
  const query = Object.entries(params).reduce<Record<string, any>>(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
  const queryString = new URLSearchParams(query).toString();
  if (queryString) {
    return `${path}?${queryString}`;
  }

  return path;
}
