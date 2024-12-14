import { Router } from "express";
import apicache from "apicache";
import { CastController } from "../controllers/cast.js";

export const createCastRouter = ({ castModelInstance }) => {
  const castRouter = Router();
  const castController = new CastController({ castModelInstance });

  // Middleware para el cache
  const cache = apicache.middleware;
  castRouter.get("/", cache("5 minutes"), castController.getAll);
  castRouter.get("/:id", castController.getById);
  castRouter.post("/", castController.create);
  castRouter.patch("/:id", castController.update);
  castRouter.delete("/:id", castController.delete);

  return castRouter;
};
