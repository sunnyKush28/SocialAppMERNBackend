import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log(error)
        })

        // app.get("/", (req, res) => {
        //     res.json({ message: "Hello" })
        // })

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running on PORT: http://localhost:${process.env.PORT} `)
        })
    }).catch((error) => {
        console.log(`MongoDb connection Failed: `, error);
    })
