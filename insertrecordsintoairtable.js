require('dotenv').config();
const Airtable = require('airtable');

// Configure Airtable with your API key and base
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Function to insert records into Airtable, with callback indicating completion
function insertRecordsIntoAirtable(records, callback) {
  let totalInserted = 0; // Counter for total records inserted
  const BATCH_SIZE = 5; // Airtable allows batch operations of up to 5 records

  // Helper function to insert a batch of records and wait 1 second (to respect rate limits)
  async function insertBatch(batch) {
    return new Promise((resolve, reject) => {
      base(process.env.AIRTABLE_TABLE_NAME).create(batch, (err, records) => {
        if (err) {
          reject(err);
          return;
        }
        totalInserted += records.length;
        setTimeout(resolve, 1000); // Wait 1 second between batches
      });
    });
  }

  // Process all records in batches
  (async () => {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE).map(record => ({
        fields: {
          "fldUwuaplnZvQWe44": record.item_title,
          "fld9NlMr7S3p9KKTW": record.album_title || '',
          "fldZNs43kKL3hN4e6": record.band_name,
          "fldGySLRQ8WyZaD1K": record.item_url,
          "fldfaftBvU2MtrBfx": record.item_type,
          "fldLdNWNu0c4P8WCZ": record.added,
        }
      }));
      
      try {
        await insertBatch(batch); // Insert current batch and wait
      } catch (error) {
        console.error("Error inserting batch:", error);
        break; // Stop processing further on error
      }
    }

    if (callback) {
      callback(totalInserted); // Call the callback with the total number of records inserted
    }
  })();
}

module.exports = { insertRecordsIntoAirtable };
