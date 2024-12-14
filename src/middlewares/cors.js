import cors from "cors";
const ACCEPTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:1234",
];

export const corsMiddleware = ({ allowedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
