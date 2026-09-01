import "dotenv/config";
import cloudinary from "./lib/cloudinary.js";

try {
    const result = await cloudinary.uploader.upload(
        "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    );

} catch (err) {
    console.error(err);
}