import { Router } from "express";
import apicache from "apicache";
import { MoviesController } from "../controllers/movies.js";

export const createMoviesRouter = ({ movieModelInstance }) => {
  const moviesRouter = Router();
  const moviesController = new MoviesController({ movieModelInstance });

  // Middleware para el cache
  const cache = apicache.middleware;
  moviesRouter.get("/", cache("5 minutes"), moviesController.getAll);
  moviesRouter.post("/", moviesController.create);

  moviesRouter.get("/:id", moviesController.getById);
  moviesRouter.patch("/:id", moviesController.update);
  moviesRouter.delete("/:id", moviesController.delete);

  return moviesRouter;
};
