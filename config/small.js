import fs from 'fs';

// Read your jobs-data.json file
const jobs = JSON.parse(fs.readFileSync('./jobs-data.json', 'utf-8'));

// Convert createdAt to MongoDB Extended JSON format
const jobsWithDate = jobs.map(job => ({
    ...job,
    createdAt: { "$date": job.createdAt }
}));

// Write back to the file
fs.writeFileSync('./jobs-data.json', JSON.stringify(jobsWithDate, null, 2));

console.log('All createdAt fields converted to MongoDB Extended JSON format!');