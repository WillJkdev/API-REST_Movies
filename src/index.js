import { createApp } from "./app.js";
import { MovieModel } from "./models/movies.js";
import { GenreModel } from "./models/genres.js";
import { CastModel } from "./models/cast.js";
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.dev",
});

const MySQLapp = createApp({
  movieModelInstance: MovieModel,
  genreModelInstance: GenreModel,
  castModelInstance: CastModel,
});

const port = process.env.PORT || 1234;

MySQLapp.listen(port, () => {
  console.log(`Servidor corriendo en el puerto  http://localhost:${port}`);
});
