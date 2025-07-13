const getActiveJobs = (jobs) => {
    const activeJobs = jobs.filter(job => job.status === 'active');

    const summary = {
        totalActive: activeJobs.length,
        jobs: activeJobs.map(job => ({
            company: job.company,
            position: job.position,
            workType: job.WorkType,
            location: job.work_location
        }))
    };

    return summary;
};

module.exports = { getActiveJobs };
