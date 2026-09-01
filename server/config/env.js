const requiredEnvVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLIENT_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
];

export const validateEnv = () => {
    const missingVariables =
        requiredEnvVariables.filter(
            (variable) => !process.env[variable]
        );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing environment variables: ${missingVariables.join(", ")}`
        );
    }
};