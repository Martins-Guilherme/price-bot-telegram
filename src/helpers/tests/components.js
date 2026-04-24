export const createFakeProduct = (overrides = {}) => ({
  title: "Produto de teste",
  price: 254.54,
  link: "http://test.com",
  image: "http://img.com",
  source: "amazon",
  ...overrides,
});

export const createFakeProducts = (count = 3) =>
  Array.from({ length: count }, (_, i) =>
    createFakeProduct({ title: `Produto ${i}`, price: i + 1 }),
  );
