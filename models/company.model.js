import mongoose from "mongoose";
const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Company name is required'],
            unique: true, // Ensure company names are unique
        },
        domain: {
            type: String,
            required: [true, 'Company domain is required'],
            default: 'General', // Default domain if not provided
            // wait  listen 1 br mongo db ka data dekho and jobs data.json ka data dekho

        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    });
const companyModel = mongoose.model("Company", companySchema);
export default companyModel;