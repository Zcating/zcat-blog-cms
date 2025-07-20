export function updateArray<T extends { id: unknown }>(array: T[], item: T) {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].id === item.id) {
      array[i] = item;
      break;
    }
  }
  return [...array];
}
