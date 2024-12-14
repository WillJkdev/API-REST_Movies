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

let createdCastId = null; // Variable para almacenar el ID del miembro del cast creado

// Limpiar la base de datos luego de terminar toda la prueba
afterAll(async () => {
  if (createdCastId) {
    await CastModel.delete({ id: createdCastId });
  }
});

describe("Cast API Tests", () => {
  // 1. GET /cast: Listar todos los miembros del cast
  it("should return a list of cast members", async () => {
    const response = await request(app).get("/cast");
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(Array.isArray(response.body.data)).toBe(true); // Asegúrate de que sea un array
  });

  // 2. POST /cast: Crear nuevo miembro del cast
  it("should create a new cast member", async () => {
    const newCastMember = {
      name: "Will Torne IV",
    };
    const response = await request(app).post("/cast").send(newCastMember);
    expect(response.status).toBe(201); // Respuesta exitosa de creación
    expect(response.body.name).toBe(newCastMember.name); // Verifica que el nombre sea el correcto

    // Guardamos el ID del miembro del cast creado para usarlo en afterAll
    createdCastId = response.body.id;
  });

  it("should return 400 for invalid cast member data", async () => {
    const invalidCastMember = {
      name: "", // Nombre vacío no es válido
    };
    const response = await request(app).post("/cast").send(invalidCastMember);
    expect(response.status).toBe(400); // Respuesta con error 400
  });

  // 3. GET /cast/:id: Buscar miembro del cast por ID
  it("should return a cast member by ID", async () => {
    const castId = createdCastId;
    const response = await request(app).get(`/cast/${castId}`);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body).toHaveProperty("id", castId); // Verifica que el ID sea correcto
  });

  it("should return 404 for cast member not found", async () => {
    const response = await request(app).get(`/cast/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 4. PATCH /cast/:id: Actualizar miembro del cast
  it("should update an existing cast member", async () => {
    const castUpdatedId = createdCastId;
    const updatedCastMember = {
      name: "Will Torne V",
    };
    const response = await request(app)
      .patch(`/cast/${castUpdatedId}`)
      .send(updatedCastMember);
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(response.body.name).toBe(updatedCastMember.name); // Verifica que el nombre sea el correcto
  });

  it("should return 404 for updating a non-existing cast member", async () => {
    const updatedCastMember = {
      name: "Non-Existent Cast",
    };
    const response = await request(app)
      .patch(`/cast/invalid-id`)
      .send(updatedCastMember);
    expect(response.status).toBe(404); // Respuesta con error 404
  });

  // 5. GET /cast with filter: Buscar miembros del cast por nombre
  it("should return filtered cast members by name", async () => {
    const response = await request(app).get("/cast?name=Will Torne V");
    expect(response.status).toBe(200); // Respuesta exitosa
    expect(Array.isArray(response.body.data)).toBe(true); // Asegúrate de que sea un array
    expect(response.body.data.length).toBeGreaterThan(0); // Debe haber al menos un resultado
    // Verificar que cada miembro del cast contenga la palabra "Will"
    response.body.data.forEach((castMember) => {
      expect(castMember.name).toContain("Will");
    });
  });

  it("should return an empty array when no cast members match the name", async () => {
    const response = await request(app).get("/cast?name=NonExistentName");
    expect(response.status).toBe(404);
    expect(response.body.data).toEqual([]); // No debe haber resultados
  });

  // 6. DELETE /cast/:id: Eliminar miembro del cast
  it("should delete a cast member", async () => {
    const castDeletedId = createdCastId;
    const response = await request(app).delete(`/cast/${castDeletedId}`);
    expect(response.status).toBe(200); // Respuesta exitosa de eliminación
    expect(response.body).toHaveProperty("message"); // Asegúrate de que la respuesta tenga un mensaje
  });

  it("should return 404 for deleting a non-existing cast member", async () => {
    const response = await request(app).delete(`/cast/invalid-id`);
    expect(response.status).toBe(404); // Respuesta con error 404
  });
});
