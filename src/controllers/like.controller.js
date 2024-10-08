import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"



const toggleVideoLike = asyncHandler(async (req, res) => {
    console.log("in liking the video");
    const {videoId} = req.params
    //TODO: toggle like on video
    // if the video is already liked then remove the like obj 
    // if not liked then add the like obj 

    console.log("liking the video");

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }

    const alreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(alreadyLiked){
        const deleteLike = await Like.findByIdAndDelete(alreadyLiked?._id)
        
        return res.status(200).json(
            new ApiResponse(200, {}, "Video Unlicked Successfully")
        )
    }

    const likeVideo = await Like.create({
        video: await Video.findById(videoId),
        likedBy: req.user
    })

    return res.status(200).json(
        new ApiResponse(200, likeVideo, "Video Licked Successfully")
    )


})


const disLikeVideo = asyncHandler(async (req, res) => {

    console.log("disliking the video")
    const { videoId } = req.params
    console.log("videoId: ",videoId)

    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const aleadyLikedVideoOrNot = await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })

    if(!aleadyLikedVideoOrNot){
        console.log("not liked video before")
        return res.status(200).json(
            new ApiResponse(200, "", "Video Disliked Successfully")
        )
    }

    const likeId = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })
    console.log("found existing video like:",likeId)

    const removeLike = await Like.findByIdAndDelete(likeId)

    if (!removeLike){
        console.log("video dislinking failed")
        return new ApiError(400,"Video Disliked Failed")
    }

    console.log("video disliked successfully")

    return res.status(200).json(
        new ApiResponse(200, removeLike, "Video Disliked Successfully")
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    console.log("commentid: ",commentId)
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const alreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(alreadyLiked){
        const deleteLike = await Like.findByIdAndDelete(alreadyLiked?._id)
        
        return res.status(200).json(
            new ApiResponse(200, deleteLike,"Comment Unlicked Succesfully")
        )
    }

    const likeComment = await Like.create({
        comment: await Comment.findById(commentId),
        likedBy: req.user
    })
    // if(likeComment){
    //     console.log("comment liked successfully")
    // }

    return res.status(200).json(
        new ApiResponse(200, likeComment, "Comment Licked Succesfully")
    )

})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    const alreadyLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(alreadyLiked){
        const deleteLike = await Like.findByIdAndDelete(alreadyLiked?._id)
        
        return res.status(200).json(
            new ApiResponse(200, "Tweet Unlicked Succesfully")
        )
    }

    const likeTweet = await Like.create({
        tweet: await Tweet.findById(tweetId),
        likedBy: req.user
    })

    return res.status(200).json(
        new ApiResponse(200, likeTweet, "Tweet Licked Succesfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Video.aggregate([
        {
           $match:{
                owner:new mongoose.Types.ObjectId(req?.user?._id)
           } 
        },
        {
            $lookup:{
                from:"likes",
                foreignField:"video",
                localField:"_id",
                as:"likedVideos"
            }
        },
        {
            $project: {
                _id: 0,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
            }
        }
        // TODO: get user details who liked the video
    ])

    console.log("likedVideos: ",likedVideos);

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked Videos Fetched Successfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    disLikeVideo,
    getLikedVideos
}