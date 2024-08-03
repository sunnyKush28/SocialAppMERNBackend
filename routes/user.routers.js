import { Router } from 'express'
import { getCurrentUser, getUserThroughId, refreshAcessToken, userLogIn, userLogout, userProfile, userRegister } from '../controllers/user.controller.js'
import { upload } from '../middleware/multer.middleware.js'
import { verifyJwt } from '../middleware/auth.middleware.js'

const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
    {
        name: "coverImage",
        maxCount: 1,
    },
]), userRegister)

router.route("/login").post(userLogIn)
router.route("/logout").post(verifyJwt, userLogout)
router.route("/refreshtoken").post(refreshAcessToken)
router.route('/current-user').get(verifyJwt, getCurrentUser)
router.route('/userprofile').get(verifyJwt, userProfile)
router.route('/userinfo/:id').get(verifyJwt, getUserThroughId)





export default router