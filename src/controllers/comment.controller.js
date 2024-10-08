import mongoose, { connect, isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { ownerOrNot } from "../utils/checkOwnerPermission.js"
import { registerUser } from "./user.controller.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 5} = req.query
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    // dont use await
    const videoCommentsAggregate = await Comment.aggregate([
    // const videoCommentsAggregate =  Comment.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id),
                video: videoId
            }
        }
    ])

    // console.log("videoCommentsAggregate: ", videoCommentsAggregate)

    const videoComments = await Comment.aggregatePaginate(videoCommentsAggregate, options)

    console.log("videoComments: ", videoComments)

    return res.status(200).json(
        new ApiResponse(200, videoComments, "Video Comments Fetched")
    )    

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    
    console.log("in addComment")

    if(!content){
        throw new ApiError(400, "Content is Required");
    }

    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is Required");
    }
    console.log("video id: ",videoId);
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Invalid Video ID");
    }

    console.log("got video");

    const user = req?.user;
    
    if(!user){
        throw new ApiError(400, "Login and Try Again");
    }


    const comment = await Comment.create({
        content,
        video,
        owner:user
    })

    console.log("comment created");

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment created Successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // get comment by id
    // use Comment.findByIdAndUpdate(set)
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    // const checkOwner = ownerOrNot(comment,req);

    // console.log("checkOwner:",checkOwner);

    // if(!checkOwner || checkOwner == "Error Occured"){
    //     throw new ApiError(400,"You can't Update the Tweet as you are not the Owner");
    // }

    const { content } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content: content,
            }
        },
        {
            new: true
        }
    )

    if(!updatedComment){
        throw new ApiError(400, "Can't Update Comment, Try Again");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment Updated Successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    console.log("comment: ",comment);

    // const checkOwner = ownerOrNot(comment, req);

    // console.log("checkOwner:",checkOwner);

    // if(!checkOwner || checkOwner == "Error Occured"){
    //     throw new ApiError(400,"You can't Update the Tweet as you are not the Owner");
    // }


    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400, "Can't Delete Comment, Try Again");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedComment, "Comment Deleted Successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }