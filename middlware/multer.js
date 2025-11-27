const multer = require("multer");
const fs = require("fs");
const path = require("path");

const imagesPath = path.join(__dirname, "..", "images");
if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath);

const multerFunc = () => {
  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imagesPath),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];
    cb(null, allowedTypes.includes(file.mimetype));
  };

  return multer({ storage: fileStorage, fileFilter }).single("image");
};

module.exports = { multerFunc };
