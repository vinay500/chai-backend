import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// sometimes we will use the req, next but we never user res
// this happens expecially in middlewares, so we replaced res with  underscore "_"
export const verifyJWT = asyncHandler( async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // console.log("req: ",req);
        console.log("req.cookies: ",req.cookies);
        console.log("req.headers: ",req.headers);
        console.log("req.header('Authorization'): ",req.header("Authorization"));
        // console.log("req.cookies: ",req.cookies);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }
        console.log("user in auth middleware:",user);
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})