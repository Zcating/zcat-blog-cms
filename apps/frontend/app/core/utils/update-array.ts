function defaultKeyFrom<T>(item: T) {
  return (item as { id: string | number | symbol }).id;
}

export function updateArray<T>(
  array: T[],
  itemOrItems: T | T[],
  keyFrom: (item: T) => string | number | symbol = defaultKeyFrom,
) {
  const updatedArray = [...array];
  const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
  for (const item of items) {
    const itemKey = keyFrom(item);
    let hasUpdate = false;
    for (let i = 0; i < array.length; i += 1) {
      if (keyFrom(array[i]) === itemKey) {
        updatedArray[i] = item;
        hasUpdate = true;
        break;
      }
    }

    if (!hasUpdate) {
      updatedArray.splice(0, 0, item);
    }
  }

  return updatedArray;
}

export function removeArray<T>(
  array: T[],
  item: T,
  keyFrom: (item: T) => string | number | symbol = defaultKeyFrom,
) {
  const itemKey = keyFrom(item);
  return array.filter((p) => keyFrom(p) !== itemKey);
}
