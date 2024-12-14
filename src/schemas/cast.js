import z from "zod";

// Validación para el miembro del reparto
export const castSchema = z.object({
  name: z
    .string({
      required_error: "Cast name is required.",
      invalid_type_error: "Cast name must be a string",
    })
    .min(3, "Name must be at least 3 characters long"),
});

export const validateCast = (data) => {
  try {
    castSchema.parse(data); // Esto valida los datos usando el esquema de Zod
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
