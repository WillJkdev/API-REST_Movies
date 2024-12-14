import z from "zod";

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: "Movie title must be a string",
    required_error: "Movie title is required.",
  }),
  year: z
    .number({
      invalid_type_error: "Movie year must be a number",
      required_error: "Movie year is required.",
    })
    .int()
    .min(1900)
    .max(2025),
  rate: z.number().min(0).max(10).default(5),
  extract: z.string({
    required_error: "Movie extract is required.",
    invalid_type_error: "Movie extract must be a string",
  }),
  thumbnail: z.string().url({
    message: "Thumbnail must be a valid URL",
  }),
  genres: z.array(
    z.enum([
      "Action",
      "Adventure",
      "Animated",
      "Biography",
      "Comedy",
      "Crime",
      "Dance",
      "Disaster",
      "Documentary",
      "Drama",
      "Erotic",
      "Family",
      "Fantasy",
      "Found Footage",
      "Historical",
      "Horror",
      "Independent",
      "Legal",
      "Live Action",
      "Martial Arts",
      "Musical",
      "Mystery",
      "Noir",
      "Performance",
      "Political",
      "Romance",
      "Satire",
      "Science Fiction",
      "Short",
      "Silent",
      "Slasher",
      "Sport",
      "Sports",
      "Spy",
      "Superhero",
      "Supernatural",
      "Suspense",
      "Teen",
      "Thriller",
      "War",
      "Western",
    ]),
    {
      required_error: "Movie genre is required.",
      invalid_type_error: "Movie genre must be an array of enum Genre",
    }
  ),
  cast: z.array(
    z.string({
      required_error: "Movie cast is required.",
      invalid_type_error: "Movie cast must be an array of strings",
    })
  ),
  thumbnail_width: z.number().min(0).max(1000).default(320),
  thumbnail_height: z.number().min(0).max(1000).default(320),
  href: z.string(),
});

export function validateMovie(input) {
  return movieSchema.safeParse(input);
}
export function validatePartialMovie(input) {
  return movieSchema.partial().safeParse(input);
}
