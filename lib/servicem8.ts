// lib/servicem8.ts - API KEY VERSION (TypeScript safe)

export function createServiceM8Client() {
  const apiKey = process.env.SERVICEM8_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERVICEM8_API_KEY environment variable is not set');
  }

  const baseURL = 'https://api.servicem8.com/api_1.0';
  
  // Type-safe headers helper
  const getHeaders = (): HeadersInit => ({
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  });

  async function getJobData(jobNumber: string) {
    try {
      // 1. Search for job by generated_job_id
      const searchResponse = await fetch(
        `${baseURL}/job.json?%24filter=generated_job_id%20eq%20'${jobNumber}'`,
        { headers: getHeaders() }
      );

      if (!searchResponse.ok) {
        throw new Error(`ServiceM8 API error: ${searchResponse.statusText}`);
      }

      const jobs = await searchResponse.json();

      if (!jobs || jobs.length === 0) {
        throw new Error(`Job ${jobNumber} not found`);
      }

      const job = jobs[0];
      console.log('Job data:', job); // Debug
      console.log('Job has contact_uuid?', job.contact_uuid); // Debug

      // 2. Fetch company data
      const companyResponse = await fetch(
        `${baseURL}/company/${job.company_uuid}.json`,
        { headers: getHeaders() }
      );

      const company = await companyResponse.json();
      console.log('Company data:', company); // Debug

      // 3. Fetch contact data from jobcontact table (OLD WORKING METHOD)
      let contact = null;
      try {
        console.log('Fetching job contacts for job UUID:', job.uuid); // Debug
        const contactsResponse = await fetch(
          `${baseURL}/jobcontact.json?%24filter=job_uuid%20eq%20'${job.uuid}'`,
          { headers: getHeaders() }
        );
        
        if (contactsResponse.ok) {
          const contacts = await contactsResponse.json();
          console.log('Job contacts received:', contacts); // Debug
          
          if (contacts && contacts.length > 0) {
            contact = contacts[0]; // Use first contact
            console.log('Using contact:', contact); // Debug
          } else {
            console.log('No contacts found for this job'); // Debug
          }
        }
      } catch (err) {
        console.log('Error fetching job contacts:', err); // Debug
      }

      // 4. Fetch assigned staff member
      let staff = null;
      
      // Try method 1: Check if job has assigned_to field
      if (job.assigned_to) {
        console.log('Job has assigned_to:', job.assigned_to); // Debug
        try {
          const staffResponse = await fetch(
            `${baseURL}/staff/${job.assigned_to}.json`,
            { headers: getHeaders() }
          );
          
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            console.log('Staff data from assigned_to:', staffData); // Debug
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
        console.log('Trying jobactivity method...'); // Debug
        try {
          const activityResponse = await fetch(
            `${baseURL}/jobactivity.json?%24filter=job_uuid%20eq%20'${job.uuid}'%20and%20active%20eq%201&%24orderby=edit_date%20desc&%24top=1`,
            { headers: getHeaders() }
          );

          if (activityResponse.ok) {
            const activities = await activityResponse.json();
            console.log('Job activities:', activities); // Debug
            
            if (activities && activities.length > 0 && activities[0].staff_uuid) {
              const staffResponse = await fetch(
                `${baseURL}/staff/${activities[0].staff_uuid}.json`,
                { headers: getHeaders() }
              );

              if (staffResponse.ok) {
                const staffData = await staffResponse.json();
                console.log('Staff data from activity:', staffData); // Debug
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

      console.log('Final staff data:', staff); // Debug

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
