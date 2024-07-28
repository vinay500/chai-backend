import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    console.log("get all videos api is not done")

    // query is used to search for video title and desc
    // sortBy is used to tell on which field sorting should happen
    // sortType is asc/desc
    
    const sortOrder = sortType.toLowerCase() === 'asc' ? 1 : -1

    const videoAggregate = await Video.aggregate([
        {
            $search:{
                index: "video_searching",
                text: {
                    query: query,
                    path: ['title', 'description']
                }
            }
        },
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $match:{
                isPublished: true
            }
        },
        {
          $sort: { [sortBy]: sortOrder }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: "ownerDetails",
                pipeline:[
                    {
                        $project: {
                            username: 1, 
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    ])

    console.log("videos: ",videoAggregate)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const videos = await Video.aggregatePaginate(videoAggregate, options)

    console.log("videos: ",videos)

    return res.status(200).json(
        new ApiResponse(200, videos, 'Video Fetched Successfully')
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    console.log("in publishAVideo")
    const { title, description} = req.body
    console.log(`title: ${title} description: ${description}`)
    // TODO: get video, upload to cloudinary, create video
    // console.log("req.files: ",req.files.videoFile[0].path)
    console.log("req.files.videoFile: ",req.files.videoFile[0]?.path)
    console.log("req.files.thumbnail: ",req.files.thumbnail[0]?.path)
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
    console.log("video: ",video);
    if(!video){
        console.log("!video")
        throw new ApiError("Video fetched failed");
    }else{
        console.log("Video fetched Successfully")
        await Video.findByIdAndUpdate(videoId,
            {
                $inc: {
                    views: 1    
                }
            }
        )
    }   
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
        // new: true will tell mongodb to return the 
        // modified document rather than the original document
        { new: true }
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

    if(!videoId){ 
        throw new ApiError(400, 'VideoID is required')
    }

    const video = await Video.findById(videoId)

    if(!video){ 
        throw new ApiError(400, 'Invalid VideoID')
    }
    console.log("video fetched")
    if(video.owner.toString() != req.user._id.toString()){
        throw new ApiError(400, 'You are Not the Owner of the Video')
    }
    console.log("toggling video publish status")
    const videoPublishUpdated = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:!video.isPublished
        }
    },
    {
        new : 1
    }
);
    console.log("videoPublishUpdated: ",videoPublishUpdated)

    if(!videoPublishUpdated){
        throw new ApiError(400, 'Something Went Wrong, Try Again')
    }

    return res.status(200).json(
        new ApiResponse(200, videoPublishUpdated, "Video Publish Toggle Successfully")
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}