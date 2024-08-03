import { Router } from 'express'
import { verifyJwt } from '../middleware/auth.middleware.js'
import { createPost, deletePost, getPosts, likePost } from '../controllers/post.controllers.js'
import { upload } from '../middleware/multer.middleware.js'

const router = Router()

router.route('/createpost')
    .post(verifyJwt, upload.fields([
        {
            name: "postImg",
            maxCount: 1
        }
    ]), createPost)

router.route('/posts').get(verifyJwt, getPosts)
router.route('/deletepost/:_id').delete(verifyJwt, deletePost)
router.route("/postslike/:id/like").put(verifyJwt, likePost)

// router.route('/posts/:id').get(verifyJwt, getPosts)

export default router