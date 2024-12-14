import { createApp } from "../src/app.js"; // assuming the function is in app.js

describe("createApp", () => {
  it("throws an error when any of the model instances are missing", () => {
    expect(() => createApp({})).toThrowError(
      "All model instances must be provided"
    );
    expect(() => createApp({ movieModelInstance: {} })).toThrowError(
      "All model instances must be provided"
    );
    expect(() =>
      createApp({ movieModelInstance: {}, genreModelInstance: {} })
    ).toThrowError("All model instances must be provided");
  });

  it("returns an Express-like instance when all model instances are provided", () => {
    const movieModelInstance = {};
    const genreModelInstance = {};
    const castModelInstance = {};
    const app = createApp({
      movieModelInstance,
      genreModelInstance,
      castModelInstance,
    });
    // Check for typical Express application methods
    expect(typeof app.listen).toBe("function");
  });

  it("configures the Express instance with the correct middleware and routes", () => {
    const movieModelInstance = {};
    const genreModelInstance = {};
    const castModelInstance = {};
    const app = createApp({
      movieModelInstance,
      genreModelInstance,
      castModelInstance,
    });

    expect(app._router.stack.length).toBeGreaterThan(0); // Verifica que se configuraron rutas
    expect(
      app._router.stack.some((layer) => layer.name === "jsonErrorHandler")
    ).toBe(true); // Verifica que jsonErrorHandler está configurado
    expect(
      app._router.stack.some((layer) => layer.name === "corsMiddleware")
    ).toBe(true); // Verifica que corsMiddleware está configurado
    expect(
      app._router.stack.some((layer) => layer.name === "notFoundHandler")
    ).toBe(true); // Verifica que notFoundHandler está configurado
    expect(
      app._router.stack.some((layer) => layer.name === "errorHandler")
    ).toBe(true); // Verifica que errorHandler está configurado
  });
});
