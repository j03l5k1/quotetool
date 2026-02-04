// lib/servicem8.ts
// This file should be at: lib/servicem8.ts (NOT in the API route)

export function createServiceM8Client() {
  const auth = Buffer.from(
    `${process.env.SERVICEM8_EMAIL}:${process.env.SERVICEM8_PASSWORD}`
  ).toString('base64');

  const baseURL = 'https://api.servicem8.com/api_1.0';

  async function getJobData(jobNumber: string) {
    try {
      // 1. Search for job by generated_job_id
      const searchResponse = await fetch(
        `${baseURL}/job.json?%24filter=generated_job_id%20eq%20'${jobNumber}'`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`ServiceM8 API error: ${searchResponse.statusText}`);
      }

      const jobs = await searchResponse.json();

      if (!jobs || jobs.length === 0) {
        throw new Error(`Job ${jobNumber} not found`);
      }

      const job = jobs[0];

      // 2. Fetch company data
      const companyResponse = await fetch(
        `${baseURL}/company/${job.company_uuid}.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const company = await companyResponse.json();

      // 3. Fetch contact data (if exists)
      let contact = null;
      if (job.contact_uuid) {
        const contactResponse = await fetch(
          `${baseURL}/contact/${job.contact_uuid}.json`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          }
        );
        contact = await contactResponse.json();
      }

      // 4. Fetch assigned staff member
      let staff = null;
      
      // Try method 1: Check if job has assigned_to field
      if (job.assigned_to) {
        try {
          const staffResponse = await fetch(
            `${baseURL}/staff/${job.assigned_to}.json`,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            staff = {
              first: staffData.first || '',
              last: staffData.last || '',
              email: staffData.email || '',
              mobile: staffData.mobile || ''
            };
          }
        } catch (err) {
          console.log('Could not fetch staff from assigned_to:', err);
        }
      }

      // Try method 2: Check jobactivity for assigned staff (if method 1 didn't work)
      if (!staff) {
        try {
          const activityResponse = await fetch(
            `${baseURL}/jobactivity.json?%24filter=job_uuid%20eq%20'${job.uuid}'%20and%20active%20eq%201&%24orderby=edit_date%20desc&%24top=1`,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (activityResponse.ok) {
            const activities = await activityResponse.json();
            
            if (activities && activities.length > 0 && activities[0].staff_uuid) {
              const staffResponse = await fetch(
                `${baseURL}/staff/${activities[0].staff_uuid}.json`,
                {
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (staffResponse.ok) {
                const staffData = await staffResponse.json();
                staff = {
                  first: staffData.first || '',
                  last: staffData.last || '',
                  email: staffData.email || '',
                  mobile: staffData.mobile || ''
                };
              }
            }
          }
        } catch (err) {
          console.log('Could not fetch staff from jobactivity:', err);
        }
      }

      // Return all data including staff
      return {
        job: {
          uuid: job.uuid,
          job_address: job.job_address || '',
          generated_job_id: job.generated_job_id,
          job_description: job.job_description || ''
        },
        company: {
          uuid: company.uuid,
          name: company.name || '',
          phone: company.phone || '',
          email: company.email || '',
          address: company.address || ''
        },
        contact: contact ? {
          uuid: contact.uuid,
          first: contact.first || '',
          last: contact.last || '',
          email: contact.email || '',
          mobile: contact.mobile || '',
          phone: contact.phone || ''
        } : null,
        staff: staff
      };

    } catch (error) {
      console.error('Error in getJobData:', error);
      throw error;
    }
  }

  return {
    getJobData
  };
}
