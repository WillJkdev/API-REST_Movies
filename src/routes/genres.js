import { Router } from "express";
import apicache from "apicache";
import { GenresController } from "../controllers/genres.js";

export const createGenresRouter = ({ genreModelInstance }) => {
  const genresRouter = Router();
  const genresController = new GenresController({ genreModelInstance });

  // Middleware para el cache
  const cache = apicache.middleware;
  genresRouter.get("/", cache("5 minutes"), genresController.getAll);
  genresRouter.get("/:id", genresController.getById);
  genresRouter.post("/", genresController.create);
  genresRouter.patch("/:id", genresController.update);
  genresRouter.delete("/:id", genresController.delete);

  return genresRouter;
};
