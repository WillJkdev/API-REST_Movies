import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { jsonErrorHandler } from "./middlewares/jsonErrorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { createMoviesRouter } from "./routes/movies.js";
import { createGenresRouter } from "./routes/genres.js";
import { createCastRouter } from "./routes/cast.js";

// Función para crear una instancia de Express
export const createApp = ({
  movieModelInstance,
  genreModelInstance,
  castModelInstance,
}) => {
  if (!movieModelInstance || !genreModelInstance || !castModelInstance) {
    throw new Error("All model instances must be provided");
  }

  const app = express();

  app.use(express.json({ limit: "5mb" })); // Analizar JSON (5MB maximum)
  app.use(jsonErrorHandler); // Capturar errores de JSON
  app.use(corsMiddleware()); // Habilitar CORS
  app.disable("x-powered-by"); // Deshabilitar la cabecera X-Powered-By

  app.use("/movies", createMoviesRouter({ movieModelInstance }));
  app.use("/genres", createGenresRouter({ genreModelInstance }));
  app.use("/cast", createCastRouter({ castModelInstance }));

  // Middleware para manejar rutas no existentes (404)
  app.use(notFoundHandler);

  // Middleware para manejar errores generales (500)
  app.use(errorHandler);
  return app;
};
