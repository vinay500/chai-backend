import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";


const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "chai aur code backend"
    // })
    const { fullName, email, password } = req.body;
    console.log('email: ',email);
    if(
        [fullName, email, password].some(
            (value) => value?.trim() === ""
        )
    ){
        throw new ApiError(500, "All Fields are Required")
    }

    const existedUser = User.findOne({
        $or: [ { email }, { username }]
    })

    if(existedUser){
        throw new ApiError(409, "User with Email or Username already Exists")
    }
    res.status(200).json({
        message: email
    })
})


export { registerUser }