import axios from "axios";
import { storageService } from "./async-storage.service"

const KEY = 'UGeEGKUNPZP49XINFWUymRwWwW6xAZWG'

export default {
    queryLocation,
    queryWeather,
    query5Days,
    getCityByGeoloc,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    autocomplete
}

async function queryLocation(loc = 'tel aviv') {
    try {
        const citys = await storageService.query(`locationResults_${loc}`);
        if (citys?.Key) {
            return Promise.resolve(citys);
        }
        return axios.get(`https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=%09${KEY}&q=${loc}`)
            .then(res => {
                if (res.data.length) {
                    storageService._save(`locationResults_${loc}`, res.data[0]);
                    return res.data[0];
                }
                else {
                    return false
                }
            })
            .catch(err => {
                console.log('Service got Error:', err);
            })
    } catch (err) {
        console.log('err in queryLocation functin:', err)
    }
}
async function queryWeather(cityKey = '215854') {
    try {
        const weather = await storageService.query(`weatherResults_${cityKey}`);
        if (Object.keys(weather).includes('WeatherText')) {
            return Promise.resolve(weather);
        }
        return axios.get(`https://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${KEY}&details=true`)
            .then(res => {
                if (res.data.length) {
                    storageService._save(`weatherResults_${cityKey}`, res.data[0]);
                    return res.data[0]
                }
                else {
                    storageService._save(`weatherResults_${cityKey}`, res.data);
                    return res.data;
                }
            })
            .catch(err => {
                console.log('Service got Error:', err);
            })
    } catch (err) {
        console.log('err in queryWeather functin:', err)
    }
}
async function autocomplete(res) {
    try {
        if (res === '') return
        const weather = await storageService.query(`autoResults_${res}`);
        if (weather?.Key) {
            console.log('autocomplete from storage!');
            return Promise.resolve(weather);
        }
        return axios.get(`http://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${KEY}&q=${res}`)
            .then(res => {
                if (res.data.length) {
                    return res.data.map((cname) => cname.LocalizedName)
                }
            })
            .catch(err => {
                console.log('Service got Error:', err);
            })
    } catch (err) {
        console.log('err in queryWeather functin:', err)
    }
}
async function query5Days(cityKey = '215854') {
    try {
        var forecastArr = []
        const forecasts = await storageService.query(`5DaysResults_${cityKey}`);
        if (Object.keys(forecasts).includes('DailyForecasts')) {
            forecastArr = forecasts.DailyForecasts.map((day) => {
                return {
                    dayTimestamp: day.EpochDate,
                    temperature: day.Temperature
                }
            })
            return Promise.resolve(forecastArr);
        }
        return axios.get(`https://dataservice.accuweather.com/forecasts/v1/daily/5day/${cityKey}?apikey=${KEY}&details=true`)
            .then(res => {
                storageService._save(`5DaysResults_${cityKey}`, res.data);
                return res.data.DailyForecasts.map((day) => {
                    return {
                        dayTimestamp: day.EpochDate,
                        temperature: day.Temperature
                    }
                });
            })
            .catch(err => {
                console.log('Service got Error:', err);
            })
    } catch (err) {
        console.log('err in query5Days functin:', err)
    }
}
async function getCityByGeoloc(lat, lon) {
    try {
        return axios.get(`https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${KEY}&q=${lat}%2C${lon}&toplevel=false`)
            .then(res => {
                return res.data.AdministrativeArea.LocalizedName
            })
            .catch(err => {
                console.log('Service got Error:', err);
            })
    } catch (err) {
        console.log('err in query5Days functin:', err)
    }
}
async function loadFavorites() {
    try {
        return await storageService.query(`Favorites`);
    } catch (err) {
        console.log('err in addToFavorites functin:', err)
    }
}
async function addToFavorites(city) {
    try {
        const favorites = await storageService.query(`Favorites`);
        favorites.push(city)
        storageService._save(`Favorites`, favorites);
        return favorites
    } catch (err) {
        console.log('err in addToFavorites functin:', err)
    }
}
async function removeFromFavorites(city) {
    try {
        const favorites = await storageService.query(`Favorites`);
        const idx = favorites.findIndex(currCity => currCity.location.Key === city.location.Key)
        favorites.splice(idx, 1)
        storageService._save(`Favorites`, favorites);
        return favorites
    } catch (err) {
        console.log('err in removeFromFavorites functin:', err)
    }
}