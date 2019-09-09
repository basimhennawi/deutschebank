
const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const getCredentials = async() => {
    return await new Promise((resolve, reject) => {
        S3.getObject({
            Bucket: process.env['CRED_BUCKET'],
            Key: process.env['CRED_KEY'],
        }, function(err, data) {
            if (err) reject(err);
            resolve(data);
        });
    });
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

exports.lambdaHandler = async (event, context) => {
    const puppeteerLambda = require('puppeteer-lambda');
    const browser = await puppeteerLambda.getBrowser({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(db.login.url);

    const user = await getCredentials();
    console.log("user", user);

    // Wait for login inputs
    await Promise.all([
        page.waitForSelector(db.login.selector.branch),
        page.waitForSelector(db.login.selector.account),
        // page.waitForSelector(db.login.selector.subaccount),
        page.waitForSelector(db.login.selector.pin),
    ]);

    // Set login inputs
    await page.type(db.login.selector.branch, user.branch);
    await page.type(db.login.selector.account, user.account);
    // await page.type(db.login.selector.subaccount, user.subaccount);
    await page.type(db.login.selector.pin, user.pin);

    // Navigate from LOGIN to HOME
    await Promise.all([
        page.waitForNavigation(),
        page.click(db.login.selector.click),
    ]);

    await page.waitForSelector(db.home.selector.loaded);

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

    await browser.close();

    return {
        "test": 123
    };
};
