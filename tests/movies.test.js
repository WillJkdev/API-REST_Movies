import request from "supertest";
import { createApp } from "../src/app"; // Importas la función que crea la app
import { MovieModel } from "../src/models/movies";
import { GenreModel } from "../src/models/genres";
import { CastModel } from "../src/models/cast";

// En los tests no es necesario escuchar en el puerto real
const app = createApp({
  movieModelInstance: MovieModel,
  genreModelInstance: GenreModel,
  castModelInstance: CastModel,
});

let createdMovieId = null; // Variable para almacenar el ID de la película creada

// Limpiar la base de datos luego de terminar toda la prueba
afterAll(async () => {
  if (createdMovieId) {
    // Eliminar la película que fue creada en la prueba
    await MovieModel.delete({ id: createdMovieId });
  }
});

describe("Movies API Tests", () => {
  // 1. GET /movies: Listar todas las películas
  it("should return a list of movies with pagination and filters", async () => {
    const response = await request(app).get("/movies");
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(Array.isArray(response.body.data)).toBe(true); // Asegúrate de que sea un array
    expect(response.body).toHaveProperty("page"); // Verifica que incluya la página
    expect(response.body).toHaveProperty("limit"); // Verifica que incluya el límite
    expect(response.body).toHaveProperty("totalResults"); // Verifica que incluya el total de resultados
    expect(response.body).toHaveProperty("totalPages"); // Verifica que incluya el total de páginas
  });

  // 2. GET /movies: Paginación y filtros inválidos
  it("should return 400 for invalid page parameter", async () => {
    const response = await request(app).get("/movies?page=invalid");
    expect(response.status).toBe(400); // Debe responder con 400
    expect(response.body.error).toBe(
      "Invalid 'page' or 'limit' parameter. Ensure 'page' is a positive number and 'limit' is between 1 and 100."
    );
  });

  it("should return 400 for invalid limit parameter", async () => {
    const response = await request(app).get("/movies?limit=200");
    expect(response.status).toBe(400); // El límite no debe ser mayor a 100
    expect(response.body.error).toBe(
      "Invalid 'page' or 'limit' parameter. Ensure 'page' is a positive number and 'limit' is between 1 and 100."
    );
  });

  // 3. POST /movies: Crear nueva película
  it("should create a new movie", async () => {
    const newMovie = {
      title: "Quantum Horizon 4",
      year: 2024,
      cast: ["Adam Sevani", "Bruce Lanoil"],
      genres: ["Science Fiction", "Thriller", "Adventure"],
      href: "Quantum_Horizon",
      extract: "Quantum Horizon is a 2024 science fiction thriller...",
      thumbnail:
        "https://upload.wikimedia.org/fakepath/quantum_horizon_poster.jpg",
      thumbnail_width: 450,
      thumbnail_height: 600,
    };
    const response = await request(app).post("/movies").send(newMovie);
    expect(response.status).toBe(201); // Respuesta exitosa de creación
    expect(response.body.title).toBe(newMovie.title); // Verifica que el título sea el correcto

    // Guardamos el ID de la película creada para usarlo en afterEach
    createdMovieId = response.body.id;
  });

  // 4. GET /movies/:id: Buscar película por ID
  it("should return a movie by ID", async () => {
    const response = await request(app).get(`/movies/${createdMovieId}`);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body).toHaveProperty("title"); // Asegúrate de que la película tenga un título
    expect(response.body.id).toBe(createdMovieId); // Verifica que el ID sea correcto
  });

  it("should return 404 for movie not found", async () => {
    const response = await request(app).get(`/movies/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 5. PATCH /movies/:id: Modificar película creada
  it("should update an existing movie", async () => {
    const updatedData = {
      title: "Quantum Horizon: Reboot",
      year: 2024,
      cast: ["Aaron Burns"],
      genres: ["Science Fiction", "Thriller", "Action"],
      href: "Quantum_Horizon_Reboot",
      extract: "Quantum Horizon: Reboot is a 2025 sci-fi thriller...",
      thumbnail:
        "https://upload.wikimedia.org/fakepath/quantum_horizon_reboot_poster.jpg",
      thumbnail_width: 450,
      thumbnail_height: 600,
    };
    const response = await request(app)
      .patch(`/movies/${createdMovieId}`)
      .send(updatedData);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body.title).toBe(updatedData.title); // Verifica que el título sea el correcto
    expect(response.body.year).toBe(updatedData.year); // Verifica que el año sea el correcto
  });

  it("should return 404 for updating a non-existing movie", async () => {
    const updatedData = {
      title: "Non-Existent Movie",
      year: 2024,
      cast: ["Non", "Existent", "Cast"],
      genres: ["Drama"],
    };
    const response = await request(app)
      .patch(`/movies/invalid-id`)
      .send(updatedData);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 6. DELETE /movies/:id: Eliminar película creada
  it("should delete a movie", async () => {
    const response = await request(app).delete(`/movies/${createdMovieId}`);
    expect(response.status).toBe(200); // Respuesta exitosa de eliminación
    expect(response.body).toHaveProperty("message"); // Asegúrate de que la respuesta tenga un mensaje
  });

  it("should return 404 for deleting a non-existing movie", async () => {
    const response = await request(app).delete(`/movies/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });
});
