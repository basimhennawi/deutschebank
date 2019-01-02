const fs = require('fs');
const puppeteer = require('puppeteer');
const user = {
    branch: process.argv[2],
    account: process.argv[3],
    // subaccount: process.argv[4],
    pin: process.argv[5]
};

const db = {
    login: {
        url: 'https://meine.deutsche-bank.de',
        selector: {
            branch: '#branch',
            account: '#account',
            // subaccount: '#subAccount',
            pin: '#pin',
            click: '#action > input',
        },
    },
    home: {
        selector: {
            loaded: '#contentContainer > table > tbody > tr.mctContext.odd > td:nth-child(1) > a'
        }
    },
    transactions: {
        selector: {
            csvLink: '#contentContainer > div.pageFunctions > ul > li.csv > a'
        }
    }
};

const screenshotsPath = './screenshots';
const screenshots = {
    loginOnLoad: `${screenshotsPath}/1.LoginOnLoad.png`,
    loginAfterFillInput: `${screenshotsPath}/2.LoginAfterFillInput.png`,
    homeLoaded: `${screenshotsPath}/3.HomeLoaded.png`,
    transactionsLoaded: `${screenshotsPath}/4.TransactionsLoaded.png`,
};

// Create screenshots folder if not exists
if (!fs.existsSync(screenshotsPath)) {
    fs.mkdirSync(screenshotsPath, { recursive_: true });
}

(async () => {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(db.login.url);

    // Wait for login inputs
    await Promise.all([
        page.waitForSelector(db.login.selector.branch),
        page.waitForSelector(db.login.selector.account),
        // page.waitForSelector(db.login.selector.subaccount),
        page.waitForSelector(db.login.selector.pin),
    ]);

    await page.screenshot({ path: screenshots.loginOnLoad });

    // Set login inputs
    await page.type(db.login.selector.branch, user.branch);
    await page.type(db.login.selector.account, user.account);
    // await page.type(db.login.selector.subaccount, user.subaccount);
    await page.type(db.login.selector.pin, user.pin);

    await page.screenshot({ path: screenshots.loginAfterFillInput });
    
    // Navigate from LOGIN to HOME
    await Promise.all([
        page.waitForNavigation(),
        page.click(db.login.selector.click),
    ]);

    await page.waitForSelector(db.home.selector.loaded);

    await page.screenshot({ path: screenshots.homeLoaded });
    
    // Navigate from HOME to TRANSACTIONS
    await Promise.all([
        page.waitForNavigation(),
        page.click(db.home.selector.loaded),
    ]);

    await page.waitForSelector(db.transactions.selector.csvLink);
    
    // Navigate from TRANSACTIONS to DOWNLOAD CSV
    await Promise.all([
        page.waitForNavigation(),
        page.click(db.transactions.selector.csvLink),
    ]);

    await page.screenshot({ path: screenshots.transactionsLoaded });

    await browser.close();
})();