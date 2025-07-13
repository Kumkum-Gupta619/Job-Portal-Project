import express from 'express'
import { updateUserController } from '../controllers/userController.js';
import userAuth from '../middlewares/authMIddleware.js';

//router object 
const router = express.Router()

// UPDATE USER || PUT
router.put('/update-user', userAuth, updateUserController)

export default router