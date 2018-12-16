browser.browserAction.onClicked.addListener(() =>
    browser.tabs.executeScript({
        file: "/capture.js"
    }).then(() => browser.tabs.query({
        currentWindow: true,
        active: true
    })).then(tabs =>
        browser.tabs.sendMessage(tabs[0].id, {
            command: "capture",
        })
    ).catch(console.error)
);
