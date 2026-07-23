function getRandomArrayElement<Element>(array: Element[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export default getRandomArrayElement;
