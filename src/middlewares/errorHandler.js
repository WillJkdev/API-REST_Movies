export const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Registrar el error
  res.status(500).json({
    error: "Ocurrió un error en el servidor",
    message: err.message || "Error interno",
  });
};
