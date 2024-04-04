browser.webNavigation.onCompleted.addListener(
    () => {
      console.log("Test?");
    },
    { url: [{ urlMatches: ".*://www.google.com/" }] },
  );
  