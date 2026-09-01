import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import {
    successResponse,
    errorResponse
} from "../utils/response.js";
import {
    uploadBase64Image
} from "../services/cloudinaryService.js";


// Signup a new user
export const signup = async (req, res) => {
    try {
        const { fullName, email, password, bio } = req.body;

        if (!fullName || !email || !password || !bio) {
            return errorResponse(
                res,
                400,
                "Missing details"
            );
        }

        const user = await User.findOne({ email });

        if (user) {
            return errorResponse(
                res,
                409,
                "Account already exists"
            );
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);

        const userData = await User.findById(
            newUser._id
        ).select("-password");

        return successResponse(res, 201, {
            userData,
            token,
            message: "Account created successfully"
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};


// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return errorResponse(
                res,
                401,
                "Invalid credentials"
            );
        }

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordCorrect) {
            return errorResponse(
                res,
                401,
                "Invalid credentials"
            );
        }

        const token = generateToken(user._id);

        const userData = await User.findById(
            user._id
        ).select("-password");

        return successResponse(res, 200, {
            userData,
            token,
            message: "Login successful"
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};


// Check if user is authenticated
export const checkAuth = (req, res) => {
    return successResponse(res, 200, {
        user: req.user
    });
};


// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const {
            profilePic,
            bio,
            fullName
        } = req.body;

        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            updatedUser =
                await User.findByIdAndUpdate(
                    userId,
                    {
                        bio,
                        fullName
                    },
                    {
                        new: true
                    }
                ).select("-password");
        } else {
            const upload =
                await uploadBase64Image(
                    profilePic
                );

            updatedUser =
                await User.findByIdAndUpdate(
                    userId,
                    {
                        profilePic:
                            upload.secure_url,
                        bio,
                        fullName
                    },
                    {
                        new: true
                    }
                ).select("-password");
        }

        return successResponse(res, 200, {
            user: updatedUser
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};