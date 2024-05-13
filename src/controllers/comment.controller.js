import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    
    if(!content){
        throw new ApiError(400, "Content is Required");
    }

    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is Required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Invalid Video ID");
    }

    const user = req.user;
    
    if(!user){
        throw new ApiError(400, "Login and Try Again");
    }

    const comment = await Comment.create({
        content,
        video,
        user
    })

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment created Successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }