export const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON con formato incorrecto detectado:", err.message);
    return res
      .status(400)
      .json({ error: "El cuerpo de la solicitud contiene JSON corrupto." });
  }
  next(err);
};
