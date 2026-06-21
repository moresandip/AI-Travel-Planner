'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateTripForm from '@/components/CreateTripForm';
import {
  Compass,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Loader2,
  Hotel,
  CloudSun,
  ClipboardList
} from 'lucide-react';
import { getApiUrl } from '@/utils/api';

const apiURL = getApiUrl();

interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostUSD: number;
  timeOfDay: string;
}

interface ItineraryDay {
  _id?: string;
  dayNumber: number;
  activities: Activity[];
}

interface SuggestedHotel {
  _id?: string;
  name: string;
  tier: string;
  estimatedCostNightUSD: number;
  rating: string;
}

interface PackingItem {
  _id?: string;
  item: string;
  category: string;
  isPacked: boolean;
}

interface Trip {
  _id: string;
  destination: string;
  durationDays: number;
  budgetTier: string;
  interests: string[];
  itinerary: ItineraryDay[];
  hotels: SuggestedHotel[];
  packingList: PackingItem[];
  estimatedBudget: {
    total: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Custom activity forms state
  const [newActivityName, setNewActivityName] = useState('');
  const [targetDay, setTargetDay] = useState<number | null>(null);
  
  // Custom day regeneration state
  const [regenInstruction, setRegenInstruction] = useState('');
  const [regenDay, setRegenDay] = useState<number | null>(null);
  const [regenLoadingDay, setRegenLoadingDay] = useState<number | null>(null);

  // Authenticate user and fetch trips
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchUserTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0) {
          // Keep current selected trip or select first
          setSelectedTrip((prev) => {
            if (prev) {
              const current = data.find((t: Trip) => t._id === prev._id);
              return current || data[0];
            }
            return data[0];
          });
        } else {
          setSelectedTrip(null);
        }
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to query user trips:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate New Trip
  const handleCreateTrip = async (tripData: {
    destination: string;
    durationDays: number;
    budgetTier: string;
    interests: string[];
  }) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });
      
      if (res.ok) {
        const newTrip = await res.json();
        await fetchUserTrips();
        setSelectedTrip(newTrip);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Generation failed');
      }
    } catch (err) {
      console.error('Error generating trip:', err);
      alert('Network error. Failed to generate trip blueprint.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Dynamic Activity
  const handleAddActivity = async (dayNumber: number) => {
    if (!newActivityName.trim() || !selectedTrip) return;

    const updatedItinerary = selectedTrip.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          activities: [
            ...day.activities,
            {
              title: newActivityName,
              description: 'Added by traveler',
              estimatedCostUSD: 0,
              timeOfDay: 'Afternoon'
            }
          ]
        };
      }
      return day;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
        setNewActivityName('');
        setTargetDay(null);
        // Refresh local trips list
        fetchUserTrips();
      }
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
  };

  // Remove Activity
  const handleRemoveActivity = async (dayNumber: number, activityIndex: number) => {
    if (!selectedTrip) return;

    const updatedItinerary = selectedTrip.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        const activities = [...day.activities];
        activities.splice(activityIndex, 1);
        return { ...day, activities };
      }
      return day;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
        fetchUserTrips();
      }
    } catch (err) {
      console.error('Failed to remove activity:', err);
    }
  };

  // Toggle Packing List Checklist Item Checkbox
  const togglePackingItem = async (itemId: string) => {
    if (!selectedTrip) return;

    const updatedPacking = selectedTrip.packingList.map(item => {
      if (item._id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packingList: updatedPacking })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
        fetchUserTrips();
      }
    } catch (err) {
      console.error('Failed to toggle packing checklist:', err);
    }
  };

  // Regenerate Specific Day
  const handleRegenerateDay = async (dayNumber: number) => {
    if (!regenInstruction.trim() || !selectedTrip) return;

    setRegenLoadingDay(dayNumber);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips/${selectedTrip._id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dayNumber, instruction: regenInstruction })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
        setRegenInstruction('');
        setRegenDay(null);
        fetchUserTrips();
      } else {
        const err = await res.json();
        alert(err.message || 'Regeneration failed');
      }
    } catch (err) {
      console.error('Day regeneration failed:', err);
      alert('Failed to connect to backend for itinerary regeneration');
    } finally {
      setRegenLoadingDay(null);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to permanently delete this trip plan?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiURL}/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchUserTrips();
      }
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-100 flex-col gap-4">
        <Loader2 className="animate-spin text-indigo-500 h-10 w-10" />
        <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Connecting Secure User Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                AI Travel Dashboard
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-mono">User Data Enclave Protected</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Trip Selectors */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create Trip Form Section */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-md font-bold mb-4 text-white flex items-center gap-2">
              <Compass className="text-indigo-400 h-5 w-5" /> Create New Adventure
            </h2>
            <CreateTripForm onSubmit={handleCreateTrip} loading={actionLoading} />
          </div>

          {/* Active Trips Lists */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-md font-bold mb-4 text-white flex items-center gap-2">
              <Calendar className="text-indigo-400 h-5 w-5" /> Your Active Plans
            </h2>
            {trips.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No itineraries discovered in your vault. Create one above!
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    className={`group w-full p-4 rounded-xl border transition flex justify-between items-center cursor-pointer ${
                      selectedTrip?._id === trip._id
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800 hover:bg-slate-900/20'
                    }`}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-200">{trip.destination}</p>
                      <p className="text-[10px] font-mono opacity-80 uppercase tracking-wide">
                        {trip.durationDays} Days • {trip.budgetTier} Budget
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrip(trip._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      title="Delete trip plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ledger, Itinerary Cards, Hotels, Packing List */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <>
              {/* Financial Ledger Section */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
                <h2 className="text-md font-bold mb-4 text-white flex items-center gap-2">
                  <DollarSign className="text-indigo-400 h-5 w-5" /> Financial Cost Ledger
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Accommodation</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">${selectedTrip.estimatedBudget?.accommodation || 0}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Culinary & Food</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">${selectedTrip.estimatedBudget?.food || 0}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activities</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">${selectedTrip.estimatedBudget?.activities || 0}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transit & Transport</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">${selectedTrip.estimatedBudget?.transport || 0}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300">Grand Total Estimate:</span>
                  <span className="text-xl font-black text-indigo-400">${selectedTrip.estimatedBudget?.total || 0}</span>
                </div>
              </div>

              {/* Itinerary Board with Editing Timeline */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
                <h2 className="text-xl font-bold mb-6 text-white border-b border-slate-850 pb-3 flex justify-between items-center">
                  <span>Day-by-Day Timeline: {selectedTrip.destination}</span>
                  <span className="text-xs font-mono uppercase bg-slate-950 border border-slate-900 px-3 py-1 rounded-full text-indigo-400">
                    {selectedTrip.durationDays} Days
                  </span>
                </h2>

                <div className="space-y-8">
                  {selectedTrip.itinerary.map((day) => (
                    <div key={day.dayNumber} className="border-l-2 border-indigo-500 pl-6 relative">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-4 border-slate-950" />
                      
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-bold text-slate-200">Day {day.dayNumber}</h3>
                        
                        <div className="flex items-center gap-2">
                          {regenDay === day.dayNumber ? (
                            <button
                              onClick={() => setRegenDay(null)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 transition"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setRegenDay(day.dayNumber);
                                setRegenInstruction('');
                              }}
                              disabled={regenLoadingDay !== null}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-900"
                            >
                              <RefreshCw className="h-2.5 w-2.5" /> Regenerate Day
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Day Regeneration Inputs */}
                      {regenDay === day.dayNumber && (
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl mb-4 space-y-3">
                          <p className="text-xs text-slate-400">Instruct AI on how to modify Day {day.dayNumber}&apos;s itinerary:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Change to focus on historic museums and outdoor walks"
                              value={regenInstruction}
                              onChange={(e) => setRegenInstruction(e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-indigo-500 w-full text-white"
                            />
                            <button
                              onClick={() => handleRegenerateDay(day.dayNumber)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
                            >
                              Go
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Loader for Specific Day Regeneration */}
                      {regenLoadingDay === day.dayNumber ? (
                        <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl text-center space-y-2 mb-4">
                          <Loader2 className="animate-spin text-indigo-500 h-6 w-6 mx-auto" />
                          <p className="text-xs text-slate-400">LLM agent modifying Day {day.dayNumber} activities...</p>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {day.activities.map((act, idx) => (
                            <div key={idx} className="group bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-800 transition flex justify-between items-start">
                              <div className="space-y-1 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-200">{act.title}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-900/40">
                                    {act.timeOfDay}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
                                {act.estimatedCostUSD > 0 && (
                                  <p className="text-[10px] font-semibold text-slate-500 font-mono">Cost: ${act.estimatedCostUSD}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveActivity(day.dayNumber, idx)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition self-center"
                                title="Remove activity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Activity Inline Form */}
                      {targetDay === day.dayNumber ? (
                        <div className="flex items-center gap-2 max-w-sm mt-3">
                          <input
                            type="text"
                            placeholder="Enter activity title..."
                            value={newActivityName}
                            onChange={(e) => setNewActivityName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-indigo-500 w-full text-white"
                          />
                          <button
                            onClick={() => handleAddActivity(day.dayNumber)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setTargetDay(null);
                              setNewActivityName('');
                            }}
                            className="text-slate-500 hover:text-slate-300 text-xs px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetDay(day.dayNumber);
                            setNewActivityName('');
                          }}
                          className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add custom activity
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bonus Feature: Suggested Hotels */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-md font-bold mb-4 text-white flex items-center gap-2">
                  <Hotel className="text-indigo-400 h-5 w-5" /> Curated Hotel Suggestions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedTrip.hotels && selectedTrip.hotels.length > 0 ? (
                    selectedTrip.hotels.map((hotel, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-200">{hotel.name}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-850">
                              {hotel.tier || 'Suggested'}
                            </span>
                            {hotel.rating && (
                              <span className="text-[10px] text-amber-400 font-bold">★ {hotel.rating}</span>
                            )}
                          </div>
                        </div>
                        {hotel.estimatedCostNightUSD > 0 && (
                          <p className="text-xs font-mono text-slate-400 mt-2 border-t border-slate-900 pt-2">
                            Est. <span className="font-bold text-slate-200">${hotel.estimatedCostNightUSD}</span> / night
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center col-span-3">No hotel suggestions available.</p>
                  )}
                </div>
              </div>

              {/* Creative Weather-Aware Packing Assistant */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CloudSun className="text-indigo-400 h-5 w-5" /> Smart Weather-Aware Packing Assistant
                  </h3>
                  <span className="text-[9px] font-mono tracking-widest uppercase bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">
                    Creative Feature
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  The AI agent maps your destination climate against activities on your timeline to generate a targeted checklist. Select items as you pack to save state:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTrip.packingList && selectedTrip.packingList.length > 0 ? (
                    selectedTrip.packingList.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => togglePackingItem(item._id!)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                          item.isPacked
                            ? 'bg-emerald-950/10 border-emerald-900/40 text-slate-500'
                            : 'bg-slate-950 border-slate-900 text-slate-200 hover:border-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.isPacked}
                          readOnly
                          className="h-4 w-4 rounded bg-slate-950 border-slate-800 accent-emerald-500 cursor-pointer"
                        />
                        <span className={`text-xs ${item.isPacked ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          {item.item}
                        </span>
                        <span className="ml-auto text-[9px] uppercase bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-850">
                          {item.category}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <ClipboardList className="h-6 w-6 text-slate-600" />
                      <span>Generating packing checklists...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-96 bg-slate-900/40 border border-slate-850 rounded-2xl text-center p-8">
              <span className="text-6xl mb-4 animate-bounce">✈️</span>
              <h3 className="text-lg font-bold text-white mb-2">No Selected Blueprint</h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Select an existing itinerary from the left planner panel, or trigger a new AI generation blueprint to begin!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
