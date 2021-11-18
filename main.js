
let blockInfoUrl = 'https://mod-clock-api.roxburylatin.org/daytype.json';
let scheduleUrl = 'https://mod-clock-api.roxburylatin.org/todays_schedule.json';

let blockInfo;
let schedule;

let testDT = new Object(
    // {
    //     '_moment': '2021-10-22T14:15:03.550Z',
    //     'date': '20211022',
    //     'dayType': 'C',
    //     'hallLength': 0,
    //     'currentBlock': {
    //         'period': 4,
    //         'name': '4th - In Between Lunches',
    //         'start': '11:30',
    //         'end': '11:45',
    //         'block': 'F'
    //     },
    //     'remainingMin': 0,
    //     'remainingSec': 30,
    //     'remainingTime': '0:30',
    //     'remainingDisp': 1
    // }
    
    // {
    // '_moment': '2021-09-17T18:00:10.881Z',
    // 'date': '20210917',
    // 'dayType': 'C',
    // 'hallLength': 0,
    // 'currentBlock': {
    //     'period': 'Passing Time',
    //     'name': '6th',
    //     'start': '13:05',
    //     'end': '13:50',
    //     'block': 'H'
    // },
    // 'remainingMin': 4,
    // 'remainingSec': 13,
    // 'remainingTime': '4:13',
    // 'remainingDisp': 4
    // }

    // {
    //     "_moment": "2021-10-22T17:59:15.778Z",
    //     "date": "20211022",
    //     "dayType": "C",
    //     "hallLength": 0,
    //     "currentBlock": {
    //         "name": "After School"
    //     }
    // }
);



/** 
 * Fetches info about the current block as well as the day's schedule.
 * Then makes the page body visible and sets up times to refresh the page content.
 */
function init() {
    fetchBlockInfo()
        .then(response => { 
            blockInfo = response; 
    
            updateClock();
            updateWindowTitle();

            //make the page content visible (having loaded necessary data)
            document.body.style.display = 'block';

            //don't refresh on weekends
                //calculate time until ~8am of next school day (Monday?)...setTimeout() to then, then call setInterval()
            //don't refresh after school?
                //calculate time until ~8am of next school day (Monday?)...setTimeout() to then, then call setInterval()

            //set clock data to refresh every 30 seconds from the first :00 or :30 the page hits
            setTimeout(() => {
                setInterval(fetchAndUpdateBlockInfo, 30000);
            }, (blockInfo.remainingSec % 30) * 1000);   //when remainingSec is NaN, runs immediately
        });
    
    fetchSchedule()
        .then(response => { 
            schedule = response; 
            updateTable(schedule);
    });
}

/**
 * Queries the API for fresh block data, then updates HTML element content as necessary.
 * @returns 
 */
function fetchAndUpdateBlockInfo() {
    fetchBlockInfo()
        .then(response => { blockInfo = response; })
        .then(() => { 
            //For testing, log the time this ran
            let d = new Date();
            let timeRan = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

            updateClock(); 
            updateWindowTitle();

            console.log('Fetched block info & updated clock @ ' + timeRan);
            console.log(blockInfo);

        });
        
}

/**
 * Retrieves details about the current block of the school day, or before/after school
 * details when appropriate.
 * @returns a promise which contains the JSON object with info about the current block in
 *          Promise.data
 */
function fetchBlockInfo() {
    return axios.get(blockInfoUrl)
                .then(response =>  {
                    console.log('Retrieved block info.');
                    return response.data;
                })
                .catch(error => console.error(error));
}


/**
 * Retrieves the schedule for the day in JSON format.
 * @returns a promise containing a JSON object of the day's schedule, including names, labels, and start
 *          and end times for each block
 */
function fetchSchedule() {
    return axios.get(scheduleUrl)
                .then(response => {
                    console.log('Retrieved today\'s schedule.');
                    return response.data;
                })
                .catch(error => console.error(error));
            
            
}

/**
 * Updates the text in the window title to show block/period/time details.
 * 
 * @returns true if title was updated, false otherwise
 */
function updateWindowTitle() {
    /***** for before/after school testing ******/
    //blockInfo = testDT;
    /***********/
    console.log("Updated title");
    
    if(!isDuringSchoolDay(blockInfo)) {
        return;
    }

    let titleText = blockInfo.currentBlock.period + '[' + blockInfo.currentBlock.block + ']' + 
                    ' ' + blockInfo.remainingDisp + "min";
    let windowTitle = document.getElementsByTagName('title')[0];

    windowTitle.innerText = titleText;

}


/** 
 * Formats the period, block, and time details for the proper elements on the page
 * and then calls a helper method to update page elements.
 * 
 *  ** This probably should take a parameter rather than using a global variable.
 */
function updateClock() {
    /***** for before/after school testing ******/
    //blockInfo = testDT;
    /***********/

    let currentBlock = blockInfo.currentBlock;    
    let blockAndPeriodDisplay = currentBlock.name + ' - ' + currentBlock.block + ' Block';
    let timeRemainingDisplay = blockInfo.remainingDisp + calcMinutesLabel() + ' remaining';

    //if after school or before school, override the appropriate variables
    // if(currentBlock.name === 'Before School' || currentBlock.name === 'After School' || currentBlock.name === 'Weekend') {
    //     blockAndPeriodDisplay = currentBlock.name;
    //     timeRemainingDisplay = '';
    // }
    if(!isDuringSchoolDay(blockInfo)) {
        blockAndPeriodDisplay = currentBlock.name;
        timeRemainingDisplay = '';
    }
    else if(currentBlock.period === 'Passing Time') {
        timeRemainingDisplay = currentBlock.period + ' - ' + blockInfo.remainingDisp + calcMinutesLabel() + ' remaining';      
    }
    else if(currentBlock.name.includes('Lunch')) {
        blockAndPeriodDisplay = currentBlock.name;
    }

    updateClockElements(blockAndPeriodDisplay, timeRemainingDisplay);

    console.log('Updated clock: ' + blockInfo.remainingTime);
}

let BlockState = {
    PAST: 'past',
    CURRENT: 'current',
    FUTURE: 'future'
}

function updateTable(schedule){
    let blockContainer = document.getElementById('block-container');

    schedule.periods.forEach(function (item, index = 0) {  
        var blockState = calculateBlockState(item, previousBlock = (index == 0 ? null : schedule.periods[index-1]));//mr poles pls dock points off of kevin's next assignment for the use of a turnery statement here

        let blockTime = document.createElement('p');
        blockTime.classList.add('blockTime');
        blockTime.innerText = convertFromMilitaryTime(item.start) + ' - ' + convertFromMilitaryTime(item.end);
        if (blockState == BlockState.CURRENT) {
            blockTime.classList.add('currentTime');
        }
        
        let block =  document.createElement('div');
        // block.classList.add('block')
        if(item.name.includes('Lunch') || item.name.includes('Second Lunch')){
            block.classList.add('lunchBlock')
        } else {
            block.classList.add('block');
        }
        
        var blockName = document.createElement('p');
        blockName.classList.add('blockName');
        
        if (item.period == 0) {
            blockName.innerText = item.name;
        } else {

            
            if(item.name.includes('First Lunch') || item.name.includes('1st Lunch')){
                let dashIndex = item.name.indexOf(' - ') + 2;
                blockName.innerText = item.name.substring(dashIndex);

                block.classList.add('block');
                
                blockTime.classList.add('lunchBlockTime')
            } else if (item.name.includes('In Between Lunch')){
                blockName.innerText = item.block + ' Block';

                block.classList.add('lunchBlock')    
                blockTime.classList.add('lunchBlockTime')           
            } else if (item.name.includes('Second Lunch') || item.name.includes('2nd Lunch')){
                let dashIndex = item.name.indexOf(' - ') + 2;
                blockName.innerText = item.name.substring(dashIndex);
                
                block.classList.add('lunchBlock')    
                blockTime.classList.add('lunchBlockTime')
            } else{
                blockName.innerText = item.block + ' Block';
            }
        }
        
        block.classList.add(blockState);
        
        block.appendChild(blockName);
        block.appendChild(blockTime);
        
        blockContainer.appendChild(block);
    });
}

/**
 * Calculates whether a block is currently happening, has happened or will happen.
 * @param {*} block A block object from the schedule JSON Object
 * @returns BlockState.CURRENT if the block is currently happening, BlockState.PAST if the block has happened, BlockState.FUTURE if the block will happen. 
 */
function calculateBlockState(block, previousBlock = null){
    let time = new Date();
    let currentSeconds = (time.getHours() * 60 * 60) + (time.getMinutes() * 60) + time.getSeconds();
    
    if(previousBlock == null){
        console.log(currentSeconds)
        var minSeconds = scheduleTimeToSeconds(block.start);
        console.log(minSeconds)
        var maxSeconds = scheduleTimeToSeconds(block.end);
        console.log(minSeconds)

    }else{
        var minSeconds = scheduleTimeToSeconds(previousBlock.end);
        var maxSeconds = scheduleTimeToSeconds(block.end);
    }

    if(currentSeconds < minSeconds){
        return BlockState.FUTURE;
    }else if(currentSeconds > maxSeconds){
        return BlockState.PAST;
    }else{
        return BlockState.CURRENT;
    }
}
/**
 * Converts a time as formated on the schedule in military time to seconds since midnight.
 * @param {string} time The military time to be converted to seconds since midnight.
 * @returns Seconds since midnight.
 */
function scheduleTimeToSeconds(time){
    let colonIndex = time.indexOf(':');
    let hours = time.substring(0,colonIndex).trim();
    let minutes = time.substring(colonIndex+1).trim();
    return (hours * 60 * 60) + (minutes * 60);
}


/**
 * Converts a string that contains military time into a 12 hour time.
 * @param {string} originalTime The string in military time to be converted.
 * @returns The original time in 12 hour time as a string. 
 */
function convertFromMilitaryTime(originalTime){
    let colonIndex = originalTime.indexOf(':');
    let hours = originalTime.substring(0, colonIndex).trim();
    hours %= 13;
    hours = hours < 1? 12: hours;
    return hours + originalTime.substring(colonIndex);
}

/**
 * Updates specific elements of the webpage clock.
 */
function updateClockElements(periodAndBlock, timeRemaining) {
    //get references to the elements to update
    let periodBlockDiv = document.getElementById('period-block');
    let minRemainingDiv =  document.getElementById('min-remaining');

    //update contents
    periodBlockDiv.innerText = periodAndBlock;
    minRemainingDiv.innerText = timeRemaining;

}


/********* Auxiliary Functions *********/

/** Determines whether or not a school day is currently happening.
 * @returns true if school day is in session, false otherwise
 */
function isDuringSchoolDay(blockInfo) {
    return blockInfo.currentBlock.hasOwnProperty('block');
}


function calcMinutesLabel() {
    return blockInfo.remainingDisp == 1 ? ' minute' : ' minutes';
}
