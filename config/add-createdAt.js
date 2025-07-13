import fs from 'fs';

// Read the jobs-data.json file
const jobs = JSON.parse(fs.readFileSync('./config/jobs-data.json', 'utf-8'));

// Add a random createdAt date within the last year to each job
const jobsWithCreatedAt = jobs.map(job => ({
  ...job,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
}));

// Write the updated jobs back to the file
fs.writeFileSync('./config/jobs-data.json', JSON.stringify(jobsWithCreatedAt, null, 2));

console.log('Added createdAt to all jobs!');