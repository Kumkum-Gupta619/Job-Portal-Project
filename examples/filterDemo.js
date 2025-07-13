const { filterJobs } = require('../utils/filterJobs');

// Example: Get all active jobs
const activeJobs = filterJobs({ status: 'active' });

console.log('Total active jobs:', activeJobs.length);
console.log('Active jobs:');
activeJobs.forEach((job, idx) => {
    console.log(`${idx + 1}. ${job.company} - ${job.position} (${job.WorkType})`);
});

// Example: Get all pending contract jobs
const pendingContractJobs = filterJobs({ status: 'pending', WorkType: 'contract' });
console.log('\nTotal pending contract jobs:', pendingContractJobs.length);
