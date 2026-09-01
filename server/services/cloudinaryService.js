import cloudinary from "../lib/cloudinary.js";


// Upload image buffer
export const uploadImageBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "lumo"
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );

        uploadStream.end(buffer);
    });
};


// Upload Base64 image
export const uploadBase64Image = async (image) => {
    return cloudinary.uploader.upload(
        image,
        {
            resource_type: "image",
            folder: "lumo"
        }
    );
};