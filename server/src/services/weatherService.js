// services/weatherService.js
// -----------------------------------------------------------------------
// Pure integration with OpenWeatherMap's free tier ("Current Weather
// Data" endpoint - 1,000 calls/day free). Knows nothing about LangChain
// or Express - just "given a city name, return weather data or throw a
// clear error." tools/weatherTool.js wraps this for the agent graph.
// -----------------------------------------------------------------------

import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches current weather for a city name.
 * @param {string} city
 * @returns {Promise<{ city: string, country: string, tempCelsius: number, feelsLikeCelsius: number, condition: string, humidityPercent: number, windSpeedKph: number }>}
 */
export const getCurrentWeather = async (city) => {
  if (!env.openWeatherApiKey) {
    // Fail with a clear, specific message rather than letting axios
    // throw an opaque 401 from OpenWeatherMap - this is a CONFIGURATION
    // gap (missing key), not a user input error, so it gets its own
    // status/message rather than being lumped in with "city not found".
    throw ApiError.internal('Weather Agent is not configured - OPENWEATHER_API_KEY is missing.');
  }

  if (!city || !city.trim()) {
    throw ApiError.badRequest('A city name is required to check the weather.');
  }

  try {
    const { data } = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        q: city.trim(),
        appid: env.openWeatherApiKey,
        units: 'metric', // Celsius directly, avoids manual Kelvin conversion
      },
      timeout: 8000, // avoid hanging the whole graph turn on a slow upstream call
    });

    return {
      city: data.name,
      country: data.sys?.country,
      tempCelsius: Math.round(data.main.temp),
      feelsLikeCelsius: Math.round(data.main.feels_like),
      condition: data.weather?.[0]?.description || 'unknown',
      humidityPercent: data.main.humidity,
      windSpeedKph: Math.round(data.wind.speed * 3.6), // API returns m/s
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw ApiError.badRequest(`I couldn't find weather data for "${city}" - check the spelling of the city name.`);
    }
    throw ApiError.internal(`Weather lookup failed: ${error.message}`);
  }
};

/**
 * Formats a weather result into a natural-language sentence, since this
 * is what actually gets spoken/displayed to the user - keeping the
 * formatting here (not scattered in the node or tool) means it changes
 * in exactly one place.
 * @param {Awaited<ReturnType<typeof getCurrentWeather>>} weather
 */
export const formatWeatherAsSentence = (weather) => {
  const location = weather.country ? `${weather.city}, ${weather.country}` : weather.city;
  return `It's currently ${weather.tempCelsius}°C (feels like ${weather.feelsLikeCelsius}°C) with ${weather.condition} in ${location}. Humidity is ${weather.humidityPercent}% and wind speed is ${weather.windSpeedKph} km/h.`;
};
