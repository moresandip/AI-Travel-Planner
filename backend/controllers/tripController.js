const Trip = require('../models/Trip');

// Exponential backoff executor for external API resilience
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.warn(`Gemini API rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`External API Error: Status Code ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Normalizes and validates external API outputs to prevent Mongoose schema validation crashes
function normalizeTripData(data) {
  if (!data) return data;

  const validTimes = ['Morning', 'Afternoon', 'Evening'];
  const validCategories = ['Documents', 'Clothing', 'Gear', 'Other'];

  // Normalize itinerary day activities
  if (Array.isArray(data.itinerary)) {
    data.itinerary.forEach(day => {
      if (Array.isArray(day.activities)) {
        day.activities.forEach(act => {
          // Normalize timeOfDay
          if (!act.timeOfDay) {
            act.timeOfDay = 'Morning';
          } else {
            const timeLower = act.timeOfDay.toLowerCase();
            if (timeLower.includes('morning')) {
              act.timeOfDay = 'Morning';
            } else if (timeLower.includes('afternoon')) {
              act.timeOfDay = 'Afternoon';
            } else if (timeLower.includes('evening') || timeLower.includes('night')) {
              act.timeOfDay = 'Evening';
            } else {
              act.timeOfDay = 'Morning'; // default fallback
            }
          }
          // Ensure estimatedCostUSD is a number
          if (act.estimatedCostUSD !== undefined) {
            act.estimatedCostUSD = Number(act.estimatedCostUSD) || 0;
          }
        });
      }
    });
  }

  // Normalize packingList items
  if (Array.isArray(data.packingList)) {
    data.packingList.forEach(item => {
      // Normalize category
      if (!item.category) {
        item.category = 'Other';
      } else {
        const catLower = item.category.toLowerCase();
        if (catLower.includes('document')) {
          item.category = 'Documents';
        } else if (catLower.includes('cloth')) {
          item.category = 'Clothing';
        } else if (catLower.includes('gear')) {
          item.category = 'Gear';
        } else {
          item.category = 'Other'; // map unknown categories to 'Other' instead of failing validation
        }
      }
      // Ensure isPacked is boolean
      item.isPacked = Boolean(item.isPacked);
    });
  }

  return data;
}

// Normalizes single-day activities array
function normalizeActivities(activities) {
  if (!Array.isArray(activities)) return [];
  activities.forEach(act => {
    if (!act.timeOfDay) {
      act.timeOfDay = 'Morning';
    } else {
      const timeLower = act.timeOfDay.toLowerCase();
      if (timeLower.includes('morning')) {
        act.timeOfDay = 'Morning';
      } else if (timeLower.includes('afternoon')) {
        act.timeOfDay = 'Afternoon';
      } else if (timeLower.includes('evening') || timeLower.includes('night')) {
        act.timeOfDay = 'Evening';
      } else {
        act.timeOfDay = 'Morning';
      }
    }
    if (act.estimatedCostUSD !== undefined) {
      act.estimatedCostUSD = Number(act.estimatedCostUSD) || 0;
    }
  });
  return activities;
}

// Fallback Mock Itinerary Generator
function generateMockItinerary(destination, durationDays, budgetTier, interests) {
  const itinerary = [];
  for (let i = 1; i <= durationDays; i++) {
    itinerary.push({
      dayNumber: i,
      activities: [
        {
          title: `Explore ${destination} landmarks`,
          description: `Enjoy sight seeing around popular locations matching interests: ${(interests || []).join(', ')}`,
          estimatedCostUSD: budgetTier === 'Low' ? 10 : budgetTier === 'Medium' ? 25 : 75,
          timeOfDay: 'Morning'
        },
        {
          title: `Culinary lunch at local spot`,
          description: `Taste local specialities in ${destination}`,
          estimatedCostUSD: budgetTier === 'Low' ? 15 : budgetTier === 'Medium' ? 35 : 100,
          timeOfDay: 'Afternoon'
        },
        {
          title: `Relaxing evening experience`,
          description: `Wrap up day ${i} with an evening stroll or local show`,
          estimatedCostUSD: budgetTier === 'Low' ? 5 : budgetTier === 'Medium' ? 20 : 60,
          timeOfDay: 'Evening'
        }
      ]
    });
  }

  const hotels = [
    {
      name: `${destination} Grand Stay`,
      tier: budgetTier === 'Low' ? 'Budget' : budgetTier === 'Medium' ? 'Mid Range' : 'Luxury',
      estimatedCostNightUSD: budgetTier === 'Low' ? 45 : budgetTier === 'Medium' ? 110 : 350,
      rating: '4.7/5'
    },
    {
      name: `Hotel ${destination} Plaza`,
      tier: budgetTier === 'Low' ? 'Budget Friendly' : budgetTier === 'Medium' ? 'Mid Range' : 'Luxury Imperial',
      estimatedCostNightUSD: budgetTier === 'Low' ? 55 : budgetTier === 'Medium' ? 130 : 420,
      rating: '4.8/5'
    }
  ];

  const estimatedBudget = {
    transport: budgetTier === 'Low' ? 40 : budgetTier === 'Medium' ? 100 : 250,
    accommodation: (budgetTier === 'Low' ? 45 : budgetTier === 'Medium' ? 110 : 350) * durationDays,
    food: (budgetTier === 'Low' ? 30 : budgetTier === 'Medium' ? 70 : 180) * durationDays,
    activities: (budgetTier === 'Low' ? 30 : budgetTier === 'Medium' ? 80 : 200) * durationDays,
    total: 0
  };
  estimatedBudget.total = estimatedBudget.transport + estimatedBudget.accommodation + estimatedBudget.food + estimatedBudget.activities;

  const packingList = [
    { item: 'Passport and Travel Documents', category: 'Documents', isPacked: false },
    { item: `Seasonal clothing appropriate for ${destination}`, category: 'Clothing', isPacked: false },
    { item: 'Comfortable walking/hiking shoes', category: 'Gear', isPacked: false },
    { item: 'Universal power adapter', category: 'Gear', isPacked: false }
  ];

  if ((interests || []).includes('Adventure')) {
    packingList.push({ item: 'Active outdoor clothing & gear', category: 'Gear', isPacked: false });
  }
  if ((interests || []).includes('Food')) {
    packingList.push({ item: 'Digestive aids & local food guides', category: 'Other', isPacked: false });
  }

  return { itinerary, hotels, estimatedBudget, packingList };
}

// Fallback Mock Day Generator
function generateMockDay(dayNumber, instruction, trip) {
  return {
    activities: [
      {
        title: `AI Modified: Activity for Day ${dayNumber}`,
        description: `This activity was updated to focus on: "${instruction}"`,
        estimatedCostUSD: trip.budgetTier === 'Low' ? 15 : trip.budgetTier === 'Medium' ? 30 : 90,
        timeOfDay: 'Morning'
      },
      {
        title: `AI Modified: Afternoon Experience`,
        description: `Enjoy local activities suited for a ${trip.budgetTier} budget.`,
        estimatedCostUSD: trip.budgetTier === 'Low' ? 10 : trip.budgetTier === 'Medium' ? 25 : 70,
        timeOfDay: 'Afternoon'
      }
    ],
    estimatedBudget: {
      ...trip.estimatedBudget,
      activities: (trip.estimatedBudget.activities || 0) + 10,
      total: (trip.estimatedBudget.total || 0) + 10
    }
  };
}


// Generate New Trip Itinerary
exports.generateNewTrip = async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;
  const userId = req.user.id;

  if (!destination || !durationDays || !budgetTier) {
    return res.status(400).json({ message: 'Destination, durationDays, and budgetTier are required' });
  }

  const prompt = `
    Create a detailed travel plan for a ${durationDays}-day trip to ${destination}.
    Budget preference is ${budgetTier}. Interests are: ${(interests || []).join(', ')}.

    You must output ONLY a valid JSON object matching this structure:
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { "title": "Activity name", "description": "Brief text details", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
          ]
        }
      ],
      "hotels": [
        { "name": "Recommended Hotel", "tier": "Budget", "estimatedCostNightUSD": 85, "rating": "4.5/5" }
      ],
      "estimatedBudget": {
        "transport": 120,
        "accommodation": 300,
        "food": 150,
        "activities": 100,
        "total": 670
      },
      "packingList": [
        { "item": "Passport", "category": "Documents", "isPacked": false }
      ]
    }
    For the packingList, generate item checklists divided into categories like 'Documents', 'Clothing', 'Gear', 'Other' that are customized based on the local climate of ${destination} during standard travel periods.
    Make sure estimates match typical realistic local rates for the specified budgetTier.
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    let cleanResult;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.includes('YOUR_GEMINI_API_KEY_HERE')) {
      console.warn("Using mock itinerary generator because GEMINI_API_KEY is not configured.");
      cleanResult = generateMockItinerary(destination, durationDays, budgetTier, interests);
    } else {
      // Use Gemini 2.5 flash or fall back to Gemini 1.5 flash
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!parsedResponseText) {
        throw new Error("Could not extract generation data from response.");
      }

      cleanResult = JSON.parse(parsedResponseText);
    }

    cleanResult = normalizeTripData(cleanResult);

    // Save user isolated trip directly into MongoDB
    const newTrip = new Trip({
      userId,
      destination,
      durationDays,
      budgetTier,
      interests,
      itinerary: cleanResult.itinerary,
      hotels: cleanResult.hotels,
      estimatedBudget: cleanResult.estimatedBudget,
      packingList: cleanResult.packingList
    });

    const savedTrip = await newTrip.save();
    return res.status(201).json(savedTrip);

  } catch (error) {
    console.error("Critical AI Generation Error, falling back to Mock:", error);
    try {
      const cleanResult = generateMockItinerary(destination, durationDays, budgetTier, interests);
      const newTrip = new Trip({
        userId,
        destination,
        durationDays,
        budgetTier,
        interests,
        itinerary: cleanResult.itinerary,
        hotels: cleanResult.hotels,
        estimatedBudget: cleanResult.estimatedBudget,
        packingList: cleanResult.packingList
      });
      const savedTrip = await newTrip.save();
      return res.status(201).json(savedTrip);
    } catch (fallbackError) {
      console.error("Critical Fallback Error:", fallbackError);
      return res.status(500).json({ message: "Fail-safe: API encountered an error processing your trip. Please try again." });
    }
  }
};

// Retrieve User Isolation Saved Trips
exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Server error retrieving trips' });
  }
};

// Update Trip (itinerary, packing status, details)
exports.updateTrip = async (req, res) => {
  const { id } = req.params;
  try {
    const trip = await Trip.findOne({ _id: id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    // Update fields that are provided
    if (req.body.itinerary) trip.itinerary = req.body.itinerary;
    if (req.body.packingList) trip.packingList = req.body.packingList;
    if (req.body.estimatedBudget) trip.estimatedBudget = req.body.estimatedBudget;
    if (req.body.hotels) trip.hotels = req.body.hotels;

    const updatedTrip = await trip.save();
    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Server error updating trip' });
  }
};

// Delete Trip
exports.deleteTrip = async (req, res) => {
  const { id } = req.params;
  try {
    const trip = await Trip.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    res.json({ message: 'Trip successfully removed' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Server error deleting trip' });
  }
};

// Regenerate specific Day
exports.regenerateDay = async (req, res) => {
  const { id } = req.params;
  const { dayNumber, instruction } = req.body;

  if (!dayNumber || !instruction) {
    return res.status(400).json({ message: 'dayNumber and instruction are required' });
  }

  let trip;
  try {
    trip = await Trip.findOne({ _id: id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    const prompt = `
      You are an expert travel planner modifying a trip to ${trip.destination}.
      The total duration is ${trip.durationDays} days and budget tier is ${trip.budgetTier}.
      We are modifying Day ${dayNumber} specifically.
      The traveler wants this modification: "${instruction}".

      Here is the current trip state for reference:
      ${JSON.stringify(trip)}

      You must output ONLY a valid JSON object matching this structure:
      {
        "activities": [
          { "title": "Activity name", "description": "Brief description", "estimatedCostUSD": 25, "timeOfDay": "Morning" }
        ],
        "estimatedBudget": {
          "transport": 120,
          "accommodation": 300,
          "food": 150,
          "activities": 110,
          "total": 680
        }
      }
      Modify the activities for Day ${dayNumber} using the user's instructions.
      Ensure you also recalculate and output the updated overall estimatedBudget, incorporating the changes made.
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    let cleanResult;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.includes('YOUR_GEMINI_API_KEY_HERE')) {
      console.warn("Using mock day regenerator because GEMINI_API_KEY is not configured.");
      cleanResult = generateMockDay(dayNumber, instruction, trip);
    } else {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!parsedResponseText) {
        throw new Error("Could not extract generation data from response.");
      }

      cleanResult = JSON.parse(parsedResponseText);
    }

    if (cleanResult.activities) {
      cleanResult.activities = normalizeActivities(cleanResult.activities);
    }

    // Update the specific day's activities in itinerary
    let dayFound = false;
    trip.itinerary = trip.itinerary.map(day => {
      if (day.dayNumber === parseInt(dayNumber)) {
        dayFound = true;
        return {
          dayNumber: day.dayNumber,
          activities: cleanResult.activities
        };
      }
      return day;
    });

    if (!dayFound) {
      return res.status(400).json({ message: `Day ${dayNumber} does not exist in this trip's itinerary` });
    }

    // Update the overall trip budget
    if (cleanResult.estimatedBudget) {
      trip.estimatedBudget = cleanResult.estimatedBudget;
    }

    const updatedTrip = await trip.save();
    res.json(updatedTrip);

  } catch (error) {
    console.error("Critical AI Day Regeneration Error, falling back to Mock:", error);
    try {
      const cleanResult = generateMockDay(dayNumber, instruction, trip);
      let dayFound = false;
      trip.itinerary = trip.itinerary.map(day => {
        if (day.dayNumber === parseInt(dayNumber)) {
          dayFound = true;
          return {
            dayNumber: day.dayNumber,
            activities: cleanResult.activities
          };
        }
        return day;
      });
      if (cleanResult.estimatedBudget) {
        trip.estimatedBudget = cleanResult.estimatedBudget;
      }
      const updatedTrip = await trip.save();
      res.json(updatedTrip);
    } catch (fallbackError) {
      console.error("Critical Day Fallback Error:", fallbackError);
      res.status(500).json({ message: "Failed to regenerate day itinerary. Please try again." });
    }
  }
};
