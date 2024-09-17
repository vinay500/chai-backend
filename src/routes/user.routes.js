import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, updateWatchHistory } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


// url for below route is http://127.0.0.1:8000/api/v1/users/register
// router.route("/register").post(registerUser)

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

    
router.route("/login").post(loginUser)

// router.route("")

// secured routes
// in this route, verifyJWT is executed before logoutUser 
// in verifyJWT, the user object is added to the request as req.user
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
// use patch for this route and not post because using patch it will update only few details and but by using put it will update all the details 
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
// this route will update the avatar of the user so as it is a file uploading 
// so we will use upload middleware(multer) to upload the file 
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
// this is how we are getting the params so in route we are using :username
// const { username } = req.params
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)
router.route("/updatehistory/:videoId").post(verifyJWT, updateWatchHistory)

export default router