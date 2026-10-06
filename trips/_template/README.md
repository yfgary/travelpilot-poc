# Multi Trip Template

Create a new folder under `trips/<trip-id>/` and copy the example files in this folder.

The shared app uses one set of HTML pages. A new trip does **not** need another `itinerary.html`, `trip-info.html`, `attractions.html` or `live.html`.

## Itinerary

Set `renderers.itinerary.mode` to `generate` in `trip.json`. The shared `itinerary.html` page will build D1–Dn directly from `itinerary.json`.

Core itinerary fields:

- `id`: `d1`, `d2`, ...
- `day`: day number
- `date`: `YYYY-MM-DD`
- `title`: day title
- `route`: summary route
- `weatherRegion`: region id used by the weather layer
- `driving`: whether the day is a driving day
- `items[]`: timeline entries with `time`, `type`, `title`, optional `map`, `note`, `attractionId`, and `durationMinutes`
- `hardCuts[]`: optional non-negotiable times

`attractionId` is optional but recommended for attraction/drive items because Today Mode and Driving Mode can then match the exact `weatherProfiles` from `attractions.json` without relying on title/map matching.

## Trip Info

Set `renderers.tripInfo.mode` to `generate` and add `tripInfo: "trip-info.json"` under `dataFiles`.

The shared `trip-info.html` page can build Overview, Transport, Car, Hotels, Parking, Hard Cuts, Weather notes, Checklist and Emergency sections. Missing sections are hidden automatically.

## Attractions

Set `renderers.attractions.mode` to `generate` and add `attractions: "attractions.json"` under `dataFiles`.

Core fields include `id`, `name`, `location`, `day`, `status`, `score`, `map`, `duration`, optional rich info, and `weatherProfiles`.

For the 2027 Japan trip, attractions run in `hydrate` mode so the existing rich Japan-specific cards and ⓘ descriptions remain preserved.

## Live Cam

Set `renderers.liveCam.mode` to `generate` and add `liveCams: "live-cams.json"` under `dataFiles`.

The shared Live page can generate day sections from reusable camera definitions (`youtube`, `image`, `link`) plus day routes, places and official links. Japan 2027 stays in safe hydrate mode while its D2 and D6–D8 camera groups come from JSON.

## Weather

Set `renderers.weather.mode` to `generate`, `renderers.weather.profileStandard` to `v1`, and add `weather: "weather.json"` under `dataFiles`.

The shared weather engine reads region names, coordinates, D1–Dn mapping and optional dynamic rules from JSON. Region selection/cache is isolated per trip and uses the trip timezone.

### Weather Activity Profile Standard v1

The /10 score is split into **Experience** and **Access / Safety**, then combined with a safety cap. Poor road/sea/access conditions therefore cannot be hidden by a high indoor or scenic experience score.

Available profile ids include:

- `indoor`, `semi_indoor`, `city_walk`, `historic_outdoor`, `outdoor_market`, `outlet_open_air`, `theme_park`
- `mountain_view`, `ropeway_mountain`, `hiking`, `snow_walk`, `ski_snow`, `village_scenic`, `waterfall_river`, `cave`, `wildlife_outdoor`, `road_trip`
- `coastal_scenic`, `beach`, `boat_cruise`, `open_sea`, `ferry`, `snorkel_dive`, `surf_water_sport`, `lake_activity`
- `cycling`, `night_view`, `festival_outdoor`, `outdoor_onsen`, `garden_park`, `stargazing`, `camping`, `golf`

Marine profiles require wave/swell/water-temperature data for a full marine-safety judgement; if unavailable, the result is explicitly preliminary.

## Today Mode / Driving Mode

Set `features.todayMode` and/or `features.drivingMode` to `true`. For a normal new trip use:

- `renderers.todayMode.mode: "generate"`
- `renderers.drivingMode.mode: "generate"`
- `source: "itinerary"`
- `useActivityProfiles: true`

Both modes use the same `itinerary.json`, trip timezone, per-trip preview state, Weather region mapping and Weather Activity Profile scores.

Today Mode automatically chooses the trip day by the trip timezone, identifies the next stop, shows Hard Cuts, hotel/end point, map links and a destination-specific suitability score when an attraction can be matched.

Driving Mode keeps a per-trip/per-day stop index, opens Google Maps driving directions, shows the next parking point and Hard Cut, supports screen wake lock, and displays both a road-condition suitability score and a destination suitability score. Official closures, road restrictions and operation status always override the calculated score.

For Japan 2027 the tested legacy Today/Driving overlays are preserved in `hydrate` mode; the shared mode core supplies trip/time/weather/profile data and bridges the new Activity Profile scores into those overlays.

## Trip-specific modules

Trip-specific modules remain optional and belong in that trip's own `trip.json`. They are not copied into every trip automatically. For example, the 2027 Japan trip keeps its Shinhotaka D6–D8 weather-day selector as a trip-specific module while still using the shared itinerary, Trip Info, Attractions, Live Cam, Weather and mode engines.
