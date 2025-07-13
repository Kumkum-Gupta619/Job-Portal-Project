// config/fix-jobs-data.js
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'jobs-data.json');
const jobs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const updatedJobs = jobs.map(job => {
  // Copy all fields except created_by_id
  const { created_by_id, ...rest } = job;
  return {
    ...rest,
    createdBy: String(created_by_id)
  };
});

fs.writeFileSync(filePath, JSON.stringify(updatedJobs, null, 2));
console.log('jobs-data.json updated: created_by_id → createdBy (string)');