import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    // console.log("req.files: ",req.files.videoFile[0].path)
    const videoFilePath = req.files.videoFile[0]?.path;
    const thumbnailFilePath = req.files.thumbnail[0]?.path;
    console.log("videoFilePath: ",videoFilePath)
    console.log("thumbnailFilePath: ",thumbnailFilePath)

    const videoFileCloudinary = await uploadOnCloudinary(videoFilePath)
    const thumbnailFileCloudinary = await uploadOnCloudinary(thumbnailFilePath)

    console.log("videoFileCloudinary:",videoFileCloudinary)
    console.log("thumbnailFileCloudinary:",thumbnailFileCloudinary)

    const user = req.user;

    const uploadedVideo = await Video.create({
        videoFile: videoFileCloudinary.url,
        thumbnail: thumbnailFileCloudinary.url,
        title: title,
        description: description,
        duration: videoFileCloudinary.duration,
        isPublished: true,
        owner: user
    })

    console.log("video uploaded status:",uploadedVideo);

    return res.status(200).json(
        new ApiResponse(200, uploadedVideo, "Video Uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    // TODO:
    // 1.get video likes, comments, owner details, 
    // 2. if getVideoById is done becoz user is viewing the video then update views
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    
    if (!videoId){
        throw new ApiError(401, "videoId is Required")   
    }

    

    const { title, description } = req.body;

    if (!title){
        throw new ApiError(401, "title is Required")   
    }

    if (!description){
        throw new ApiError(401, "description is Required")   
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "No Video Found, Provide Valid Video ID")
    }

    // console.log("Video Owner: ",video.owner);
    console.log("Video Owner toString(): ",video.owner.toString());
    // console.log("type Video Owner id toString(): ",video.owner._id.toString());
    console.log("type Video Owner id toString(): ",typeof video.owner._id.toString());


    if(video?.owner.toString() != req?.user?._id.toString()){
        throw new ApiError(400, "You can't edit this Video as You are not the Owner")
    }

    // console.log("req.file: ",req.file);
    // console.log("req.file.thumbnail: ",req.file.thumbnail);


    const thumbnailFilePath =  req?.file?.path;
    
    if (!thumbnailFilePath){
        throw new ApiError(401, "thumbnail is Required")   
    }
    
    console.log("thumbnailFilePath: ",thumbnailFilePath);

    // TODO: check if old thumbnail is deleted in cloudinary or not
    const thumbnailUploadedFile = await uploadOnCloudinary(thumbnailFilePath);
    
    if(!thumbnailUploadedFile){
        throw new ApiError(400, "Thumbnail Upload Failed")
    }

    // console.log("thumbnailUploadedFile: ",thumbnailUploadedFile);

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title: title,
                description: description,
                thumbnail:thumbnailUploadedFile.url,
            }
        },
    )

    if(!updatedVideo){
        throw new ApiError(400, "Video Update Failed, Please Try Again");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video Updated Successfully" )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    console.log("in delete video")
    const { videoId } = req.params
    console.log("videoId: ",videoId)
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID");
    }
    //NOTE: always use await for DB operations
    const video = await Video.findById(videoId);
    // console.log("video: ",video)
    if(!video){
        throw new ApiError(404, "Video not Found, Wrong VideoID");
    }

    console.log("video.owner.toString(): ",video.owner);
    console.log("req?.user?._id.toString(): ",req?.user?._id.toString());
    if (video.owner.toString() != req?.user?._id.toString()){
        throw new ApiError(400, "You can't delete this Video as You are not the Owner");   
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId)

    // TODO: 
    // 1.delete video n thumbnail on Cloudinary
    // 2. delete likes, comments of the Video Deleted


    if(!videoDeleted){
        throw new ApiError(404, "Failed to Delete Video, Try Again");
    }


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}