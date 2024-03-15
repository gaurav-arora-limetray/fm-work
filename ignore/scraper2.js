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

  
  // Extract the older_than_token by backtracking from the "Show more" button to the last item's data-token
  const olderThanToken = await page.evaluate(() => {
    // Use querySelectorAll to get all items, then select the last one to get its data-token
    const allItems = document.querySelectorAll('li.collection-item-container');
    const lastItem = allItems[allItems.length - 1]; // Get the last item in the list
    return lastItem ? lastItem.getAttribute('data-token') : null;
  });

  console.log('Extracted olderThanToken:', olderThanToken);

  if (!olderThanToken) {
    console.error('Failed to extract older_than_token. Please check the page structure.');
    await browser.close();
    return;
  }
  if (!fanId || !olderThanToken) {
    console.error('Missing required information: fanId or olderThanToken.');
    await browser.close();
    return;
  }

  // Fetch cookies from the session
  const cookies = await page.cookies();
  const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

  // Construct the payload
  const payload = {
    fan_id: parseInt(fanId, 10),
    older_than_token: olderThanToken,
    count: 20,
  };
  console.log('Payload being sent:', JSON.stringify(payload)); // Log the payload

  // Use the extracted information to make the API request within Puppeteer
  const wishlistData = await page.evaluate(async (cookieHeader, payload) => {
    const response = await fetch('https://bandcamp.com/api/fancollection/1/wishlist_items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }, cookieHeader, payload);

  console.log('Wishlist data:', await wishlistData);

  await browser.close();
})();
