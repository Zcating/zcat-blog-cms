export function createQueryPath(path: string, body?: Record<string, string>) {
  if (!body) {
    return path;
  }
  const query = Object.entries(body).reduce<Record<string, any>>(
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
