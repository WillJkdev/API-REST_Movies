import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar el archivo .env adecuado según el entorno (producción o desarrollo)
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.dev",
});

// Validar que todas las variables de entorno necesarias estén definidas
const requiredEnvVars = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing environment variable ${varName}`);
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Si la URL de la base de datos no está definida, se usa la configuración estándar
const dbUrl = process.env.URL_DB ?? DB_CONFIG;

let pool;
try {
  // Crear el pool de conexiones con la URL proporcionada o la configuración local
  pool = mysql.createPool(dbUrl);
  console.log("MySQL connection pool created successfully.");

  // Verificar conexión
  (async () => {
    try {
      const [result] = await pool.query("SELECT 1");
      console.log("Database connection test successful:", result);
    } catch (error) {
      console.error("Database connection test failed:", error.message);
      throw new Error("Failed to connect to MySQL server.");
    }
  })();
} catch (error) {
  console.error("Error creating MySQL connection pool:", error.message);
  throw new Error("Failed to initialize database connection.");
}

export default pool;
