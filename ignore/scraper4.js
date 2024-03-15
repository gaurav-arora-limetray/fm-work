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

    // Log the more_available status
    console.log(`more_available: ${data.more_available}`);

    // Update the loop control variables
    moreAvailable = data.more_available;
    olderThanToken = data.last_token || olderThanToken; // Update the token for the next request
  }

  // At this point, more_available has been false, and all data has been fetched
})();