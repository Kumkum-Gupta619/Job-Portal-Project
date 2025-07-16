import mongoose from 'mongoose';
import jobsModel from '../models/jobsModel.js'
import moment from 'moment';
import companyModel from '../models/company.model.js';

// we need to import the companyModel to interact with the database
// @desc    Create a new job
// @route   POST /api/v1/jobs
// @access  Protected (requires authentication)


export const createJobController = async (req, res, next) => {
    var { title, description, salary, location, jobType, company, position, status, experience } = req.body;
    console.log('req.body in createJobController:', req.body); // Debugging line to check the request body

    if (!title || !description || !salary || !company || !position || !location) { // work_location is required as per schema
        return next('Please provide company, position, and work location');
    }

    try {
        // Create the job, ensuring field names match the schema

        // we need to fetch the company details from the companyModel
        // if the company does not exist, we can create a new company
        var companyExists = await companyModel.findOne({ name: company });//check if company exists
        if (!companyExists) {
            const newCompany = await companyModel.create({
                name: company,
                domain: 'General'
            })
            await newCompany.save();
            company = newCompany._id; // Use the new company's ObjectId
        }
        console.log('Company exists:', companyExists._id); // Debugging line to check company existence
        company = companyExists._id; // Use the existing company's ObjectId

        const job = await jobsModel.create({
            title,
            description,
            salary,
            location,
            jobType,
            position,
            experience,
            company,
            status, // Will default to 'pending' if not provided
            created_by: req.user.userId // Correctly assigns created_by_id
        });
        if (!job) {
            return res.status(400).json({
                success: false,
                message: 'job creation failed'
            })
        }
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job
        });
    } catch (error) {
        next(error); // Pass any Mongoose or other errors to the error handling middleware
    }
};


// most of completed if you want to update something then you can do it
//it cannot show the filter item na
// you just add regular expression in the query
export const getAllJobsController = async (req, res, next) => {
    try {
        const { status, keyword, sort } = req.query;

        // --- DEBUGGING: Log received sort parameter ---
        console.log("Received 'sort' parameter:", sort);

        // Start building the query object for filtering
        const query = {};

        // Apply keyword search across multiple fields if provided
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { position: { $regex: keyword, $options: 'i' } },
                { status: { $regex: keyword, $options: 'i' } },
                { WorkType: { $regex: keyword, $options: 'i' } }, // Assuming WorkType is a field
                { work_location: { $regex: keyword, $options: 'i' } } // Assuming work_location is a field
            ];
        }

        // You can add more filters here based on 'status' or other fields
        if (status) {
            query.status = status; // Example: filter by exact status
        }

        // Initialize the Mongoose query chain
        // Start with find() and populate(), but don't execute yet
        let queryChain = jobsModel.find(query).populate('company', 'name domain');

        // Apply sorting based on the 'sort' query parameter
        if (sort === 'latest') {
            queryChain = queryChain.sort("-createdAt"); // Latest first
            console.log("Applying sort: latest (-createdAt)");
        } else if (sort === 'oldest') {
            queryChain = queryChain.sort("createdAt"); // Oldest first
            console.log("Applying sort: oldest (createdAt)");
        } else if (sort === 'a-z') {
            queryChain = queryChain.sort("position"); // Position A-Z
            console.log("Applying sort: a-z (position)");
        } else if (sort === 'A-Z' || sort === 'z-a') {
            queryChain = queryChain.sort("-position"); // Position Z-A
            console.log("Applying sort: A-Z/z-a (-position)");
        } else {
            // Default sort if no valid 'sort' parameter is provided
            queryChain = queryChain.sort("-createdAt");
            console.log("Applying default sort: latest (-createdAt)");
        }

        // Execute the query after all conditions and sorts are applied
        const jobs = await queryChain.exec();

        // --- DEBUGGING: Log the positions of the fetched jobs before sending response ---
        console.log("--- Fetched Jobs (Positions and Creation Dates) ---");
        if (jobs && jobs.length > 0) {
            jobs.forEach(job => {
                console.log(`Position: "${job.position || 'N/A'}" | CreatedAt: "${job.createdAt || 'N/A'}"`);
            });
        } else {
            console.log("No jobs fetched to display.");
        }
        console.log("---------------------------------------------------");


        if (!jobs || jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No jobs found matching your criteria'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Jobs fetched successfully',
            jobs // Send the correctly sorted 'jobs' array
        });

    } catch (error) {
        console.error('Error in getAllJobsController:', error); // Use console.error for errors
        next(error); // Pass any Mongoose or other errors to the error handling middleware
    }
};


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
