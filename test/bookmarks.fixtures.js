function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: "Thinkful Engineering Flex",
      url: "https://www.thinkful.com/bootcamp/web-development/flexible/",
      description: "Thinkful bootcamp website",
      rating: 4
    },
    {
      id: 2,
      title: "Thinkful Engineering Flex again",
      url: "https://www.thinkful.com/bootcamp/web-development/flexible/",
      description: "Thinkful bootcamp website",
      rating: 3
    },
    {
      id: 3,
      title: "Thinkful Engineering Flex third one",
      url: "https://www.thinkful.com/bootcamp/web-development/flexible/",
      description: "Thinkful bootcamp website",
      rating: 2
    },
    {
      id: 4,
      title: "Thinkful Engineering Flex",
      url: "https://www.thinkful.com/bootcamp/web-development/flexible/",
      description: "Thinkful bootcamp website",
      rating: 5
    },
    {
      id: 5,
      title: "Thinkful Engineering Flex",
      url: "https://www.thinkful.com/bootcamp/web-development/flexible/",
      description: "Thinkful bootcamp website",
      rating: 4
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Very naught XSS attack <script>alert("xss");</script>',
    url: "https://www.clickmeharder.com",
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1
  };

  const expectedMaliciousBookmark = {
    ...maliciousBookmark,
    title: 'Very naught XSS attack &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };

  return {
    maliciousBookmark,
    expectedMaliciousBookmark
  };
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
};
