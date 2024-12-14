import request from "supertest";
import { createApp } from "../src/app"; // Importas la función que crea la app
import { MovieModel } from "../src/models/movies";
import { GenreModel } from "../src/models/genres";
import { CastModel } from "../src/models/cast";

// Crear la app para pruebas
const app = createApp({
  genreModelInstance: GenreModel,
  castModelInstance: CastModel,
  movieModelInstance: MovieModel,
});

let createdGenreId = null; // Variable para almacenar el ID del género creado

// Limpiar la base de datos luego de terminar toda la prueba
afterAll(async () => {
  if (createdGenreId) {
    await GenreModel.delete({ id: createdGenreId });
  }
});

describe("Genres API Tests", () => {
  // 1. GET /genres: Listar todos los géneros
  it("should return a list of genres", async () => {
    const response = await request(app).get("/genres");
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(Array.isArray(response.body.data)).toBe(true); // Asegúrate de que sea un array
  });

  // 2. POST /genres: Crear nuevo género
  it("should create a new genre", async () => {
    const newGenre = {
      name: "Anime X",
    };
    const response = await request(app).post("/genres").send(newGenre);
    expect(response.status).toBe(201); // Respuesta exitosa de creación
    expect(response.body.name).toBe(newGenre.name); // Verifica que el nombre sea el correcto

    // Guardamos el ID del género creado para usarlo en afterEach
    createdGenreId = response.body.id;
  });

  it("should return 400 for invalid genre data", async () => {
    const invalidGenre = {
      name: "", // Nombre vacío no es válido
    };
    const response = await request(app).post("/genres").send(invalidGenre);
    expect(response.status).toBe(400); // Respuesta con error 400
  });

  // 3. GET /genres/:id: Buscar género por ID
  it("should return a genre by ID", async () => {
    const genreId = createdGenreId;
    const response = await request(app).get(`/genres/${genreId}`);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body).toHaveProperty("id", genreId); // Verifica que el ID sea correcto
  });

  it("should return 404 for genre not found", async () => {
    const response = await request(app).get(`/genres/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 4. PATCH /genres/:id: Actualizar género
  it("should update an existing genre", async () => {
    const genreUpdatedId = createdGenreId;
    const updatedGenre = {
      name: "Anime Updated",
    };
    const response = await request(app)
      .patch(`/genres/${genreUpdatedId}`)
      .send(updatedGenre);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body.name).toBe(updatedGenre.name); // Verifica que el nombre sea el correcto
  });

  it("should return 404 for updating a non-existing genre", async () => {
    const updatedGenre = {
      name: "Non-Existent Genre",
    };
    const response = await request(app)
      .patch(`/genres/invalid-id`)
      .send(updatedGenre);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  it("should return 404 for deleting a non-existing genre", async () => {
    const response = await request(app).delete(`/genres/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 5. GET /genres with filter: Buscar géneros por nombre
  it("should return filtered genres by name", async () => {
    const response = await request(app).get("/genres?name=Updated");
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(Array.isArray(response.body.data)).toBe(true); // Asegúrate de que sea un array
    expect(response.body.data.length).toBeGreaterThan(0); // Debe haber al menos un resultado
    // Verificar que cada género contenga la palabra "Updated"
    response.body.data.forEach((genre) => {
      expect(genre.name).toContain("Updated");
    });
  });

  it("should return an empty array when no genres match the name", async () => {
    const response = await request(app).get("/genres?name=NonExistentGenre");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]); // No debe haber resultados
  });

  // 6. DELETE /genres/:id: Eliminar género
  it("should delete a genre", async () => {
    const genreDeletedId = createdGenreId;
    const response = await request(app).delete(`/genres/${genreDeletedId}`);
    expect(response.status).toBe(200); // Respuesta exitosa de eliminación
    expect(response.body).toHaveProperty("message"); // Asegúrate de que la respuesta tenga un mensaje
  });
});
