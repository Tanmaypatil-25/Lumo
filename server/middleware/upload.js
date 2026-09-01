import multer from "multer";
import {
    MAX_IMAGE_SIZE,
    ALLOWED_IMAGE_TYPES
} from "../config/constants.js";

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: MAX_IMAGE_SIZE
    },

    fileFilter: (req, file, cb) => {

        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPEG, PNG and WebP images are allowed"
                )
            );
        }

        cb(null, true);
    }
});

export default upload;