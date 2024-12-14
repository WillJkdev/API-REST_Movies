import pool from "../config/dbConfig.js";

if (!pool) {
  console.error("Database pool is not initialized.");
  throw new Error("Failed to initialize database pool.");
}

export class CastModel {
  // Obtener todos los miembros del reparto con filtro de nombre y paginación
  static async getAll({ filters = {}, page = 1, limit = 30 }) {
    const connection = await pool.getConnection();
    try {
      // Convertir page y limit a números seguros
      const safeLimit = parseInt(limit, 10) || 30;
      const safePage = parseInt(page, 10) || 1;

      // Calcular offset
      const offset = (safePage - 1) * safeLimit;

      // Construir la consulta con paginación y filtro de nombre si existe
      let query = `
      SELECT id, name
      FROM cast
    `;
      const queryParams = [];

      // Si se proporciona un filtro de nombre, agregarlo a la consulta
      if (filters.name) {
        query += ` WHERE name LIKE ?`;
        queryParams.push(`%${filters.name}%`); // El % se agrega para hacer una búsqueda de tipo LIKE
      }

      // Agregar paginación a la consulta
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(safeLimit, offset);

      // Ejecutar la consulta
      const [castMembers] = await connection.query(query, queryParams);
      return castMembers;
    } finally {
      connection.release();
    }
  }

  // Obtener un miembro del reparto por su ID
  static async getById({ id }) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, name
        FROM cast
        WHERE id = ?;
      `;
      const [castMember] = await connection.query(query, [id]);

      if (castMember.length === 0) {
        return { error: "Miembro del reparto no encontrado", success: false };
      }

      return castMember[0];
    } finally {
      connection.release();
    }
  }

  // Crear un nuevo miembro del reparto
  static async create({ input }) {
    const { name } = input;
    const connection = await pool.getConnection();
    try {
      // Verificar si el miembro del reparto ya existe
      const [existingCast] = await connection.query(
        "SELECT id FROM cast WHERE name = ?",
        [name]
      );

      if (existingCast.length > 0) {
        return {
          error: "El miembro del reparto ya existe",
          success: false,
        };
      }

      // Insertar el nuevo miembro del reparto
      const [result] = await connection.query(
        `INSERT INTO \`cast\` (name) VALUES (?);`,
        [name]
      );

      return {
        id: result.insertId,
        name,
        success: true,
        message: "Miembro del reparto creado correctamente",
      };
    } catch (error) {
      console.error("Error creating cast member:", error);
    } finally {
      connection.release();
    }
  }

  // Eliminar un miembro del reparto
  static async delete({ id }) {
    const connection = await pool.getConnection();
    try {
      // Verificar si el miembro del reparto existe
      const [existingCast] = await connection.query(
        "SELECT id FROM cast WHERE id = ?",
        [id]
      );

      if (existingCast.length === 0) {
        return {
          error: "Miembro del reparto no encontrado",
          success: false,
        };
      }

      // Eliminar el miembro del reparto
      const [result] = await connection.query("DELETE FROM cast WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return {
          error: "No se pudo eliminar el miembro del reparto",
          success: false,
        };
      }

      return {
        success: true,
        message: "Miembro del reparto eliminado correctamente",
      };
    } finally {
      connection.release();
    }
  }

  // Actualizar un miembro del reparto
  static async update({ id, input }) {
    const { name } = input;
    const connection = await pool.getConnection();
    try {
      // Verificar si el miembro del reparto existe
      const [existingCast] = await connection.query(
        "SELECT id FROM cast WHERE id = ?",
        [id]
      );

      if (existingCast.length === 0) {
        return {
          error: "Miembro del reparto no encontrado",
          success: false,
        };
      }

      // Actualizar el nombre del miembro del reparto
      const [result] = await connection.query(
        "UPDATE cast SET name = ? WHERE id = ?",
        [name, id]
      );

      if (result.affectedRows === 0) {
        return {
          error: "No se pudo actualizar el miembro del reparto",
          success: false,
        };
      }

      return {
        id,
        name,
        success: true,
        message: "Miembro del reparto actualizado correctamente",
      };
    } finally {
      connection.release();
    }
  }

  // Método para contar el total de miembros del reparto
  static async count({ name } = {}) {
    const connection = await pool.getConnection();
    try {
      // Construir la consulta base
      let query = `SELECT COUNT(*) AS total FROM cast`;
      const queryParams = [];

      // Si se proporciona un filtro de nombre, agregarlo a la consulta
      if (name) {
        query += ` WHERE name LIKE ?`;
        queryParams.push(`%${name}%`); // Usar % para búsqueda parcial
      }

      // Ejecutar la consulta
      const [[{ total }]] = await connection.query(query, queryParams);
      return total;
    } finally {
      connection.release();
    }
  }
}
