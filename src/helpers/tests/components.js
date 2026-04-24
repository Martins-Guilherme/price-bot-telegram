export const createFakeProduct = (overides = {}) => ({
  title: "Produto de teste",
  price: 254.54,
  link: "http://test.com",
  image: "http://img.com",
  sourece: "amazon",
  ...overides,
});

// Creates an array from an array-like object.
export const createFakeProducts = (n = 3) =>
  Array.from({ length }, (_, i) => {
    createFakeProduct({ title: `Produto ${i}`, price: i + 1 });
  });
