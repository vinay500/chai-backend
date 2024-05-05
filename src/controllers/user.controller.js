import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';


const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // saving the refresh token to the user model
        user.refreshToken = refreshToken
        // we made the user saving function async because as it is a db operation it takes time, 
        // we passed validateBeforeSave: false to save() because save() will save all the fields but we only need to save the refreshToken field only so we used validateBeforeSave: false
        await user.save({ validateBeforeSave: false})

        return { accessToken, refreshToken }

    }catch(error){
        throw new ApiError(500, "Something went Wrong while generating Access and Refresh Token")
    }

    


} 



const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "chai aur code backend"
    // })
    const { fullName, email, password, username } = req.body;
    console.log('req.body: ',req.body);
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
    // console.log("req.file:",req)
    // console.log("req.file:",req.files)
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

const loginUser = asyncHandler( async (req, res) => {
    // console.log('req: ',req);
    console.log('req.body: ',req.body);
    console.log('user login details - email: ',req.body.email, ' password: ',req.body.password);

    const { email ,username, password } = req.body;

    if(!email && !username ){
        throw new ApiError(500, "Email or Username is Required");
    }

    const user = await User.findOne({
        $or: [ { email }, { username } ]
    })

    if(!user){
        throw new ApiError(404, "User does not Exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password");
    }

    // we are making this await as it is a DB operation it takes time so we should make it await 
    // remember, async keyword is used while defining the function and await is used inside the function where 
    // time will be taken for the process to complete  
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // reason why we are getting the user again from db is because when we got the user before from db then 
    // user doesn't have a refresh token so we are again getting the user or we can even update the existing user if we feel like making a DB call is expensive
    const loggedInUser =   await User.findById(user._id).select("-password -refreshToken")

    const options = { 
        "httponly":true,

    }

    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
        new ApiResponse(
            200,{
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggedIn Succesfully"
        )
    )


})


const logoutUser = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },{
            new: true
        }
    )

    const options = {
        httponly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken =  asyncHandler( async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        if(!decodedToken){
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            throw new ApiError(401, "Invalid Refresh Token ")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired or User")
        }
    
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httponly: true,
            secure: true,
        }
    
        res.status(200).cookie("accessToken",accessToken, options).cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {}, "Access Token Refreshed Successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

const changePassword = asyncHandler( async(req, res) => {

    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(401, "Unauthorized Request")
    }

    const passwordValid = await user.isPasswordCorrect(oldPassword);

    if(!passwordValid){
        throw new ApiError(401, "Invalid Password")
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, "Password Changed Successfully "))

})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res.status(200).json(200, req.user, "current user fetched successfully")
})


const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "All Fields are Required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Account details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    // here, we are using req.file and not req.files(as we used in user Registration)
    // reason being in user registration two files are being uploaded avatar, cover image
    // so we are using req.files
    // but here only one file is being uploaded so we are using req.file 
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    )

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar Updated Successfully")
    )
})



const updateUserCoverImage = asyncHandler(async(req, res) => {
    // here, we are using req.file and not req.files(as we used in user Registration)
    // reason being in user registration two files are being uploaded avatar, cover image
    // so we are using req.files
    // but here only one file is being uploaded so we are using req.file 
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    )

    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image Updated Successfully")
    )

})


const getUserChannelProfile = asyncHandler( async(req,res) => {
    const { username } = req.params
    
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    console.log("channel aggregation: ",channel);

    if (!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "User channel fetched Successfully")
    )
})

const getWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
    
            }
        },
        {
            $lookup:{
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // this pipeline is added for sake of frontend dev, because by using aggregate we will send the array to the frontend then it will not become easy so we will give the owner field as an object so it becomes easy for the frontend dev
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        } 
    ])

    return res.status(200).json(
        new ApiResponse(200, user[0].WatchHistory,"watch History fetched Succesfully")
    )
})



export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, updateAccountDetails}