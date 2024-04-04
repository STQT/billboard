const { ipcRenderer } = require("electron");
const { CONFIG } = require("../../settings")

// Function to disable all div's
function clearWindow() {
    document.querySelector('.weather-wrapper').classList.remove('active');
    document.querySelector('.player-wrapper').classList.remove('active');
    document.querySelector('.currency-wrapper').classList.remove('active');
    document.querySelector('.traffic-wrapper').classList.remove('active');
}

// IPC call on video ends
document.getElementById('video-player').addEventListener('ended', function (event) {
    console.log('Sending ipc call')
    ipcRenderer.send('videoFinishedPlaying', {})
}, false)


// Currency, Weather and Blank screen timeout
let BASE_URL = CONFIG.BASE_URL;
let NON_VIDEO_PLAY_DURATION = 5 * 1000;
let WEATHER_API_CALL_INTERVAL = 1000 * 60 * 60 * 2;
let CURRENCY_API_CALL_INTERVAL = 1000 * 60 * 60 * 24;
let FILLER_IMAGE_UPDATE_INTERVAL = 1000 * 60 * 20;


// This code receives the signal from main thread
ipcRenderer.on('setWindow', function (event, args) {
    console.log('Clearing window...')
    clearWindow()
    console.log(args)
    switch (args.type) {
        case 'Weather':
            document.querySelector('.weather-wrapper').classList.add('active');
            setTimeout(() => {
                ipcRenderer.send('videoFinishedPlaying', {})
            }, NON_VIDEO_PLAY_DURATION);
            break;
        case 'Currency':
            console.log('Loading currency window');
            document.querySelector('.currency-wrapper').classList.add('active');
            setTimeout(() => {
                ipcRenderer.send('videoFinishedPlaying', {})
            }, NON_VIDEO_PLAY_DURATION);
            break;
        case 'ClientVideo':
            console.log('Loading player window');
            document.querySelector('.player-wrapper').classList.add('active');
            document.getElementById('video-player').setAttribute('src', args.video.file);
            break;
        case 'MediabazaVideo':
            console.log('Loading player window');
            document.querySelector('.player-wrapper').classList.add('active');
            document.getElementById('video-player').setAttribute('src', args.video.file);
            break;
        default:
            clearWindow();
            document.querySelector('.weather-wrapper').classList.add('active');
            setTimeout(() => {
                ipcRenderer.send('videoFinishedPlaying', {})
            }, NON_VIDEO_PLAY_DURATION);
    }
})

// First time update blank screen on load
setTimeout(() => {
    ipcRenderer.send('videoFinishedPlaying', {})
}, NON_VIDEO_PLAY_DURATION);


// Weather

function convertIntToTemp(temp_value) {
    if (temp_value > 0) {
        return '+' + temp_value + '℃';
    }
    return '-' + temp_value + '℃';
}

function getWeather() {
    fetch(`${BASE_URL}/info/weather/`).then((response) => {
        return response.json();
    }).then((responseJSON) => {
        let current_temp = responseJSON['current_temp'];
        let morn = responseJSON['morning_temp'];
        let day = responseJSON['afternoon_temp'];
        let evening = responseJSON['evening_temp'];


        document.getElementById('current-temp').innerText = convertIntToTemp(current_temp);
        document.getElementById('morning-temp').innerText = convertIntToTemp(morn);
        document.getElementById('afternoon-temp').innerText = convertIntToTemp(day);
        document.getElementById('evening-temp').innerText = convertIntToTemp(evening);
        let sunrise = new Date(responseJSON['sunrise'] * 1000);
        let sunset = new Date(responseJSON['sunset'] * 1000);
        let current_time = new Date();

        let daytime = 'night';

        if (sunrise <= current_time && current_time <= sunset) {
            daytime = 'day';
        }


        switch (responseJSON['weather_main']) {
            case 'Thunderstorm':
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/storm.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/storm-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/storm.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/storm_night-bg.png)';
                }
                break;
            case 'Drizzle':
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/cloudy_rainy_sun.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/rainy-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/rainy_moon.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/rainy_night-bg.png)';
                }
                break;
            case 'Rain':
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/cloudy_rainy_sun.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/rainy-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/rainy_moon.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/rainy_night-bg.png)';
                }
                break;
            case 'Snow':
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/snowy.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/snowy-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/snowy.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/snowy_night-bg.png)';
                }
                break;
            case 'Clouds':
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/cloudy_sun.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/cloudy-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/cloud_night.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/cloudy_night-bg.png)';
                }
                break;
            default:
                if (daytime == 'day') {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/sun.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/sun-bg.png)';
                }
                else {
                    document.getElementById('current-weather-icon-img').setAttribute('src', '../img/night.png');
                    document.getElementById('weather-wrapper').style.backgroundImage = 'url(../img/night-bg.png)';
                }
                break;
        }
    })
}


// Currency
function getCurrencies() {
    fetch(`${BASE_URL}/info/currency/`)
        .then((response) => {
            return response.json();
        }).then((responseJSON) => {
            let usd = responseJSON['usd_rate'];
            let eur = responseJSON['eur_rate'];
            document.getElementById('usd-currency').innerText = usd;
            document.getElementById('eur-currency').innerText = eur;
        });
}

// Time box
function updateCurrentTime() {
    let d = new Date();
    let day_of_week = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][d.getDay()];
    let month = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'][d.getMonth()];
    let today = `${d.getDate()} ${month} ${d.getFullYear()} года`;
    // Time converter
    let hours = String(d.getHours());
    let minutes = String(d.getMinutes());
    let seconds = String(d.getSeconds());
    hours = hours.length > 1 ? hours : '0' + hours;
    minutes = minutes.length > 1 ? minutes : '0' + minutes;
    seconds = seconds.length > 1 ? seconds : '0' + seconds;
    let current_time = `${hours}:${minutes}:${seconds}`;

    // Update UI
    document.getElementById('current-day-of-week').innerText = day_of_week;
    document.getElementById('current-day').innerText = today;
    document.getElementById('current-time').innerText = current_time;
}

function getFillerImages() {

    fetch(CONFIG.BASE_URL + "/users/me/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: CONFIG.auth.username,
            password: CONFIG.auth.password,
        }),
    })
        .then((response) => response.json())
        .then((responseJSON) => {
            if (responseJSON["key"]) {
                let API_KEY = responseJSON["key"];
                console.log("Authentication successful");
                fetch(CONFIG.BASE_URL + '/filler_split_photos/', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                    }
                }).then(response => response.json()).then((responseJSON) => {
                    responseJSON.forEach(fillerImage => {
                        switch (fillerImage['type']) {
                            case 'Weather':
                                document.getElementById('weather-filler-image').setAttribute('src', fillerImage['photo'])
                                break;
                            case 'Currency':
                                document.getElementById('currency-filler-image').setAttribute('src', fillerImage['photo'])
                                break;
                        }
                    });
                }).catch(err => console.log(err))
            }
        })
        .catch((error) => {
            console.log("Authentication failed");
            console.log(error);
        });


}

getWeather();
getCurrencies();
getFillerImages();

setInterval(() => {
    getWeather();
}, WEATHER_API_CALL_INTERVAL);

setInterval(() => {
    getCurrencies();
}, CURRENCY_API_CALL_INTERVAL);

setInterval(() => {
    updateCurrentTime();
}, 1000);

setInterval(() => {
    getFillerImages();
}, FILLER_IMAGE_UPDATE_INTERVAL)
