import { uploadOnCloudnary } from "../cloudnary/cloudnary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import fs from "fs";
const generateAccessTokenAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)

        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save()
        return { accessToken, refreshToken };
    } catch (error) {
        return res.status(500).json({ error: error })
    }



}

const userRegister = async (req, res) => {

    const { fullName, userName, email, password } = req.body



    let avtarLocalPath;

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {

        avtarLocalPath = req.files?.avatar[0]?.path;
    }


    let coverImageLocalpath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }

    if (!avtarLocalPath) {
        res.status(400).json({ message: "Avatar Image Is required" })
    }


    if ([fullName, userName, email, password].some(field => field?.trim() === "")) {
        fs.unlinkSync(avtarLocalPath)
        fs.unlinkSync(coverImageLocalpath)

        return res.status(400).json({ message: "All fields are required" });
    }

    const existedUser = await User.findOne({ $or: [{ email }, { userName }] })

    if (existedUser) {
        fs.unlinkSync(avtarLocalPath)
        fs.unlinkSync(coverImageLocalpath)
        return res.status(400).json({ message: "UserName or Email alredy exists" })

    }
    const avatar = await uploadOnCloudnary(avtarLocalPath)
    const coverImage = await uploadOnCloudnary(coverImageLocalpath)

    if (!avatar) {
        return res.status(400).json({ message: "Avatar file is Required" })
    }

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshtoken")

    if (!createdUser) return res.staus(500).json({ message: "Something went worng while registering user" })
    return res.status(200).json({
        createdUser: createdUser, message: "User registered successfully"
    })
}


const userLogIn = async (req, res) => {
    const { email, userName, password } = req.body;

    if (!(email || userName)) {
        return res.status(400).json({ message: "Username or Email is Required" });
    }

    try {
        const user = await User.findOne({ $or: [{ email }, { userName }] });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Password" });
        }

        const tokens = await generateAccessTokenAndRefreshTokens(user._id);
        const { accessToken, refreshToken } = tokens;

        const logInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 1000,
            sameSite: 'None',
            domain: 'https://jovial-croquembouche-bd0326.netlify.app'

        };

        return res.status(200)
            .cookie("refreshtoken", refreshToken, options)
            .cookie("accesstoken", accessToken, options)
            .json({ loginuser: logInUser, accessToken, refreshToken });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const userLogout = async (req, res) => {

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );



    const options = {
        httpOnly: true,
        secure: true,
        magAge: 60 * 60 * 1000,
        sameSite: 'None',
        domain: 'https://jovial-croquembouche-bd0326.netlify.app'
    };

    return res.status(200)
        .clearCookie("accesstoken", options)
        .clearCookie("refreshtoken", options)
        .json({ message: "User logged out successfully" });
};

const refreshAcessToken = async (req, res) => {

    const incommingRefreshToken = req.cookies?.refreshtoken || req.body.refreshtoken
    console.log(incommingRefreshToken);
    if (!incommingRefreshToken) {
        return res.status(400).json({ message: "Unauthorized Request" })
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)

        if (!user) return res.status(400).json({ message: "Invalid refresh token" })

        if (!incommingRefreshToken || incommingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({ message: "Refresh Token is expired or used" })
        }

        const options = {
            httpOnly: true,
            secure: true,
            magAge: 60 * 60 * 1000,
            sameSite: 'None',
            domain: 'https://jovial-croquembouche-bd0326.netlify.app'
        }

        const tokens = await generateAccessTokenAndRefreshTokens(user._id);
        const { accessToken, refreshToken } = tokens;


        return res.status(200)
            .cookie("accesstoken", accessToken, options)
            .cookie("refreshtoken", refreshToken, options)
            .json({ token: { accessToken, refreshToken }, message: "Access token is refreshed" })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const getCurrentUser = async (req, res) => {
    return res
        .status(200)
        .json({ user: req.user, message: "Current User fetched successfully" });
};

const userProfile = async (req, res) => {

    const userName = req.user.userName


    try {
        const profile = await User.aggregate([
            {
                $match: {
                    userName: userName?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "author",
                    as: "posts"
                }
            },
            {
                $addFields: {
                    postCount: {
                        $size: "$posts"
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    userName: 1,
                    posts: 1,
                    postCount: 1,
                    email: 1,
                    coverImage: 1,
                    avatar: 1
                }
            }
        ]);


        if (!profile?.length) {
            return res.status(404).json({ message: "Profile not exists" });
        }

        return res.status(200).json({ userProfile: profile[0], message: "User profile" });
    } catch (error) {

        return res.status(500).json({ message: "Server error" });
    }
}

const getUserThroughId = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findById({ _id: userId })


        return res.status(200).json({ user: user, message: "User Fetch successfully" })

    } catch (error) {
        return res.status(500).json({ message: "Server error" });

    }
}


export {
    userRegister,
    userLogIn,
    userLogout,
    refreshAcessToken,
    getCurrentUser,
    userProfile,
    getUserThroughId
}