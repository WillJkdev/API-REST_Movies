import { jest } from "@jest/globals";

describe("Database Configuration", () => {
  let mysqlMock;
  let dotenvMock;

  beforeEach(async () => {
    jest.resetModules(); // Limpiar módulos entre pruebas

    // Mocks de mysql2/promise y dotenv
    mysqlMock = {
      createPool: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue([{ 1: 1 }]), // Simula la respuesta de una consulta
      }),
    };

    dotenvMock = {
      config: jest.fn(),
    };

    // Asegúrate de que el mock de mysql2/promise esté configurado antes de importar dbConfig
    jest.unstable_mockModule("mysql2/promise", () => ({
      default: mysqlMock,
    }));
    jest.unstable_mockModule("dotenv", () => ({
      default: dotenvMock,
    }));

    // Configuración de variables de entorno para la prueba
    process.env.NODE_ENV = "development";
    process.env.MYSQL_HOST = "localhost";
    process.env.MYSQL_USER = "dev_user";
    process.env.MYSQL_PASSWORD = "dev_password";
    process.env.MYSQL_DATABASE = "dev_db";
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restaurar mocks después de cada prueba
    // Limpiar variables de entorno
    delete process.env.NODE_ENV;
    delete process.env.MYSQL_HOST;
    delete process.env.MYSQL_USER;
    delete process.env.MYSQL_PASSWORD;
    delete process.env.MYSQL_DATABASE;
    delete process.env.URL_DB;
  });

  it("should load development environment variables correctly", async () => {
    // Importa dbConfig después de establecer los mocks y las variables de entorno
    await import("../src/config/dbConfig");

    // Verifica que dotenv.config fue llamado con el archivo adecuado
    expect(dotenvMock.config).toHaveBeenCalledWith({ path: ".env.dev" });

    // Verifica que se creó el pool con los parámetros correctos
    expect(mysqlMock.createPool).toHaveBeenCalledWith({
      host: "localhost",
      user: "dev_user",
      password: "dev_password",
      database: "dev_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  });

  it("should load production environment variables correctly", async () => {
    process.env.NODE_ENV = "production";
    dotenvMock.config.mockReturnValue({});

    process.env.MYSQL_HOST = "prod_host";
    process.env.MYSQL_USER = "prod_user";
    process.env.MYSQL_PASSWORD = "prod_password";
    process.env.MYSQL_DATABASE = "prod_db";

    const mockCreatePool = jest.fn().mockReturnValue({});
    mysqlMock.createPool.mockImplementation(mockCreatePool);

    await import("../src/config/dbConfig");

    expect(dotenvMock.config).toHaveBeenCalledWith({ path: ".env" });
    expect(mockCreatePool).toHaveBeenCalledWith({
      host: "prod_host",
      user: "prod_user",
      password: "prod_password",
      database: "prod_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  });

  it("should throw an error if required environment variables are missing", async () => {
    // Configurar el entorno para la prueba
    process.env.NODE_ENV = "development";
    dotenvMock.config.mockReturnValue({});

    // Intencionalmente no configuramos todas las variables requeridas
    process.env.MYSQL_HOST = "localhost";
    process.env.MYSQL_USER = "dev_user";
    // MYSQL_PASSWORD y MYSQL_DATABASE no están definidas

    await expect(import("../src/config/dbConfig")).rejects.toThrow(
      "Missing required environment variable"
    );
  });

  it("should use URL_DB if provided", async () => {
    process.env.NODE_ENV = "development";
    dotenvMock.config.mockReturnValue({});

    process.env.MYSQL_HOST = "localhost";
    process.env.MYSQL_USER = "dev_user";
    process.env.MYSQL_PASSWORD = "dev_password";
    process.env.MYSQL_DATABASE = "dev_db";
    process.env.URL_DB = "mysql://user:password@host:3306/database";

    const mockCreatePool = jest.fn().mockReturnValue({});
    mysqlMock.createPool.mockImplementation(mockCreatePool);

    await import("../src/config/dbConfig");

    expect(mockCreatePool).toHaveBeenCalledWith(
      "mysql://user:password@host:3306/database"
    );
  });

  it("should handle errors when creating the connection pool", async () => {
    process.env.NODE_ENV = "development";
    dotenvMock.config.mockReturnValue({});

    process.env.MYSQL_HOST = "localhost";
    process.env.MYSQL_USER = "dev_user";
    process.env.MYSQL_PASSWORD = "dev_password";
    process.env.MYSQL_DATABASE = "dev_db";

    mysqlMock.createPool.mockImplementation(() => {
      throw new Error("Connection failed");
    });

    await expect(import("../src/config/dbConfig")).rejects.toThrow(
      "Failed to initialize database connection"
    );
  });
});
