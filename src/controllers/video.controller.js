import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {Subscription} from "../models/subscription.model.js"
import { updateWatchHistory } from "./user.controller.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // console.log("req.query: ",req.query)

    const { page = 1, limit = 10, query, sortBy, sortType, userId, onlySubscribed } = req.query;

    // query is used to search for video title and desc
    // sortBy is used to tell on which field sorting should happen
    // sortType is asc/desc
    
    const sortOrder = sortType.toLowerCase() === 'asc' ? 1 : -1

    const pipeline = []

    if (query) {
        console.log("query: ",query)
        // Search case: Full-text search for the provided query
        pipeline = [
            {
                $search: {
                    index: "video_searching",
                    text: {
                        query: query,
                        path: ['title', 'description']
                    }
                }
            }
        ];
    }

    if(onlySubscribed){
        pipeline = [
            {
                
            }
        ]
    }

    const videoAggregate = Video.aggregate([
        ...pipeline,
        // getAllVideos api will return all the published videos rather than only user published videos  
        // {
        //     $match:{
        //         owner: new mongoose.Types.ObjectId(userId)
        //     }
        // },
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
                            "_id": 0,
                            "username": 1, 
                            "avatar": 1
                        }
                    }
                ]
            }
        },
        // without unwind the owner details will be an array of an object, 
        // but with unwind it is an object
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                "owner": 0
            }
        }
    ])

    // console.log("videos: ",videoAggregate)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 2)
    }

    const videos = await Video.aggregatePaginate(videoAggregate, options)

    console.log("videos in getAllVideos: ",videos)

    return res.status(200).json(
        new ApiResponse(200, videos, 'Video Fetched Successfully')
    )
})


const getSubscribedChannelVideos = asyncHandler( async (req, res) => {
    console.log("in getSubscribedChannelVideos()");
    console.log("req.query: ",req.query)
    const { page = 1, limit = 10, query, sortBy, sortType, userId, onlySubscribed } = req.query
    console.log("page = 1, limit = 3, sortBy, sortType, userId: ", page, limit, query, sortBy, sortType, userId)

    // this aggregation is working for getting videos of subscribed channels 
    // along with avatar, username of video owner details
    // [
    //     {
    //               $match:{
    //                   subscriber: { "$oid": "6629e4e9344538a98c6406e0" }
    //               }
          
    //           },
    //   {
    //                 $lookup:{
    //                   from: "videos",
    //                   localField: "channel",
    //                   foreignField: "owner",
    //                   as: "subscribedVideos",
                      
    //                   }
    //               },
    //     {
    //       $unwind: "$subscribedVideos"
    //     },
    //     {
    //       $lookup: {
    //         from: "users",
    //         localField: "subscribedVideos.owner",
    //         foreignField: "_id",
    //         as: "ownerdetails",
    //         pipeline:[
    //           {
    //             "$project":{
    //               "username":1,
    //               "avatar":1
    //             }
    //           }
    //         ]
    //       }
    //     }
              
    //   ]

    

    const req_userId =  req.user._id;
    console.log("req_userId: ",req_userId)

    const subscribedChannelVideosAggregate = Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(req_userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "channel",
                foreignField: "owner",
                as: "subscribedVideos",
            }
        },
        {
            $unwind: "$subscribedVideos"
        },
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"ownerdetails",
                pipeline:[
                    {
                        $project:{
                            "_id": 0,
                            "avatar": 1,
                            "username": 1
                        }
                    }
                ]
            }
        },
        // {
        //     $project: {
        //       subscriber: 1,
        //       subscribedVideos: {
        //         video: 1,
        //         ownerDetails: {
        //           avatar: 1,
        //           username: 1
        //         }
        //       }
        //     }
        // }
    ])

    const options = {
        page: 1,
        limit: 10
    }

    const subscribedChannelVideos = await Subscription.aggregatePaginate(subscribedChannelVideosAggregate, options)

    console.log("subscribedChannelVideos: ",subscribedChannelVideos);

    return res.status(200).json( 
        new ApiResponse(200, subscribedChannelVideos, "Subscribed Channel Videos Fetched Successfully")
    )




    // const aggregationPipeline = [
    //     {
    //         $lookup: {
    //             from: "subscriptions",
    //             localField: "_id",
    //             foreignField: "channel",
    //             as: "subscriptions"
    //         }
    //     },
    //     {
    //         $unwind: "$subscriptions"
    //     },
    //     {
    //         $match: {
    //             "subscriptions.subscriber": new mongoose.Types.ObjectId(req.user._id)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "owner",
    //             foreignField: "owner",
    //             as: "videos"
    //         }
    //     },
    //     {
    //         $unwind: "$videos"
    //     },
    //     {
    //         $sort: {
    //             "videos.createdAt": -1 // Sort by video creation date in descending order
    //         }
    //     },
    //     {
    //         $project: {
    //             // Include relevant fields from the video and subscription documents
    //             _id: 1,
    //             title: "$videos.title",
    //             description: "$videos.description",
    //             thumbnail: "$videos.thumbnail",
    //             duration: "$videos.duration",
    //             views: "$videos.views",
    //             isPublished: "$videos.isPublished",
    //             owner: "$videos.owner",
    //             createdAt: "$videos.createdAt",
    //             subscription: {
    //                 subscriber: "$subscriptions.subscriber",
    //                 channel: "$subscriptions.channel"
    //             }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$videos.owner", // Group by channel owner
    //             videos: {
    //                 $push: {
    //                     _id: "$videos._id",
    //                     title: "$videos.title",
    //                     description: "$videos.description",
    //                     thumbnail: "$videos.thumbnail",
    //                     duration: "$videos.duration",
    //                     views: "$videos.views",
    //                     isPublished: "$videos.isPublished",
    //                     createdAt: "$videos.createdAt"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             _id: 0,
    //             videos: 1
    //         }
    //     }
    // ];


    // Video.aggregate(aggregationPipeline)
    // .then(results => {
    //     console.log(results); // The results will contain an array of objects, each representing a channel and its videos
    // })
    // .catch(error => {
    //     console.error(error);
    // });

    // const options = {
    //     page: 1,
    //     limit: 10
    // }

    // const videos = Video.aggregatePaginate(aggregationPipeline, options)

    // console.log("videos: ",videos)

    // return res.status(200).json( 
    //         new ApiResponse(200, videos, "Subscribed Channel Videos Fetched Successfully")
    //     )
    
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
    console.log("videoId: ",videoId)

    // const videoDetails = await Video.findById(videoId)
    // TODO:
    // 1.get video no. of likes and dislikes, 
    //      channel name, avatar, no.of subs, sub or not 
    
    const videoDetails = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            "_id": 0,
                            "username": 1,
                            "avatar": 1
                        }
                    }
                ]
            },
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            },
        },
        {
            $lookup:{
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "videoDislikes"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"owner",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$videoLikes"
                },
                dislikeCount:{
                    $size: "$videoDislikes"
                },
                subscribersCount:{
                    $size: "$subscribers"
                }
            }
        },
        {
            $project:{
                "_id": 0,
                "videoFile": 1,
                "thumbnail": 1,
                "title": 1,
                "description": 1,
                "duration": 1,
                "views": 1,
                "isPublished": 1,
                // "owner": "66a28d484ac26491e3533d2a",
                "createdAt": 1,
                // "updatedAt": "2024-09-11T16:44:45.056Z",
                // "__v": 0,
                // "ownerDetails": [
                //     {
                //         "username": "user6",
                //         "avatar": "http://res.cloudinary.com/ddenr3vgm/image/upload/v1721929030/yiwh1f2tjutaz9uoggze.jpg"
                //     }
                // ],
                ownerDetails: 1,
                // "videoLikes": [],
                // "videoDislikes": [],
                "likesCount": 1,
                "dislikeCount": 1,
                "subscribersCount": 1
            }
        }
    ])

    console.log("video: ",videoDetails);
    if(!videoDetails){
        console.log("!video")
        throw new ApiError(401, "Video fetched failed");
    }else{
        console.log("Video fetched Successfully")

        // const addVideoToWatchHistory =  updateWatchHistory(req,res)
        // console.log("addVideoToWatchHistory: ",addVideoToWatchHistory)
        // console.log("!addVideoToWatchHistory: ",!addVideoToWatchHistory)
        // if(!addVideoToWatchHistory){
        //     console.log("!addVideoToWatchHistory")
        //     throw new ApiError("Video fetched failed");
        // }

        await Video.findByIdAndUpdate(videoId,
            {
                $inc: {
                    views: 1    
                }
            }
        )

        await User.findByIdAndUpdate(req?.user._id,
            {
                $push:{
                    watchHistory: await Video.findById(videoId)
                }
            }
        )
    }   
    return res.status(200).json(
        new ApiResponse(200, videoDetails, "Video fetched Successfully")
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
    togglePublishStatus,
    getSubscribedChannelVideos
}