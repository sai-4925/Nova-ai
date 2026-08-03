// agents/nodes/weatherNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED (no longer a stub). Calls weatherTool, which wraps
// services/weatherService.js's OpenWeatherMap integration. Handles two
// failure modes distinctly:
//   1. Planner didn't extract a city (routeParams.city missing) -> ask
//      a clarifying question rather than guessing a location.
//   2. The tool itself throws (bad city name, missing API key, network
//      issue) -> surface the ApiError's message directly, since
//      weatherService.js already writes these in plain, user-facing language.
// -----------------------------------------------------------------------

import { weatherTool } from '../../tools/weatherTool.js';
import { logger } from '../../utils/logger.js';

export const weatherNode = async (state) => {
  const city = state.routeParams?.city;

  if (!city) {
    return {
      toolResults: [
        {
          tool: 'weather',
          input: state.routeParams,
          output: 'Which city would you like the weather for?',
        },
      ],
      needsAnotherTool: false,
    };
  }

  try {
    const output = await weatherTool.invoke({ city });
    return {
      toolResults: [{ tool: 'weather', input: { city }, output }],
      needsAnotherTool: false,
    };
  } catch (error) {
    logger.error(`Weather Node failed: ${error.message}`);
    return {
      toolResults: [
        {
          tool: 'weather',
          input: { city },
          // ApiError messages from weatherService.js are already
          // written to be shown directly to the user (e.g. "I couldn't
          // find weather data for..."), so surface .message as-is.
          output: error.message || "I couldn't check the weather right now.",
        },
      ],
      needsAnotherTool: false,
    };
  }
};

