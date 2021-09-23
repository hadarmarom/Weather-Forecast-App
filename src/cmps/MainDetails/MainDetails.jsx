import './MainDetails.scss'
import weatherService from '../../services/weatherService'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeFromFavorites, addToFavorites, loadLocation } from '../../store/actions/weatherActions'
import { DaysList } from '../DaysList/DaysList'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import CustomizedSwitches from '../DegreesSwitch'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios'


export function MainDetails() {
    const dispatch = useDispatch()
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedInput = useDebounce(searchTerm, 1300);
    const currCity = useSelector(state => state.weatherReducer.currCity)
    const favorites = useSelector(state => state.weatherReducer.favorites)
    const isDarkMode = useSelector(state => state.weatherReducer.isDarkMode)

    const [disableSearch, setDisableSearch] = useState(false);
    const [isFahrenheit, setIsFahrenheit] = useState(true)
    const [isErrModal, setIsErrModal] = useState(false);
    const [city, setCity] = useState(currCity);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        setCity(currCity);
        checkIfLiked()
    }, [currCity])
    useEffect(() => {
        checkIfLiked()
    }, [])
    useEffect(async () => {
        if (debouncedInput) {
            const err = await dispatch(loadLocation(debouncedInput))
            if (err) {
                setIsErrModal(true)
                setTimeout(() => {
                    setIsErrModal(false)
                }, 3000);
            }
        } else {
            setCity(currCity)
        }
    }, [debouncedInput]);

    const checkIfLiked = () => {
        (favorites.some((fav) => fav.location.Key === city.location.Key)) ? setLiked(true) : setLiked(false)
    }

    const tuggleFavorite = () => {
        if (favorites.some((fav) => fav.location.Key === city.location.Key)) {
            setLiked(false)
            return dispatch(removeFromFavorites(currCity))
        }
        setLiked(true)
        dispatch(addToFavorites(currCity))
    }
    const typeLetters = (res) => {
        let isEnglish = /^[A-Za-z\s]+$/.test(res.target.value);
        if (isEnglish || res.target.value === '') {
            setDisableSearch(false)
            setSearchTerm(res.target.value)
        }
        else {
            setDisableSearch(true)
        }
    }

    const getGeoLoc = () => {
        navigator.geolocation.getCurrentPosition(success, error);
    }

    const success = async (pos) => {
        var crd = pos.coords;
        const myCity = await weatherService.getCityByGeoloc(crd.latitude, crd.longitude)

        setSearchTerm(myCity)
    }
    const error = (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    const fillHeart = (bool) => {
        return bool ? { color: 'red' } : { color: 'gray' }
    }
    const calcToCelsius = (day) => {
        const res = ((day.temperature.Maximum.Value - 32) * 0.5556).toFixed(1)
        return res * 1; // removes trailing zeros
    }

    return (
        <>
            <section className={isDarkMode ? 'dark functions-sec ' : 'functions-sec '} style={isDarkMode ? { color: 'white' } : { color: 'blue' }}>
                <Button variant="outlined" onClick={() => getGeoLoc()} style={isDarkMode ? { color: 'white', border: '1px solid white' } : { color: 'blue' }}>Get My Location!</Button>
                <Box component="form" style={{ color: 'white !important' }} sx={{ '& > :not(style)': { m: 1, width: '25ch' }, }} noValidate autoComplete="off">
                    <TextField style={{ marginBottom: '22px' }} id="standard-basic" label="Enter City Name Here..." variant="standard" onChange={(e) => typeLetters(e)} />
                </Box>
                {disableSearch && <small>english letters only!</small>}
                <CustomizedSwitches style={{ backgroundColor: 'red !important', transition: ' 0.3 !impirtant' }} setIsFahrenheit={setIsFahrenheit} isFahrenheit={isFahrenheit} defaultChecked />
            </section>
            <div className={isDarkMode ? ' curr-city-view dark ' : ' curr-city-view light'}>
                <section className={isDarkMode ? 'dark curr-city-top-sec ' : 'light curr-city-top-sec '}>
                    <section>
                        <h2>{city.location.LocalizedName}</h2>
                        <div>
                            <h4 style={{ transform: isFahrenheit ? "translateX(0)" : "translateX(-100px)", maxWidth: isFahrenheit ? "100%" : "0" }} >{city.forecasts[0].temperature.Maximum.Value + " °F"}</h4>
                            <h4 style={{ transform: isFahrenheit ? "translateX(100px)" : "translateX(0)", marginLeft: '10px', maxWidth: isFahrenheit ? "0" : "100%" }} >{calcToCelsius(city.forecasts[0]) + " °C"}</h4>
                        </div>
                    </section>
                    <div className="like-sec" onClick={() => tuggleFavorite()}><Button variant="text">{liked ? "remove from favorites" : "add to favorites"}</Button><FontAwesomeIcon icon={faHeart} className="heart" style={fillHeart(liked)} /></div>
                </section>
                <h2>{city.weather.WeatherText}</h2>
                <ul className="days-list">{city.forecasts.map((day, idx) => <DaysList key={idx} isDarkMode={isDarkMode} calcToCelsius={calcToCelsius} isFahrenheit={isFahrenheit} day={day} ></DaysList>)}</ul>
                {isErrModal && <div className="snackbar">Sorry, We Could'nt Find {searchTerm}</div>}
            </div>
        </>
    )

}

// Hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    },
        [value, delay]);
    return debouncedValue;
}