import { validateCast } from "../schemas/cast.js";
import apicache from "apicache";
const cache = apicache;

export class CastController {
  constructor({ castModelInstance }) {
    this.castModel = castModelInstance;
  }

  // Obtener todos los miembros del reparto con filtros (nombre, etc.)
  getAll = async (req, res) => {
    try {
      const { name, page = "1", limit = "30" } = req.query;

      // Construir filtros dinámicamente
      const filters = {};
      if (name) {
        filters.name = name; // Filtro por nombre
      }

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

      // Obtener datos paginados desde el modelo, con filtros si existen
      const castMembers = await this.castModel.getAll({
        filters, // Pasamos los filtros a la función
        page: parsedPage,
        limit: parsedLimit,
      });

      // Calcular el total de resultados con los filtros aplicados
      const totalResults = await this.castModel.count(filters);

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
        data: castMembers,
      });
    } catch (error) {
      console.error("Error fetching cast members:", error);
      return res.status(500).json({ message: "Error fetching cast members" });
    }
  };

  // Obtener un miembro del reparto por su ID
  getById = async (req, res) => {
    const { id } = req.params;
    const result = await this.castModel.getById({ id });

    if (result.success === false) {
      return res.status(404).json(result);
    }

    return res.json(result);
  };

  // Crear un nuevo miembro del reparto
  create = async (req, res) => {
    const result = validateCast(req.body);
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const newCastMember = await this.castModel.create({ input: result.data });

    if (newCastMember.success === false) {
      return res.status(400).json(newCastMember);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.status(201).json(newCastMember);
  };

  // Actualizar un miembro del reparto
  update = async (req, res) => {
    const { id } = req.params;
    const result = validateCast(req.body); // Validar el objeto completo
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const updatedCastMember = await this.castModel.update({
      id,
      input: result.data,
    });

    if (updatedCastMember.success === false) {
      return res.status(404).json(updatedCastMember);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.json(updatedCastMember);
  };

  // Eliminar un miembro del reparto
  delete = async (req, res) => {
    const { id } = req.params;
    const result = await this.castModel.delete({ id });

    if (result.success === false) {
      return res.status(404).json(result);
    }
    // Invalida el caché después de crear una película
    cache.clear("/movies");
    return res.json(result);
  };
}
