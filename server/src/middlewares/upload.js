// middlewares/upload.js
import multer from "multer";
import path from "path";

// Ruta de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + "-" + file.originalname;
    cb(null, nombreUnico);
  }
});

export const upload = multer({ storage });
