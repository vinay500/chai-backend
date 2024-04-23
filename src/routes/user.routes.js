import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()


// url for below route is http://127.0.0.1:8000/users/register
router.route("/register").post(registerUser)
// router.route("/login").post(loginUser)



export default router