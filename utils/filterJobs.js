const jobsData = require('../config/jobs-data.json');

function filterJobs({ status, WorkType, company }) {
    return jobsData.filter(job => {
        if (status && job.status !== status) return false;
        if (WorkType && job.WorkType !== WorkType) return false;
        if (company && job.company !== company) return false;
        return true;
    });
}

module.exports = { filterJobs };
