// Weather
function getWeather() {
    try {
        fetch(`${BASE_URL}/info/weather/`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((responseJSON) => {
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

                let daytime = (sunrise <= current_time && current_time <= sunset) ? 'day' : 'night';

                switch (responseJSON['weather_main']) {
                    case 'Thunderstorm':
                        document.getElementById('current-weather-icon-img').setAttribute('src', '../img/storm.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/storm-bg.png)'
                            : 'url(../img/storm_night-bg.png)';
                        break;
                    case 'Drizzle':
                        document.getElementById('current-weather-icon-img').setAttribute('src', daytime === 'day'
                            ? '../img/cloudy_rainy_sun.png'
                            : '../img/rainy_moon.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/rainy-bg.png)'
                            : 'url(../img/rainy_night-bg.png)';
                        break;
                    case 'Rain':
                        document.getElementById('current-weather-icon-img').setAttribute('src', daytime === 'day'
                            ? '../img/cloudy_rainy_sun.png'
                            : '../img/rainy_moon.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/rainy-bg.png)'
                            : 'url(../img/rainy_night-bg.png)';
                        break;
                    case 'Snow':
                        document.getElementById('current-weather-icon-img').setAttribute('src', '../img/snowy.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/snowy-bg.png)'
                            : 'url(../img/snowy_night-bg.png)';
                        break;
                    case 'Clouds':
                        document.getElementById('current-weather-icon-img').setAttribute('src', daytime === 'day'
                            ? '../img/cloudy_sun.png'
                            : '../img/cloud_night.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/cloudy-bg.png)'
                            : 'url(../img/cloudy_night-bg.png)';
                        break;
                    default:
                        document.getElementById('current-weather-icon-img').setAttribute('src', daytime === 'day'
                            ? '../img/sun.png'
                            : '../img/night.png');
                        document.getElementById('weather-wrapper').style.backgroundImage = daytime === 'day'
                            ? 'url(../img/sun-bg.png)'
                            : 'url(../img/night-bg.png)';
                        break;
                }
            })
            .catch((error) => {
                console.error('Failed to fetch weather data:', error);
            });
    } catch (error) {
        console.error('Error in getWeather:', error);
    }
}

// Currency
function getCurrencies() {
    try {
        fetch(`${BASE_URL}/info/currency/`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((responseJSON) => {
                let usd = responseJSON['usd_rate'];
                let eur = responseJSON['eur_rate'];
                document.getElementById('usd-currency').innerText = usd;
                document.getElementById('eur-currency').innerText = eur;
            })
            .catch((error) => {
                console.error('Failed to fetch currency data:', error);
            });
    } catch (error) {
        console.error('Error in getCurrencies:', error);
    }
}

// Filler images
function getFillerImages() {
    try {
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
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((responseJSON) => {
                if (responseJSON["key"]) {
                    let API_KEY = responseJSON["key"];
                    console.log("Authentication successful");
                    fetch(CONFIG.BASE_URL + '/filler_split_photos/', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${API_KEY}`,
                        }
                    })
                        .then(response => response.json())
                        .then((responseJSON) => {
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
                        })
                        .catch(err => console.log('Failed to fetch filler images:', err));
                }
            })
            .catch((error) => {
                console.log("Authentication failed:", error);
            });
    } catch (error) {
        console.error('Error in getFillerImages:', error);
    }
}

// Call functions on intervals
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
}, FILLER_IMAGE_UPDATE_INTERVAL);
