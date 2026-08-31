import multer from "multer";

const handleUpload = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (error) => {

            if (error instanceof multer.MulterError) {

                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "Image must be smaller than 2 MB"
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            next();
        });
    };
};

export default handleUpload;