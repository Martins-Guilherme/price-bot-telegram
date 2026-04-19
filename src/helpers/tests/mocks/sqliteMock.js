export default class Database {
  prepare() {
    return {
      run: () => ({ changes: 1 }),
      get: () => null,
      all: () => [],
    };
  }
}
