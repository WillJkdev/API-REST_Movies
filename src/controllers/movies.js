import { validateMovie, validatePartialMovie } from "../schemas/movies.js";
import apicache from "apicache";
const cache = apicache;

export class MoviesController {
  constructor({ movieModelInstance }) {
    this.movieModel = movieModelInstance;
  }
  getAll = async (req, res) => {
    try {
      const {
        genre,
        cast,
        year,
        title,
        rate,
        page = "1",
        limit = "30",
      } = req.query;

      // Validar que page y limit sean números enteros positivos
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);

      if (
        isNaN(parsedPage) ||
        parsedPage <= 0 ||
        isNaN(parsedLimit) ||
        parsedLimit <= 0 ||
        parsedLimit > 100 // Limitar el número máximo de resultados por página
      ) {
        return res.status(400).json({
          error:
            "Invalid 'page' or 'limit' parameter. Ensure 'page' is a positive number and 'limit' is between 1 and 100.",
        });
      }

      // Construir los filtros dinámicamente
      const filters = {
        genre,
        cast,
        year: year ? parseInt(year, 10) : undefined,
        title,
        rate: rate ? parseFloat(rate) : undefined,
        page: parsedPage,
        limit: parsedLimit,
      };

      // Obtener datos paginados desde el modelo
      const movies = await this.movieModel.getAll(filters);

      // Calcular el total de resultados con los filtros aplicados
      const totalResults = await this.movieModel.count(filters);

      // Calcular el total de páginas
      const totalPages = Math.ceil(totalResults / parsedLimit);

      // Verificar si no hay resultados
      if (totalResults === 0) {
        return res.status(404).json({
          message: "No movies found matching the filters.",
          data: [],
        });
      }

      // Verificar si la página solicitada excede el número de páginas disponibles
      if (parsedPage > totalPages) {
        return res.status(400).json({
          error: `Page number exceeds total pages. Total pages: ${totalPages}`,
        });
      }

      // Responder con datos y metadatos de paginación
      return res.json({
        page: parsedPage,
        limit: parsedLimit,
        totalResults,
        totalPages,
        data: movies,
      });
    } catch (error) {
      console.error("Error fetching movies:", error);
      return res.status(500).json({ message: "Error fetching movies" });
    }
  };

  getById = async (req, res) => {
    const { id } = req.params;
    const result = await this.movieModel.getById({ id });
    if (result.success === false) {
      return res.status(404).json(result);
    } else {
      return res.json(result);
    }
  };

  create = async (req, res) => {
    const result = validateMovie(req.body);
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }
    const newMovie = await this.movieModel.create({ input: result.data });
    if (newMovie.success === false) {
      return res.status(400).json(newMovie);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.status(201).json(newMovie);
  };

  update = async (req, res) => {
    const result = validatePartialMovie(req.body);
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }
    const { id } = req.params;
    const updatedMovie = await this.movieModel.update({
      id,
      input: result.data,
    });
    if (updatedMovie.success === false) {
      return res.status(404).json(updatedMovie);
    }
    // Invalida el caché después de actualizar una película
    cache.clear("/movies");
    return res.json(updatedMovie);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const result = await this.movieModel.delete({ id });
    if (result.success === false) {
      return res.status(404).json(result);
    }
    // Invalida el caché después de actualizar una película
    cache.clear("/movies");
    return res.json(result);
  };
}
