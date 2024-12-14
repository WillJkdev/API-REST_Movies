export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: "La ruta solicitada no existe",
    path: req.originalUrl,
  });
};
