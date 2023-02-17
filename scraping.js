import puppeteer from 'puppeteer';
import {} from 'dotenv/config';

/**
 * This function scrapes for information of a boxer and their bouts
 * @param {int} identification ID of the boxer we are trying to retrieve information of
 */

const getBoxerInfo = async(page, identification) => {

    await page.waitForTimeout(3000);

    //Go to boxer info page
    await page.goto('https://boxrec.com/en/proboxer/' + identification);

    //If the page isn't directed to the homepage, login
    if(page.url == 'https://boxrec.com/en/login') {

    // Input username
    await page.waitForSelector("#username");
    await page.type('#username', process.env.BOXREC_USERNAME);

    //Input password
    await page.waitForSelector("#password");
    await page.type('#password', process.env.BOXREC_PASSWORD);
    await page.waitForTimeout(3000);

    //Login
    await page.waitForSelector(".submitButton");
    await page.click('.submitButton');
    }

    //Get boxer info in the profile table
    const boxerInfo = await page.$$eval('.rowTable', table => {

        /**
         * @param {string} text data of the height of a boxer
         * @returns height of boxer in cm in a string
         */
        const textFilter = (text) => {
            if(text === undefined) {
                return 'unknown';
            }
            const textArray = text.split('/');
            const newTextArray = textArray[1].replace(/\s/g,'');
            return newTextArray.replace(/\D/g, '');
        }

        /**
         * Scans every line from the profile tables and retrieve only specific ones
         * @param {*} firstTable first profile table of the boxer page
         * @param {*} secondTable second profile table of the boxer page
         * @returns Array with strings of information about the boxer
         */
        const organiseInfo = (firstTable, secondTable) => {
            const infoArray = [];

            //Retrieve information from the first time
            for (let i = 0; i < firstTable.children[0].childElementCount; i++) {
                let infoLine = firstTable.children[0].children[i];
                if(infoLine.innerText.includes('division')) {
                    infoArray.push(infoLine.children[1].innerText);
                }
                else if(infoLine.innerText.includes('KOs')) {
                    infoArray.push(infoLine.children[1].innerText);
                }
            }
            
            // Retrieve information from the second table
            for (let i = 0; i < secondTable.children[0].childElementCount; i++) {
                let infoLine = secondTable.children[0].children[i];
                if(infoLine.innerText.includes('stance')) {
                    infoArray.push(infoLine.children[1].innerText);
                }
                else if(infoLine.innerText.includes('height')) {
                    infoArray.push(infoLine.children[1].innerText);
                }
                else if(infoLine.innerText.includes('reach')) {
                    infoArray.push(infoLine.children[1].innerText);
                }
            }
            return infoArray;
        }

        let boxerData = {
            division: organiseInfo(table[0],table[1])[0],
            KOs: organiseInfo(table[0],table[1])[1],
            stance: organiseInfo(table[0],table[1])[2],
            height: textFilter(organiseInfo(table[0],table[1])[3]),
            reach: textFilter(organiseInfo(table[0],table[1])[4])
        }

        return boxerData;
    });

    //Retrieve bouts of boxer
    const boxerBouts = await page.$$eval('.dataTable', table => {

        const tableNumber = (table.length == 1 ) ? 0 : 1;
        const boutsArray = [];

        /**
         * @param {String} text passes the rounds in text format. e.g. 6/12
         * @returns Percentage of rounds. e.g 50
         */
        const roundsInPercentage = (text) => {
            const textArray = text.split('/');
            const percentage = Math.floor(textArray[0] / textArray[1] * 100) + '%';
            return percentage;
        }

        /**
         * @param {String} text Remove special characters from strings
         * @returns Filtered string
         */
        const filterString = (text) => {
            let filteredText = text.replace('*', '');
            return filteredText.trim();
        }

        /**
         * @param {String} text Retrieve the ID from the boxer link
         * @returns Boxer's ID
         */
        const getBoxerID = (text) => {
            const textArray = text.split('/');
            return textArray[3];
        }
        
        for (let i = 1; i < table[tableNumber].children.length; i++) {
            
            if(table[tableNumber].children[i].children[0].children[4] != null) {

                //console.log("Hello: " + table[tableNumber].children[i].children[0]);
                let boxerHref = table[tableNumber].children[i].children[0].children[5].children[0].getAttribute('href');
                let boxerID = getBoxerID(boxerHref);

                let opponent = {
                    name: filterString(table[tableNumber].children[i].children[0].children[4].innerText),
                    id: boxerID,
                    };
                let rounds = roundsInPercentage(table[tableNumber].children[i].children[0].children[11].innerText);
                let result = table[tableNumber].children[i].children[0].children[9].children[0].innerText;
                let outcomeBy = table[tableNumber].children[i].children[0].children[10].innerText;

                let boutObject = {
                    opponent: opponent,
                    rounds: rounds,
                    result: result,
                    outcomeBy: outcomeBy,
                }

                boutsArray.push(boutObject);
            }
        }
        return boutsArray;
    });

    //Get name of boxer
    const boxerName = ((await page.title()).split(':')[1]).trim();

    // Put everything together in an object and return
    const boxerData = () => {

        const object = {
            name: boxerName,
            info: boxerInfo,
            bouts: boxerBouts
        }

        return object;
    }

    //setTimeout(() => { page.close(); }, 3000);
    return boxerData();
}

/**
 * This function retrieves all the results of a search 
 * @param {String} text String of what the user has searched 
*/
const getSearchResult = async(page, name, surname) => {

    await page.waitForTimeout(3000);
    await page.setRequestInterception(true);

   //go to Boxrec.com search page
    await page.goto('https://boxrec.com/en/quick_search');

    //If the page isn't directed to the homepage, login
    if(page.url == 'https://boxrec.com/en/login') {

    // Input username
    await page.waitForSelector("#username");
    await page.type('#username', process.env.BOXREC_USERNAME);

    //Input password
    await page.waitForSelector("#password");
    await page.type('#password', process.env.BOXREC_PASSWORD);
    await page.waitForTimeout(1000);

    //Login
    await page.waitForSelector(".submitButton");
    await page.click('.submitButton');
    }

    //Input the passed text and search
    await page.waitForTimeout(5000);
    await page.waitForSelector("#p_first_name");
    await page.focus('#p_first_name');
    await page.type('#p_first_name', name);
    await page.waitForSelector('#p_last_name');
    await page.focus('#p_last_name');
    await page.type('#p_last_name', surname);
    await page.waitForTimeout(5000);

    //Click the Go button to submit and search 
    await page.waitForSelector('.submitButton');
    await page.click('.submitButton');   
    await page.waitForSelector('.dataTable');

    //Retrieve the table with all the results from the search
    const searchResult = await page.$eval('.dataTable', table => {

        const resultArray = [];

        /**
         * 
         * @param {String} text Passed a raw text about the role of the fighter
         * @returns A cleaner and readable version of the string
         */
        const role = (text) => {
            let roleText = text;
            if(text == "am boxer\npro boxer") {
                roleText = "amateur boxer & pro boxer";
            }
            else if(text == "pro kickboxer\npro boxer") {
                roleText = "pro kickboxer & pro boxer";
            }
            return roleText
        }

        /**
         * @param {String} text Retrieve the ID from the boxer link
         * @returns Boxer's ID
         */
        const getBoxerID = (text) => {
            const textArray = text.split('/');
            return textArray[3];
        }

        for (let i = 0; i < table.children[1].childElementCount; i++) {

            const boxerID = getBoxerID(table.children[1].children[i].children[0].children[0].getAttribute('href'));

            let result = {
                //pic: getBoxerPic(table, boxerID),
                id: boxerID,
                //hello: await getBoxerInfo(255542),
                name: table.children[1].children[i].children[0].children[0].innerText,
                link: table.children[1].children[i].children[0].children[0].getAttribute('href'),
                sex: table.children[1].children[i].children[1].innerText,
                role: role(table.children[1].children[i].children[2].innerText)
            }
            resultArray.push(result);
        }

        return resultArray;
    });

    //browser.close();
    return searchResult;
}

/**
 * This function opens a browser and logs in, useful for when mulitple boxer's information have to be scraped
 */
const openBrowser = async() => {
    const browser = await puppeteer.launch({headless: false});

    //Open new tab and go to Boxrec.com
    const page = await browser.newPage(); 
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto('https://boxrec.com/en/login');

    // Input username
    await page.waitForSelector("#username");
    await page.type('#username', process.env.BOXREC_USERNAME);

    //Input password
    await page.waitForSelector("#password");
    await page.type('#password', process.env.BOXREC_PASSWORD);
    await page.waitForTimeout(1000);

    //Login
    await page.waitForSelector(".submitButton");
    await page.click('.submitButton');

    return page;
    
}

export {getBoxerInfo, getSearchResult, openBrowser};