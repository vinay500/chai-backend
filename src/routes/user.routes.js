import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
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


export default router