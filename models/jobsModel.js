import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        salary: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        jobType: {
            type: String,
            enum: ['full-time', 'part-time', 'internship', 'contract'],
            default: 'full-time',
        },
        position: {
            type: String,
            required: [true, 'Job position is required'],
            maxlength: 100,
        },
        status: {
            type: String,
            enum: ['pending', 'reject', 'interview'],
            default: 'pending',
        },
        experience: {
            type: String,
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        applications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Application",
            },
        ],
    },
    { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);

