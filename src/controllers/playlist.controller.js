import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    //TODO: create playlist

    if(!name || !description){
        throw new ApiError(400, "name and description are required")
    }

    // const playlistAlreadyExists = await Playlist.find({name: name})

    const playlistAlreadyExists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user),
                name: name
            }
        }
    ])

    

    if(playlistAlreadyExists.length > 0){
        console.log("playlistAlreadyExists: ",playlistAlreadyExists[0].name)
        console.log("playlist length:",playlistAlreadyExists.length)
        throw new ApiError(400, "Playlist Already Exists")
    }

    const playlistCreated = await Playlist.create({
        name,
        description,
        owner:req.user
    })

    return res.status(200).json(
        new ApiResponse(200, playlistCreated, "Playlist Created Successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId){
        throw new ApiError(400, 'User ID is required')
    }

    const userPlaylists = await Playlist.find({owner:req.user})

    console.log("userplaylists: ",userPlaylists)

    return res.status(200).json(
        new ApiResponse(200, userPlaylists, 'User Playlists Fetched Successfully')
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
        throw new ApiError(400, 'Playlist ID is required')
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, 'Invalid Playlist ID')
    }

    const playlist = await Playlist.findById(playlistId)

    console.log("playlist: ",playlist)

    return res.status(200).json(
        new ApiResponse(200, playlist, 'Playlist Fetched Successfully')
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "playlistId and videoId are required")
    }

    console.log("videoId: ", videoId)

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, 'Invalid VideoId')
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, 'Invalid PlaylistId')
    }

    const videoToBeUploaded = await Video.findById(videoId);
    const playlist = await Playlist.findById(playlistId);

    if(!videoToBeUploaded){
        throw new ApiError(400, "Video Not Found")
    }
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }
    
    if((playlist.owner.toString() && videoToBeUploaded.owner.toString())!= req.user._id.toString()){
        throw new ApiError(400, 'You are not the Owner for the Playlist or the Video')
    }

    const playlistUpdated = await Playlist.findByIdAndUpdate(playlistId,
        {
           $addToSet : {
            video: videoToBeUploaded
           } 
        },
        {
            new: true
        }
    )

    if(!playlistUpdated){
        throw new ApiError(400, "Failed to Add Video to Playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, playlistUpdated, "Video add to Playlist")
    )


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId){
        throw new ApiError(400, 'Playlist ID is required')
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, 'Invalid Playlist ID')
    }

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId)

    console.log("playlist: ",playlistDeleted)

    return res.status(200).json(
        new ApiResponse(200, 'Playlist Deleted Successfully')
    )    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId){
        throw new ApiError(400, 'Playlist ID is required')
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, 'Invalid Playlist ID')
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, 'No Playlist found with this playlistId')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            name: name ? name : playlist.name,
            description:description ? description : playlist.description
        },
        {
            new: 1
        }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    )


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}