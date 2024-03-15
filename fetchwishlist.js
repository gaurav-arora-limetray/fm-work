const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

// Function to fetch Bandcamp wishlist data
async function fetchBandcampWishlist(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the provided wishlist page URL
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Dynamically extract fan_id from the page
  const fanId = await page.evaluate(() => {
    const followButton = document.querySelector('button.follow-unfollow');
    return followButton ? followButton.id.match(/\d+/)[0] : null;
  });

  // Extract the initial older_than_token from the last item on the page
  const initialOlderThanToken = await page.evaluate(() => {
    const allItems = document.querySelectorAll('li.collection-item-container');
    const lastItem = allItems[allItems.length - 1];
    return lastItem ? lastItem.getAttribute('data-token') : null;
  });

  // Initialize variables for the loop
  let moreAvailable = true;
  let olderThanToken = initialOlderThanToken;
  const allItemsDetails = [];
  let s_no = 1;

  while (moreAvailable) {
    const response = await fetch('https://bandcamp.com/api/fancollection/1/wishlist_items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fan_id: fanId,
        older_than_token: olderThanToken,
        count: 20,
      }),
    });
    const data = await response.json();

    moreAvailable = data.more_available;
    olderThanToken = data.last_token || olderThanToken;

    data.items.forEach(item => {
      const details = {
        s_no: s_no++,
        band_name: item.band_name,
        item_url: item.item_url,
        album_title: item.item_type === 'album' ? item.album_title : 'N/A',
        item_title: item.item_type === 'track' ? item.item_title : 'N/A',
        added: item.added,
        item_type: item.item_type,
      };
      allItemsDetails.push(details);
    });
  }

  await browser.close();
  return allItemsDetails;
}

module.exports = { fetchBandcampWishlist };
