import express from 'express';
import userAuth from '../middlewares/authMIddleware.js';
import { createJobController, deleteJobController, getAllJobsController, jobStatsController, updateJobController } from '../controllers/jobsCOntroller.js';

const router = express.Router();

// Create job
router.post('/create-job', userAuth, createJobController);

// Get jobs
router.get('/get-jobs', userAuth, getAllJobsController);


// Update job
router.patch('/update-job/:id', userAuth, updateJobController);

//DELETE JOB // DELETE
router.delete('/delete-job/:id', userAuth, deleteJobController);

//JOB STATS FILTER// GET
router.get('/job-stats', userAuth, jobStatsController);





export default router;