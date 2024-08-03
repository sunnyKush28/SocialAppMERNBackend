import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

export const verifyJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "");


        if (!token) return res.status(400).json({ message: "Unauthorized request" });

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) return res.status(401).json({ message: "Invalid accessToken" });

        req.user = user;

        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
