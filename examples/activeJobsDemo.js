const jobsData = require('../config/jobs-data.json');
const { getActiveJobs } = require('../utils/jobStats');

const activeJobStats = getActiveJobs(jobsData);
console.log('Active Jobs Summary:');
console.log('-------------------');
console.log(`Total Active Jobs: ${activeJobStats.totalActive}`);
console.log('\nActive Job Listings:');
activeJobStats.jobs.forEach((job, index) => {
    console.log(`\n${index + 1}. Company: ${job.company}`);
    console.log(`   Position: ${job.position}`);
    console.log(`   Work Type: ${job.workType}`);
    console.log(`   Location: ${job.location}`);
});
