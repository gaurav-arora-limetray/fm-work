require('dotenv').config();
console.log('Airtable API Key:', process.env.AIRTABLE_API_KEY);
const express = require('express');
const bodyParser = require('body-parser');
const { fetchBandcampWishlist } = require('./fetchWishlistData');
const { insertRecordsIntoAirtable } = require('./insertRecordsIntoAirtable');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/download-wishlist', async (req, res) => {
    const { url, limit } = req.body; // Extract URL and limit from the request body
    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    try {
        let wishlistData = await fetchBandcampWishlist(url);
        
        // If a limit is specified, truncate the wishlistData to that limit
        if (limit) {
            wishlistData = wishlistData.slice(0, limit);
        }

        // Call insertRecordsIntoAirtable to insert the limited data into Airtable
        insertRecordsIntoAirtable(wishlistData, totalInserted => {
            res.json({ message: 'Data successfully inserted into Airtable', totalInserted: totalInserted });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch the wishlist or insert data into Airtable' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
