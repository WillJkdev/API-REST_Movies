import pool from "../config/dbConfig.js";

if (!pool) {
  console.error("Database pool is not initialized.");
  throw new Error("Failed to initialize database pool.");
}
export class MovieModel {
  static async getAll({
    genre,
    cast,
    year,
    title,
    rate,
    page = 1,
    limit = 30,
  }) {
    const connection = await pool.getConnection();
    try {
      const safeLimit = parseInt(limit, 10) || 30;
      const safePage = parseInt(page, 10) || 1;
      const offset = (safePage - 1) * safeLimit;

      // Construir filtros dinámicamente
      const filters = [];
      const queryParams = [];

      if (genre) {
        filters.push(`
          m.id IN (
            SELECT movie_id FROM movie_genres
            JOIN genre ON movie_genres.genre_id = genre.id
            WHERE LOWER(genre.name) = ?
          )
        `);
        queryParams.push(genre.toLowerCase());
      }

      if (cast) {
        filters.push(`
          m.id IN (
            SELECT movie_id FROM movie_cast
            JOIN cast ON movie_cast.cast_id = cast.id
            WHERE LOWER(cast.name) = ?
          )
        `);
        queryParams.push(cast.toLowerCase());
      }

      if (year) {
        filters.push(`m.year = ?`);
        queryParams.push(year);
      }

      if (title) {
        filters.push(`m.title LIKE ?`);
        queryParams.push(`%${title}%`);
      }

      if (rate) {
        filters.push(`m.rate >= ?`);
        queryParams.push(rate);
      }

      const whereClause =
        filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

      // Construir la consulta final
      const query = `
        SELECT 
            BIN_TO_UUID(m.id) AS id,
            m.title, 
            m.year, 
            COALESCE(
                (
                    SELECT GROUP_CONCAT(DISTINCT g.name ORDER BY g.name ASC SEPARATOR ', ')
                    FROM genre g
                    JOIN movie_genres mg ON g.id = mg.genre_id
                    WHERE mg.movie_id = m.id
                ),
                ''
            ) AS genres,
            COALESCE(
                (
                    SELECT GROUP_CONCAT(DISTINCT c.name ORDER BY c.name ASC SEPARATOR ', ')
                    FROM cast c
                    JOIN movie_cast mc ON c.id = mc.cast_id
                    WHERE mc.movie_id = m.id
                ),
                ''
            ) AS cast,
            m.extract,
            m.rate, 
            m.thumbnail,
            m.thumbnail_width, 
            m.thumbnail_height,
            m.href 
        FROM movie m
        ${whereClause}
        LIMIT ? OFFSET ?;
      `;

      queryParams.push(safeLimit, offset);
      // Ejecutar la consulta
      const [movies] = await connection.query(query, queryParams);
      return movies;
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      throw new Error("Unable to fetch movies. Please try again later.");
    } finally {
      connection.release();
    }
  }

  static async getById({ id }) {
    // Validar que el ID tenga el formato correcto de un UUID
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      console.error(
        "El ID proporcionado no tiene un formato válido de UUID:",
        id
      );
      return { error: "El ID proporcionado no es válido.", success: false };
    }

    const connection = await pool.getConnection(); // Obtener conexión del pool
    try {
      // Ejecutar consulta para buscar la película
      const [movies] = await connection.query(
        `SELECT 
          BIN_TO_UUID(m.id) AS id, 
          m.title, 
          m.year, 
          m.extract, 
          GROUP_CONCAT(
            DISTINCT g.name 
            ORDER BY 
              g.name ASC SEPARATOR ', '
          ) AS genres,
            GROUP_CONCAT(
            DISTINCT c.name 
            ORDER BY 
              c.name ASC SEPARATOR ', '
          ) AS cast,
          m.rate,
          m.thumbnail,
          m.thumbnail_width, 
          m.thumbnail_height, 
          m.href 
        FROM 
          movie m 
          LEFT JOIN movie_genres mg ON m.id = mg.movie_id 
          LEFT JOIN genre g ON mg.genre_id = g.id 
          LEFT JOIN movie_cast mc ON m.id = mc.movie_id 
          LEFT JOIN cast c ON mc.cast_id = c.id 
        WHERE 
          m.id = UUID_TO_BIN(?) 
        GROUP BY 
          m.id;
        `,
        [id]
      );

      // Validar si se encontró alguna película
      if (movies.length === 0) {
        console.warn("No se encontró una película con el ID:", id);
        return {
          error: "No se encontró ninguna película con el ID proporcionado.",
          success: false,
        };
      }

      return movies[0]; // Retornar la película encontrada
    } catch (error) {
      console.error(
        "Error durante la consulta a la base de datos:",
        error.message
      );
      return {
        error:
          "Ocurrió un error al buscar la película. Inténtalo de nuevo más tarde.",
      };
    } finally {
      connection.release(); // Liberar conexión
    }
  }

  static async create({ input }) {
    const {
      title,
      year,
      extract,
      thumbnail,
      rate,
      genres: genreNames,
      cast: castNames,
      thumbnail_width = 320,
      thumbnail_height = 320,
    } = input;

    const connection = await pool.getConnection();

    // Helpers
    const generateHref = (title, year) =>
      `${title.replace(/\s+/g, "_")}_(${year}_film)`;

    const fetchIdsByNames = async (table, names) => {
      if (!names || names.length === 0) return [];
      const placeholders = names.map(() => "?").join(", ");
      const [records] = await connection.query(
        `SELECT id FROM ${table} WHERE name IN (${placeholders});`,
        names
      );
      if (records.length !== names.length) {
        throw new Error(`Algunos nombres de ${table} no son válidos.`);
      }
      return records.map((record) => record.id);
    };

    const insertRelations = async (table, values) => {
      if (values.length > 0) {
        await connection.query(
          `INSERT INTO ${table} (movie_id, ${
            table === "movie_genres" ? "genre_id" : "cast_id"
          }) VALUES ?;`,
          [values]
        );
      }
    };

    try {
      await connection.beginTransaction();

      // Verificar si la película ya existe
      const [existingMovie] = await connection.query(
        `SELECT BIN_TO_UUID(id) AS id FROM movie WHERE title = ? AND year = ?;`,
        [title, year]
      );
      if (existingMovie.length > 0) {
        const { id } = existingMovie[0];
        return {
          id,
          title,
          year,
          extract,
          thumbnail,
          rate,
          genres: [],
          cast: [],
          message: "La película ya existe en la base de datos.",
          success: false,
        };
      }

      // Generar href y UUID
      const href = generateHref(title, year);
      const [uuidResult] = await connection.query("SELECT UUID() uuid;");
      const [{ uuid }] = uuidResult;

      // Insertar película
      await connection.query(
        `INSERT INTO movie (id, title, year, extract, thumbnail, rate, href, thumbnail_width, thumbnail_height)
             VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          uuid,
          title,
          year,
          extract,
          thumbnail,
          rate,
          href,
          thumbnail_width,
          thumbnail_height,
        ]
      );

      // Procesar géneros y cast
      const genreIds = await fetchIdsByNames("genre", genreNames);
      const castIds = await fetchIdsByNames("cast", castNames);

      // Insertar relaciones
      const movieIdBinary = Buffer.from(uuid.replace(/-/g, ""), "hex");
      await insertRelations(
        "movie_genres",
        genreIds.map((id) => [movieIdBinary, id])
      );
      await insertRelations(
        "movie_cast",
        castIds.map((id) => [movieIdBinary, id])
      );

      await connection.commit();

      return {
        id: uuid,
        title,
        year,
        extract,
        thumbnail,
        thumbnail_width,
        thumbnail_height,
        rate,
        genres: genreNames || [],
        cast: castNames || [],
        message: "La película ha sido creada exitosamente.",
        success: true,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error al crear la película:", error.message);
      return {
        error: "No se pudo crear la película. Inténtalo de nuevo más tarde.",
        success: false,
      };
    } finally {
      connection.release();
    }
  }

  static async delete({ id }) {
    try {
      const connection = await pool.getConnection();
      try {
        // Validar que el ID tenga el formato correcto de un UUID
        const uuidRegex =
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(id)) {
          console.error(
            "El ID proporcionado no tiene un formato válido de UUID:",
            id
          );
          return { error: "El ID proporcionado no es válido.", success: false };
        }

        // Verificar si la película existe antes de intentar eliminarla
        const [existingMovie] = await connection.query(
          "SELECT id FROM movie WHERE id = UUID_TO_BIN(?) LIMIT 1;",
          [id]
        );

        if (existingMovie.length === 0) {
          return {
            error: "La película no existe o ya fue eliminada.",
            success: false,
          };
        }

        // Eliminar la película
        const [result] = await connection.query(
          "DELETE FROM movie WHERE id = UUID_TO_BIN(?);",
          [id]
        );

        // Verificar si se eliminó alguna fila
        if (result.affectedRows === 0) {
          return {
            error: "La película no pudo ser eliminada.",
            success: false,
          };
        } else {
          return {
            success: true,
            message:
              "Película eliminada correctamente junto con sus relaciones.",
          };
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al eliminar la película:", error.message);
      return {
        error: "No se pudo eliminar la película. Inténtalo de nuevo más tarde.",
        success: false,
      };
    }
  }

  static async update({ id, input }) {
    const {
      title,
      year,
      extract,
      thumbnail,
      thumbnail_width,
      thumbnail_height,
      rate,
      genres,
      cast,
      href,
    } = input;

    // Validar que el ID tenga el formato correcto de un UUID
    const isValidUUID =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!isValidUUID.test(id)) {
      console.error(
        "El ID proporcionado no tiene un formato válido de UUID:",
        id
      );
      return { error: "El ID proporcionado no es válido.", success: false };
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar los campos proporcionados
      const updateFields = [];
      const updateValues = [];

      const fieldsToUpdate = {
        title,
        year,
        extract,
        thumbnail,
        thumbnail_width,
        thumbnail_height,
        rate,
        href,
      };

      for (const [key, value] of Object.entries(fieldsToUpdate)) {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `UPDATE movie SET ${updateFields.join(
          ", "
        )} WHERE id = UUID_TO_BIN(?);`;
        const [result] = await connection.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
          throw new Error("No se encontró la película para actualizar.");
        }
      }

      // Actualizar relaciones (géneros y cast)
      await this.updateRelations(
        connection,
        id,
        genres,
        "genre",
        "movie_genres",
        "genre_id"
      );
      await this.updateRelations(
        connection,
        id,
        cast,
        "cast",
        "movie_cast",
        "cast_id"
      );

      await connection.commit();

      return {
        id,
        title: title || undefined,
        year: year || undefined,
        extract: extract || undefined,
        thumbnail: thumbnail || undefined,
        thumbnail_width: thumbnail_width || undefined,
        thumbnail_height: thumbnail_height || undefined,
        rate: rate || undefined,
        genres: genres || undefined,
        cast: cast || undefined,
        href: href || undefined,
        message: "La película se actualizó correctamente.",
        success: true,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error al actualizar la película:", error.message);
      return {
        error:
          "No se pudo actualizar la película. Inténtalo de nuevo más tarde.",
        success: false,
      };
    } finally {
      connection.release();
    }
  }

  // Método auxiliar para actualizar relaciones
  static async updateRelations(
    connection,
    movieId,
    items,
    table,
    relationTable,
    relationField
  ) {
    if (!items || items.length === 0) return;

    // Eliminar relaciones existentes
    await connection.query(
      `DELETE FROM ${relationTable} WHERE movie_id = UUID_TO_BIN(?);`,
      [movieId]
    );

    // Buscar IDs de los elementos proporcionados
    const placeholders = items.map(() => "?").join(", ");
    const [records] = await connection.query(
      `SELECT id FROM ${table} WHERE name IN (${placeholders});`,
      items
    );

    if (records.length !== items.length) {
      throw new Error(
        `Algunos elementos proporcionados no son válidos en ${table}.`
      );
    }

    const itemIds = records.map((record) => record.id);

    // Insertar nuevas relaciones
    const relationValues = itemIds.map((itemId) => [
      Buffer.from(movieId.replace(/-/g, ""), "hex"),
      itemId,
    ]);

    await connection.query(
      `INSERT INTO ${relationTable} (movie_id, ${relationField}) VALUES ?;`,
      [relationValues]
    );
  }

  // Contador de películas en base de datos
  static async count({ genre, cast, year, title, rate }) {
    const connection = await pool.getConnection();
    try {
      // Construir filtros dinámicamente
      const filters = [];
      const queryParams = [];

      if (genre) {
        filters.push(`
          m.id IN (
            SELECT movie_id FROM movie_genres
            JOIN genre ON movie_genres.genre_id = genre.id
            WHERE LOWER(genre.name) = ?
          )
        `);
        queryParams.push(genre.toLowerCase());
      }

      if (cast) {
        filters.push(`
          m.id IN (
            SELECT movie_id FROM movie_cast
            JOIN cast ON movie_cast.cast_id = cast.id
            WHERE LOWER(cast.name) = ?
          )
        `);
        queryParams.push(cast.toLowerCase());
      }

      if (year) {
        filters.push(`m.year = ?`);
        queryParams.push(year);
      }

      if (title) {
        filters.push(`m.title LIKE ?`);
        queryParams.push(`%${title}%`);
      }

      if (rate) {
        filters.push(`m.rate >= ?`);
        queryParams.push(rate);
      }

      const whereClause =
        filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

      // Construir la consulta para contar los resultados
      const query = `
        SELECT COUNT(*) AS total
        FROM movie m
        ${whereClause};
      `;

      const [rows] = await connection.query(query, queryParams);
      return rows[0].total;
    } finally {
      connection.release();
    }
  }
}
