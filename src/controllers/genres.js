import { validateGenre } from "../schemas/genres.js";
import apicache from "apicache";
const cache = apicache;

export class GenresController {
  constructor({ genreModelInstance }) {
    this.genreModel = genreModelInstance;
  }

  // Obtener todos los géneros con filtro por nombre
  getAll = async (req, res) => {
    try {
      const { name } = req.query;

      // Construir filtros dinámicamente
      const filters = {};
      if (name) {
        filters.name = name;
      }

      // Obtener los géneros, filtrados si es necesario
      const genres = await this.genreModel.getAll(filters);

      return res.json({ data: genres });
    } catch (error) {
      console.error("Error fetching genres:", error);
      return res.status(500).json({ message: "Error fetching genres" });
    }
  };

  // Obtener un género por su ID
  getById = async (req, res) => {
    const { id } = req.params;
    const result = await this.genreModel.getById({ id });

    if (result.success === false) {
      return res.status(404).json(result);
    }

    return res.json(result);
  };

  // Crear un nuevo género
  create = async (req, res) => {
    const result = validateGenre(req.body);
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const newGenre = await this.genreModel.create({ input: result.data });

    if (newGenre.success === false) {
      return res.status(400).json(newGenre);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.status(201).json(newGenre);
  };

  // Actualizar un género
  update = async (req, res) => {
    const { id } = req.params;
    const result = validateGenre(req.body); // Se puede usar el mismo validador si se quiere validar el objeto completo
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const updatedGenre = await this.genreModel.update({
      id,
      input: result.data,
    });

    if (updatedGenre.success === false) {
      return res.status(404).json(updatedGenre);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.json(updatedGenre);
  };

  // Eliminar un género
  delete = async (req, res) => {
    const { id } = req.params;
    const result = await this.genreModel.delete({ id });

    if (result.success === false) {
      return res.status(404).json(result);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.json(result);
  };
}
