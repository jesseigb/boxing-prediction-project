import express from 'express'
//import puppeteer from 'puppeteer';
import {getBoxerInfo, getSearchResult, openBrowser} from './scraping.js';

const app = express();
app.listen(3000, () => console.log('App Succesfully Running On Port 3000!'));


/* ---------------- HTML Rendering ------------------ */

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/css', express.static('./public/css'));
app.use('/js', express.static('./public/js'));
app.use('/img', express.static('./public/img'));


app.get('/', (req, res) => {
    res.render('index')
});


/* --------------- API Section ---------------------- */

app.get('/api/boxer/:id', async (req, res) => {
    let opponentObjects = [];
    let boxerObject = {};

    /**
     * Retrieve more information about the boxer's opponent
     * @param {Object} boxerInfo Object of the boxer retrieved
     */
    let moreOpponentInfo = async (boxerInfo, page) => {
        for (let bout of boxerInfo.bouts) {
            let opponentObject = {
                result: bout.result,
                opponentInfo: await getBoxerInfo(page, bout.opponent.id)
            }
            opponentObjects.push(opponentObject);
        }
    }
    
    try {
        let page = await openBrowser();
        let boxerInfo = await getBoxerInfo(page, req.params.id);
        await moreOpponentInfo(boxerInfo, page);
        boxerObject.name = boxerInfo.name;
        boxerObject.info = boxerInfo.info;
        boxerObject.bouts = opponentObjects;

    } catch(err) {
        console.log(err)
    }

    res.send(boxerObject);
});

app.get('/api/boxers/search/:name/:surname', async (req, res) => {
    let searchResult;
    
    try {
        let page = await openBrowser();
        searchResult = await getSearchResult(page, req.params.name, req.params.surname);

    } catch(err) {
        console.log(err)
    }

    res.send(searchResult);
});