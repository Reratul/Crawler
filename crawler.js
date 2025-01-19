const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      const fullUrl = new URL(href, baseUrl).href; // Resolve relative URLs
      links.push(fullUrl);
    }
  });
  return links;
}

function isRelevant(content, keywords) {
  const lowerContent = content.toLowerCase();
  return keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
}

async function focusedCrawler(seedUrl, keywords, maxPages = 10) {
  const visited = new Set();
  const queue = [seedUrl];
  const relevantPages = [];
  let crawledPages = 0;

  while (queue.length > 0 && crawledPages < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;

    console.log(`Crawling: ${url}`);
    const html = await fetchPage(url);
    if (!html) continue;

    visited.add(url);
    crawledPages++;

    // Check relevance
    if (isRelevant(html, keywords)) {
      console.log(`Relevant page found: ${url}`);
      relevantPages.push(url);
    }

    // Extract and queue new links
    const links = extractLinks(html, url);
    links.forEach((link) => {
      if (!visited.has(link)) {
        queue.push(link);
      }
    });
  }

  console.log("Crawling completed.");
  generateHtmlOutput(relevantPages, keywords, seedUrl);
}

function generateHtmlOutput(relevantPages, keywords, seedUrl) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Focused Crawler Results</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
    h1 { color: #333; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 10px; }
    a { color: #007BFF; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Focused Crawler Results</h1>
  <p><strong>Seed URL:</strong> <a href="${seedUrl}" target="_blank">${seedUrl}</a></p>
  <p><strong>Keywords:</strong> ${keywords.join(", ")}</p>
  <h2>Relevant Pages Found:</h2>
  <ul>
    ${relevantPages
      .map(
        (url) => `<li><a href="${url}" target="_blank">${url}</a></li>`
      )
      .join("")}
  </ul>
</body>
</html>
`;

  fs.writeFileSync("crawler-results.html", htmlContent, "utf8");
  console.log("Results saved to crawler-results.html");
}

// Example usage: Replace with your custom URL and keywords
const seedUrl = "https://bu.ac.bd/";
const keywords = ["education", "learning", "course"]; // Keywords for relevance
const maxPages = 20;

focusedCrawler(seedUrl, keywords, maxPages);
