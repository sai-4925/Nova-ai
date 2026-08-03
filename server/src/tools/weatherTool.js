// tools/weatherTool.js
// -----------------------------------------------------------------------
// Wraps weatherService as an actual LangChain Tool (via @langchain/core's
// `tool()` helper) with a Zod input schema. This is the reference
// pattern every future specialist tool (email, whatsapp, reminder...)
// follows: services/ holds the raw integration, tools/ wraps it for the
// agent graph with schema-validated input and a plain-string output the
// Response Node can surface directly.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getCurrentWeather, formatWeatherAsSentence } from '../services/weatherService.js';

export const weatherTool = tool(
  async ({ city }) => {
    const weather = await getCurrentWeather(city);
    return formatWeatherAsSentence(weather);
  },
  {
    name: 'get_current_weather',
    description: "Get the current weather conditions for a specific city. Use this whenever the user asks about weather, temperature, or what to wear/expect outside.",
    schema: z.object({
      city: z.string().describe('The city name to check weather for, e.g. "Mumbai" or "New York"'),
    }),
  }
);
