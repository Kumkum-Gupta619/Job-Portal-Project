import mongoose from 'mongoose';
import jobsModel from '../models/jobsModel.js';
import moment from 'moment';

// @desc    Create a new job
// @route   POST /api/v1/jobs
// @access  Protected (requires authentication)
export const createJobController = async (req, res, next) => {
    // Destructure fields from req.body.
    // Use snake_case for work_type and work_location to match schema
    const { company, position, status, work_type, work_location } = req.body;

    // Basic validation for required fields
    if (!company || !position || !work_location) { // work_location is required as per schema
        return next('Please provide company, position, and work location');
    }

    try {
        // Create the job, ensuring field names match the schema
        const job = await jobsModel.create({
            company,
            position,
            status, // Will default to 'pending' if not provided
            work_type, // Correctly uses snake_case
            work_location, // Correctly uses snake_case
            created_by_id: req.user.userId // Correctly assigns created_by_id
        });
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job
        });
    } catch (error) {
        next(error); // Pass any Mongoose or other errors to the error handling middleware
    }
};

// @desc    Get all jobs for the authenticated user with filters, sorting, and pagination
// @route   GET /api/v1/jobs
// @access  Protected (requires authentication)
export const getAllJobsController = async (req, res, next) => {
    // Basic check for authenticated user ID
    if (!req.user || !req.user.userId) {
        return next('Authentication error: User ID not found.');
    }

    // Destructure query parameters. Use camelCase for query params for consistency
    // but remember to map to snake_case for the database query.
    const { status, workType, workLocation, search, sort, page, limit } = req.query;

    // Base query object to filter by the current user using the correct schema field name
    const queryObject = {
        created_by_id: req.user.userId // CORRECT: Matches jobsModel.js schema
    };

    // Apply status filter if provided
    if (status && status !== 'all') {
        queryObject.status = status;
    }

    // Apply workType filter if provided (map camelCase query param to snake_case schema field)
    if (workType && workType !== 'all') {
        queryObject.work_type = workType; // CORRECT: Matches jobsModel.js schema
    }

    // Apply workLocation filter if provided (map camelCase query param to snake_case schema field)
    if (workLocation && workLocation !== 'all') {
        queryObject.work_location = workLocation; // CORRECT: Matches jobsModel.js schema
    }

    // Apply search filter on 'position' if provided (case-insensitive regex)
    if (search) {
        queryObject.position = { $regex: search, $options: 'i' };
    }

    let queryResult = jobsModel.find(queryObject);

    // Apply sorting
    if (sort === 'latest') {
        queryResult = queryResult.sort('-createdAt'); // Newest first
    } else if (sort === 'oldest') {
        queryResult = queryResult.sort('createdAt'); // Oldest first
    } else if (sort === 'a-z') {
        queryResult = queryResult.sort('position'); // Alphabetical by position
    } else if (sort === 'z-a') {
        queryResult = queryResult.sort('-position'); // Reverse alphabetical by position
    } else {
        queryResult = queryResult.sort('-createdAt'); // Default sort
    }

    // Pagination logic
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    queryResult = queryResult.skip(skip).limit(limitNum);

    try {
        // Executes the query to get jobs for the current page
        const jobs = await queryResult;

        // Get the total count of jobs matching the filters (without pagination)
        const totalJobs = await jobsModel.countDocuments(queryObject);

        // Format jobs to match the desired output.
        // Uses the correct snake_case field names from the schema.
        const formattedJobs = jobs.map(job => ({
            _id: job._id,
            createdAt: job.createdAt,
            created_by_id: job.created_by_id, // CORRECT: Uses created_by_id
            work_location: job.work_location, // CORRECT: Uses work_location
            work_type: job.work_type,         // CORRECT: Uses work_type
            status: job.status,
            position: job.position,
            company: job.company
        }));

        res.status(200).json({
            success: true,
            totalJobs,
            jobs: formattedJobs,
            numOfPage: Math.ceil(totalJobs / limitNum),
            currentPage: pageNum
        });
    }
    catch (error) {
        next(error); // Pass any Mongoose or other errors
    }
};

// @desc    Update an existing job
// @route   PUT /api/v1/jobs/:id
// @access  Protected (requires authentication)
export const updateJobController = async (req, res, next) => {
    const { id } = req.params;
    // Use snake_case for fields matching the schema
    const { company, position, status, work_type, work_location } = req.body;

    if (!company || !position || !work_location) { // Added work_location check
        return next('Please provide company, position, and work location fields');
    }

    try {
        const job = await jobsModel.findOne({ _id: id });
        if (!job) {
            return next(`No job found with this id: ${id}`);
        }
        // CORRECT: Checks created_by_id for authorization
        if (req.user.userId !== job.created_by_id.toString()) {
            return next('You are not authorized to update this job');
        }
        const updatedJob = await jobsModel.findOneAndUpdate(
            { _id: id },
            // Use snake_case for fields matching the schema
            { company, position, status, work_type, work_location },
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            updatedJob
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a job
// @route   DELETE /api/v1/jobs/:id
// @access  Protected (requires authentication)
export const deleteJobController = async (req, res, next) => {
    const { id } = req.params; // Job ID from URL parameters

    try {
        // Find the job by its ID
        const job = await jobsModel.findOne({ _id: id });

        // If job not found
        if (!job) {
            return next(`No job found with this id: ${id}`);
        }

        // Authorization check: Ensure the user trying to delete created this job
        // CORRECT: Checks created_by_id for authorization
        // bhavesh ruk 5 minute m krti hu warden bula ri okay ja 
        if (req.user.userId !== job.created_by_id.toString()) {
            return next('You are not authorized to delete this job');
        }

        // Delete the job document
        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        next(error); // Pass errors to error handling middleware
    }
};

// @desc    Get job statistics (counts by status) and monthly application trends for the authenticated user
// @route   GET /api/v1/jobs/stats
// @access  Protected (requires authentication)
export const jobStatsController = async (req, res, next) => {
    // Basic check for authenticated user ID
    if (!req.user || !req.user.userId) {
        return next('Authentication error: User ID not found.');
    }

    // Convert string userId to Mongoose ObjectId for aggregation matching
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    try {
        // Aggregate job statistics by status for the current user
        const stats = await jobsModel.aggregate([
            {
                $match: {
                    created_by_id: userId // CORRECT: Matches jobsModel.js schema in aggregation
                }
            },
            {
                $group: {
                    _id: '$status', // Group by the 'status' field
                    count: { $sum: 1 } // Count documents in each status group
                }
            }
        ]);

        // Prepare default statistics, ensuring all statuses from your schema are present
        const defaultStats = {
            pending: 0,
            active: 0,
            inactive: 0
        };

        // Populate defaultStats with actual counts from the aggregation result
        stats.forEach(item => {
            defaultStats[item._id] = item.count;
        });

        // Aggregate monthly application trends for the current user
        let monthlyApplication = await jobsModel.aggregate([
            {
                $match: {
                    created_by_id: userId // CORRECT: Matches jobsModel.js schema in aggregation
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' }, // Extract year from job creation date
                        month: { $month: '$createdAt' } // Extract month from job creation date
                    },
                    count: { $sum: 1 } // Count jobs for each month-year combination
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }, // Sort by most recent year, then month
            { $limit: 12 }, // Get data for the last 12 months
            {
                $project: {
                    _id: 0, // Exclude the default aggregation _id
                    year: '$_id.year',
                    month: '$_id.month',
                    count: 1
                }
            }
        ]);

        // Format the monthly application data for display
        monthlyApplication = monthlyApplication.map(item => {
            const { year, month, count } = item;
            // moment.js months are 0-indexed, so subtract 1 from the MongoDB month (1-indexed)
            const date = moment().month(month - 1).year(year).format('MMM YY');
            return { date, count };
        }).reverse(); // Reverse to display oldest month first

        res.status(200).json({
            success: true,
            // Calculate total jobs by summing up the counts from the 'stats' aggregation result
            totalJobs: Object.values(defaultStats).reduce((acc, cur) => acc + cur, 0), // Sum from defaultStats
            defaultStats,
            monthlyApplication
        });
    } catch (error) {
        next(error); // Pass any aggregation or other errors to the error handling middleware
    }
};
