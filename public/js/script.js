/**
 * Toggle visibility function for the two forms sections
 */
let userBoxerButton = () => {
    let hideForm = document.getElementById('searchBoxerForm');
    let showForm = document.getElementById('customiseBoxerForm');

    if(hideForm.style.display == 'block') {
        hideForm.style.display = 'none';
        showForm.style.display = 'block';
    }
}

/**
 * Toggle visibility function for the two forms sections
 */
let opponentBoxerButton = () => {
    let hideForm = document.getElementById('customiseBoxerForm');
    let showForm = document.getElementById('searchBoxerForm');

    if(hideForm.style.display == 'block') {
        hideForm.style.display = 'none';
        showForm.style.display = 'block';
    }
}

/**
 * Toggle visibility for result section
 */
let resultSectionVisibility = () => {
    let section = document.getElementById('resultSectionWrapper');

    if(section.style.display == 'block') {
        section.style.display = 'none';
    }
    else {
        section.style.display = 'block';
    }
}

document.getElementById('customiseFormButton').addEventListener('click', userBoxerButton);
document.getElementById('searchFormButton').addEventListener('click', opponentBoxerButton);

/**
 * This object will be populated when the user select the opponent boxer
 */
let opponentObject = {};

/**
 * This object is the customised boxer made by the user
 */
let userBoxer = {
    height: 184,
    name: "Jesse Igbokwe",
    reach: 185,
    stance: "orthodox",
};

/**
 * This is the probability class accessible for all the functions, especially the Graph.js ones
 */
let probabilityClass;

/**
 * Retrieves the data submitted from the user of their customised boxer
 */
let digestUserBoxer = () => {

    let name = document.getElementById('nameInput').value;
    let height = document.getElementById('heightInput').value;
    let reach = document.getElementById('reachInput').value;
    let stance = document.getElementById('stanceInput').value;

    let newUserBoxer = {
        name : name,
        height : height,
        reach : reach,
        stance : stance,
    }

    userBoxer = newUserBoxer;
}

/**
 * After getting information of a single boxer populate the opponentObject variable
 * @param {Object} boxer Object of a boxer containing their information
 */
let populateOpponentObject = (boxer) => {
    
    if(boxer.statusCode == 422) {
        let errorText = document.getElementById('searchErrorMessage');
        errorText.style.display = 'block';

    } else {
        opponentObject = {
            name: boxer.name,
            info: boxer.info,
            bouts: boxer.bouts
        };

        if(opponentObject.info.reach == 'unknown') {
            opponentObject.info.reach == 180;
        }

        console.log(opponentObject);
    }

    digestUserBoxer();
    let submitButton = document.getElementById('submitButton');
    submitButton.style.display = 'block';
}

/**
 * @param {int} id 
 * This function calls a GET Request from the API
 * @returns An object containing information about the selected opponent information
 */
let getOpponentInformation = (id) => {
    resultSectionVisibility();
    fetch('/api/boxer/' + id)
        .then(response => response.json())
        .then(data => populateOpponentObject(data));
}

/**
 * @param {Array} resultData An array of objects of boxers
 * This displays all the searched boxers onto the front-end
 */
let displayResult = (resultData) => {
    let resultSection = document.getElementById('resultSection');
    resultSection.textContent = '';

    // Create a new close button icon
    let closeButtonDiv = document.createElement('div');
    let icon = document.createElement('i');
    icon.classList.add('fa-solid');
    icon.classList.add('fa-x');
    icon.setAttribute('id', 'closeIcon');
    icon.addEventListener('click', resultSectionVisibility);
    closeButtonDiv.setAttribute('id', 'header');
    closeButtonDiv.append(icon);
    resultSection.append(closeButtonDiv);

    resultData.forEach(result => {
        if((result.role != 'promoter') && (result.role != 'judge')) {
            let newDiv = document.createElement('div');
            let p = document.createElement('p');
            newDiv.classList.add('resultItemDiv')
            newDiv.addEventListener('click', () => getOpponentInformation(result.id), false);
            p.innerHTML = 'ID: '+ result.id + ' | Name: ' + result.name + ' | Sex: ' + result.sex + ' | ' + result.role;
            newDiv.append(p);
            resultSection.append(newDiv);
    }});
    resultSectionVisibility();
}

/**
 * This function calls a GET Request from the API
 * @returns An array of objects of all the boxers in results
 */
let searchOpponents = () => {
    let firstName = document.getElementById('firstName').value;
    let lastName = document.getElementById('lastName').value;

    if((firstName == '') || (lastName == '')) {
        populateOpponentObject({statusCode: 422, message: 'Please Fill The Inputs'});
    }

    else {
        fetch('/api/boxers/search/'+ firstName + '/' + lastName)
            .then(response => response.json())
            .then(data => displayResult(data));
    }
}

class probabilityCalculator {
    constructor(opponentBoxer, userBoxer) {

        this.heightLoss = 0;
        this.height = 0;

        this.reachLoss = 0;
        this.reach = 0;
        
        this.stanceLoss = 0;
        this.stance = 0;

        this.resultObject = {};
        this.ratioArray = [];
        
        this.opponentBoxer = opponentBoxer;
        this.userBoxer = userBoxer;

    }
        

    /**
     * Find the result of a bout and return W or L
     */
    findBoutResult = (text) => {
        let result = text.split("-")[0];
        return result;
    }

    /**
     * Calculates the ratios of losses and amount of bouts
     * @returns The object of all the ratios and overall percentage
     */
    ratioCalculator = () => {

        let range = (start, end) => {
            var rangeArray = [];
            for (let i = start; i <= end; i++) {
                rangeArray.push(i);
            }
            return rangeArray;
        }

        this.opponentBoxer.bouts.forEach(bout => {
            // Retrieve the number of bouts with an opponent with the user's height
            if(range(this.userBoxer.height - 5, this.userBoxer.height + 5).find(element => element == bout.opponentInfo.info.height)) {
                this.height++;
                if(this.findBoutResult(bout.result) == 'W') {this.heightLoss++}
            }
            if(range(this.userBoxer.reach - 5, this.userBoxer.reach + 5).find(element => element == bout.opponentInfo.info.reach)) {
                this.reach++;
                if(this.findBoutResult(bout.result) == 'W') {this.reachLoss++}
            }
            if(bout.opponentInfo.stance == this.userBoxer.stance) {
                this.stance++;
                if(this.findBoutResult(bout.result) == 'W') {this.stanceLoss++}
            }
        });

        /**
         * Converts from ratio to decimals
         * @param {int} first Amount of losses 
         * @param {int} second Amount of bouts 
         * @returns Float number
         */
        let ratioConverter = (first, second) => {
            //If there are no bouts with the same factor as the challenging one return zero instead of NaN
            if(second == 0) { return 0.0; }

            // Round to the second decimal and convert to float in case of periodic numbers
            return parseFloat((first / second).toFixed(1));
        }

        this.resultObject = {
            heightRatio: ratioConverter(this.heightLoss, this.height),
            reachRatio: ratioConverter(this.reachLoss, this.reach),
            stanceRatio: ratioConverter(this.stanceLoss, this.stance),
        } 

        this.resultObject.percentage = 
            parseFloat(((this.resultObject.heightRatio + this.resultObject.reachRatio + this.resultObject.stanceRatio) / 3 * 100).toFixed(1));

        return this.resultObject;
    }

    /**
     * Find all the heights, stances and reaches in the array of bouts and how many losses 
     * @returns Array of objects
     */
    chartRatios = () => {
        let heightList = [];
        let reachList = [];
        let stanceList = ['orthodox', 'southpaw'];
        let uniqueArrayList = [];

        this.opponentBoxer.bouts.forEach(bout => {
            heightList.push(bout.opponentInfo.info.height);
            reachList.push(bout.opponentInfo.info.reach);
        });

        let arrayList = [heightList, reachList, stanceList]

        // Removes duplicate values from array in case of multiple matches with e.g same height
        arrayList.forEach(array => {
            let uniqueArray = [...new Set(array)];
            uniqueArrayList.push(uniqueArray);
        });

        //Find how many losses against opponents with height,stance or reach present in the array
        let heightArray = [];
        let reachArray = [];
        let stanceArray = [];

        this.opponentBoxer.bouts.forEach(bout => {
            let heightRatio = {height: bout.opponentInfo.info.height, loss: 0};
            let reachRatio = {reach: bout.opponentInfo.info.reach, loss: 0};
            let stanceRatio = {stance: bout.opponentInfo.info.stance, loss: 0};

            if((bout.opponentInfo.info.height == heightRatio.height) && (this.findBoutResult(bout.result) == 'W')) {
                heightRatio.loss++;
            }

            if((bout.opponentInfo.info.reach == reachRatio.reach) && (this.findBoutResult(bout.result) == 'W')) {
                reachRatio.loss++;
            }

            if((bout.opponentInfo.info.stance == stanceRatio.stance) && (this.findBoutResult(bout.result) == 'W')) {
                stanceRatio.loss++;
            }

            heightArray.push(heightRatio);
            reachArray.push(reachRatio);
            stanceArray.push(stanceRatio);
            
        });

        const heightFilteredArr = heightArray.reduce((acc, current) => {
            const x = acc.find(item => item.height === current.height);
            if (!x) {
                return acc.concat([current]);
            }   else {
                return acc;
            }
        }, []);

        const reachFilteredArr = reachArray.reduce((acc, current) => {
            const x = acc.find(item => item.reach === current.reach);
            if (!x) {
                return acc.concat([current]);
            }   else {
                return acc;
            }
        }, []);

        const stanceFilteredArr = stanceArray.reduce((acc, current) => {
            const x = acc.find(item => item.stance === current.stance);
            if (!x) {
                return acc.concat([current]);
            }   else {
                return acc;
            }
        }, []);

        //console.log({heightFilteredArr, reachFilteredArr, stanceFilteredArr});
        return([heightFilteredArr, reachFilteredArr, stanceFilteredArr]);
    }
}

export {opponentObject, userBoxer, probabilityCalculator}

document.getElementById('searchOpponent').addEventListener('click', searchOpponents);
document.getElementById('openResultSection').addEventListener('click', resultSectionVisibility);
document.getElementById('closeIcon').addEventListener('click', resultSectionVisibility);