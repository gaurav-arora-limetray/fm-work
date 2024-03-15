const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the wishlist page
  await page.goto('https://bandcamp.com/7757699534/wishlist', { waitUntil: 'networkidle2' });

// Dynamically extract fan_id from the page
  const fanId = await page.evaluate(() => {
    const followButton = document.querySelector('button.follow-unfollow');
    return followButton ? followButton.id.match(/\d+/)[0] : null;
  });
  console.log('Extracted fanId:', fanId); // Log extracted fanId

  // Extract the initial older_than_token from the last item on the page
  const initialOlderThanToken = await page.evaluate(() => {
    const allItems = document.querySelectorAll('li.collection-item-container');
    const lastItem = allItems[allItems.length - 1];
    return lastItem ? lastItem.getAttribute('data-token') : null;
  });

  // Close the browser as it's no longer needed
  await browser.close();

  // Initialize variables for the loop
  let moreAvailable = true;
  let olderThanToken = initialOlderThanToken;
  const allItemsDetails = []; // Array to hold all extracted item details
  let s_no = 1; // Initialize the sequential number starting from 1


  //const fanId = 4935023; // Assuming fanId is known and static

  while (moreAvailable) {
    // Perform the API request
    const response = await fetch('https://bandcamp.com/api/fancollection/1/wishlist_items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include cookies or authentication headers as necessary
      },
      body: JSON.stringify({
        fan_id: fanId,
        older_than_token: olderThanToken,
        count: 20,
      }),
    });
    const data = await response.json();

    // Update the loop control variables
    moreAvailable = data.more_available;
    olderThanToken = data.last_token || olderThanToken; // Update the token for the next request

    // Process items in the response
    data.items.forEach(item => {
      const details = {
         s_no: s_no++, // Assign the current value of s_no and increment it for the next item
        band_name: item.band_name,
        item_url: item.item_url,
        album_title: item.item_type === 'album' ? item.album_title : (item.album_title || 'N/A'), // Use 'N/A' if album_title is null for tracks
        item_title: item.item_type === 'track' ? item.item_title : 'N/A', // Provided for tracks
        added: item.added,
        item_type: item.item_type,
      };
      allItemsDetails.push(details);
    });

    console.log(`Processed page: more_available: ${data.more_available}`);
  }

  // At this point, all pages have been processed
  console.log('All fetched items:', allItemsDetails);
})();