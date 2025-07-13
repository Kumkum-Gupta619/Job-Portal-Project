import fs from 'fs';

// Read the jobs-data.json file
const jobs = JSON.parse(fs.readFileSync('./config/jobs-data.json', 'utf-8'));

// Add updatedAt field (same as createdAt or current date)
const jobsWithUpdatedAt = jobs.map(job => ({
  ...job,
  updatedAt: job.createdAt || new Date().toISOString()
}));

// Write the updated jobs back to the file
fs.writeFileSync('./config/jobs-data.json', JSON.stringify(jobsWithUpdatedAt, null, 2));

console.log('Added updatedAt to all jobs!');