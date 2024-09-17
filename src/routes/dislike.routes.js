import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { dislikeVideo } from "../controllers/dislike.controller.js";
import { dislikeComment } from "../controllers/dislike.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/v/:videoId").post(dislikeVideo);
router.route("/c/:commentId").post(dislikeComment);

export default router;
