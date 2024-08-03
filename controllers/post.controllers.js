import { uploadOnCloudnary } from "../cloudnary/cloudnary.js"
import { Post } from "../models/post.model.js"

const createPost = async (req, res) => {
    try {
        const { title, content, category } = req.body
        const author = req.user._id
        console.log(author);
        if (!author) return res.status(400).json({ message: "user not found" })

        let postImgLocalpath;
        if (req.files && Array.isArray(req.files.postImg) && req.files.postImg.length > 0) {
            postImgLocalpath = req.files?.postImg[0]?.path;

        }

        if (!postImgLocalpath) {
            return res.status(400).json({ message: "Post Image Is required" })
        }

        const postImg = await uploadOnCloudnary(postImgLocalpath)
        console.log(postImgLocalpath);
        const post = await Post.create({
            title, content, category, author, postImg: postImg.url
        })

        const createdPost = await Post.findById(post._id)
        if (!createdPost) return res.staus(500).json({ message: "Something went worng while creating user" })
        return res.status(200).json({
            createdPost: createdPost, message: "Post created successfully"
        })
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }

}

const getPosts = async (req, res) => {
    try {
        const postId = req.query._id;
        if (postId) {
            const post = await Post.findById({ _id: postId })

            return res.status(200).json({ post: post, message: "Post data fetched successfully" })
        }
        else {

            const post = await Post.find().sort({ createdAt: -1 })
            return res.status(200).json({ posts: post, message: "Posts data fetched successfully" })
        }
    } catch (error) {
        return res.status(500).json({ message: "Someting went wrong", error: error.message })
    }
}

const deletePost = async (req, res) => {
    try {
        const postId = req.params._id

        const post = await Post.findById({ _id: postId })
        if (!post) {
            return res.status(400).json({ message: "Post Not found" })
        }
        const deletePost = await Post.findByIdAndDelete({ _id: postId })

        return res.status(200).json({ message: "Post data deleted successfully" })
    } catch (error) {
        return res.status(500).json({ message: "Someting went wrong", error: error.message })
    }
}

const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id; // Assuming you have user authentication and can get the logged-in user's ID

        let post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // Unlike the post
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Like the post
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            likes: post.likes.length,
            liked: !hasLiked
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export {
    createPost,
    getPosts,
    deletePost,
    likePost
}