import pool from "../config/dbConfig.js";

if (!pool) {
  console.error("Database pool is not initialized.");
  throw new Error("Failed to initialize database pool.");
}

export class GenreModel {
  // Obtener todos los géneros
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      // Comenzar la consulta base
      let query = `SELECT id, name FROM genre`;
      const queryParams = [];

      // Si se proporciona un filtro de nombre, agregarlo a la consulta
      if (filters.name) {
        query += ` WHERE name LIKE ?`;
        queryParams.push(`%${filters.name}%`); // Agregar el parámetro de búsqueda
      }

      // Ejecutar la consulta con el filtro si existe
      const [genres] = await connection.query(query, queryParams);

      return genres;
    } finally {
      connection.release();
    }
  }

  // Obtener un género por su ID
  static async getById({ id }) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, name
        FROM genre
        WHERE id = ?;
      `;
      const [genre] = await connection.query(query, [id]);

      if (genre.length === 0) {
        return { error: "Género no encontrado", success: false };
      }

      return genre[0];
    } finally {
      connection.release();
    }
  }

  // Crear un nuevo género
  static async create({ input }) {
    const { name } = input;
    const connection = await pool.getConnection();
    try {
      // Verificar si el género ya existe
      const [existingGenre] = await connection.query(
        "SELECT id FROM genre WHERE name = ?",
        [name]
      );

      if (existingGenre.length > 0) {
        return {
          error: "El género ya existe",
          success: false,
        };
      }

      // Insertar el nuevo género
      const [result] = await connection.query(
        "INSERT INTO genre (name) VALUES (?)",
        [name]
      );

      return {
        id: result.insertId,
        name,
        success: true,
        message: "Género creado correctamente",
      };
    } finally {
      connection.release();
    }
  }

  // Eliminar un género
  static async delete({ id }) {
    const connection = await pool.getConnection();
    try {
      // Verificar si el género existe
      const [existingGenre] = await connection.query(
        "SELECT id FROM genre WHERE id = ?",
        [id]
      );

      if (existingGenre.length === 0) {
        return {
          error: "Género no encontrado",
          success: false,
        };
      }

      // Eliminar el género
      const [result] = await connection.query(
        "DELETE FROM genre WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          error: "No se pudo eliminar el género",
          success: false,
        };
      }

      return {
        success: true,
        message: "Género eliminado correctamente",
      };
    } finally {
      connection.release();
    }
  }

  // Actualizar un género
  static async update({ id, input }) {
    const { name } = input;
    const connection = await pool.getConnection();
    try {
      // Verificar si el género existe
      const [existingGenre] = await connection.query(
        "SELECT id FROM genre WHERE id = ?",
        [id]
      );

      if (existingGenre.length === 0) {
        return {
          error: "Género no encontrado",
          success: false,
        };
      }

      // Actualizar el nombre del género
      const [result] = await connection.query(
        "UPDATE genre SET name = ? WHERE id = ?",
        [name, id]
      );

      if (result.affectedRows === 0) {
        return {
          error: "No se pudo actualizar el género",
          success: false,
        };
      }

      return {
        id,
        name,
        success: true,
        message: "Género actualizado correctamente",
      };
    } finally {
      connection.release();
    }
  }
}
