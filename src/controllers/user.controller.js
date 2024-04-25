import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "chai aur code backend"
    // })
    const { fullName, email, password, username } = req.body;
    console.log('email: ',email);
    if(
        [fullName, email, password].some(
            (value) => value?.trim() === ""
        )
    ){
        throw new ApiError(500, "All Fields are Required")
    }

    const existedUser = await User.findOne({
        $or: [ { email }, { username }]
    })

    if(existedUser){
        throw new ApiError(409, "User with Email or Username already Exists")
    }

    // getting local file path after uploading the 
    console.log("req.file:",req)
    console.log("req.file:",req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // if coverImage is not sent in the request then it gets error saying can't read from undefined, it happens even if we are using 
    // optional chaining ie., ?. so we will use if condition to check if the coverImage is present in the request or not
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log('avatar: ',avatarLocalPath);
    console.log('coverImageLocalPath: ',coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something Went Wrong while User Registration")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})


export { registerUser }