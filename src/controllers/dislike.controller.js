import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const dislikeVideo = asyncHandler(async (req, res)=>{
    console.log("disliking video")

    const { videoId } = req.params;

    console.log("videoid: ",videoId)

    if(!videoId){
        console.log("videoid not found")
        throw new ApiError(400, "Video Id is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        console.log("video not found for the videoID, invalid video id")
        throw new ApiError(400, "Video not found")
    }

    const alreadyDisliked = await Dislike.findOne(
        {
            video: videoId,
            dislikedBy: req.user._id
        }
    )

    if(alreadyDisliked){
        if(alreadyDisliked){
            const removeDislike = await Dislike.findByIdAndDelete(alreadyDisliked._id)
            if(removeDislike){
                console.log("video dislike removed")
                return res.status(200).json(
                    new ApiResponse(200, removeDislike, "Video Disliked Removed Successfully")
                )
            }
        }
        // console.log("video already disliked")
        // return res.status(200).json(
        //     new ApiResponse(200, alreadyDisliked, "Video Disliked Successfully")
        // )
    }

    const dislikingVideo = await Dislike.create(
        {
            video: await Video.findById(videoId),
            dislikedBy: req.user
        }
    )

    if(!dislikingVideo){
        console.log("Video Disliked Failed, Try Again")
        return new ApiError(400, "Video Disliked Failed, Try Again")
    }

    console.log("video disliked successfully")

    return res.status(200).json(
        new ApiResponse(200, dislikingVideo, "Video Disliked Successfully")
    )

})


const dislikeComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;

    console.log("commentId: ",commentId)

    if(!commentId){
        console.log("commentId not found")
        throw new ApiError(400, "commentId is required");
    }

    const alreadyDisliked = await Dislike.findOne({
        comment: commentId,
        dislikedBy: req.user._id
    })



    if(alreadyDisliked){
        console.log("comment alreadyDisliked")
        const removeDislike = await Dislike.findByIdAndDelete(alreadyDisliked._id)
        if(removeDislike){
            console.log("comment dislike removed")
            return res.status(200).json(
                new ApiResponse(200, removeDislike, "Comment Disliked Removed Successfully")
            )
        }
    }

    console.log("disliking the comment")

    const dislikingComment = await Dislike.create({
        comment: await Comment.findById(commentId),
        dislikedBy: req.user
    })

    if(!dislikingComment){
        console.log("comment disliking failed")
        return res.status(200).json(
            new ApiResponse(200, "", "Comment Disliking Failed")
        )
    }

    console.log("Comment disliked successfully")

    return res.status(200).json(
        new ApiResponse(200, dislikingComment, "Comment Disliked Successfully")
    )

})

export {
    dislikeVideo,
    dislikeComment
}