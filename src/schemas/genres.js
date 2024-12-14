import z from "zod";

// Validación para el género
export const genreSchema = z.object({
  name: z
    .string({
      required_error: "Genre name is required.",
    })
    .min(3, "Name must be at least 3 characters long"),
});

export const validateGenre = (data) => {
  try {
    genreSchema.parse(data); // Esto valida los datos usando el esquema de Zod
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
