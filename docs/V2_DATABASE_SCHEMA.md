# TravelPilot V2 — Initial Data / Supabase Schema

Status: design baseline, not yet a migration.

## Principles
- Reuse canonical entities rather than duplicate them across pages.
- Trip itinerary references places/hotels/transport records by IDs.
- Optional features are data-driven.
- User-specific state is separated from shared trip content.
- Schema must support multiple unrelated trips without code changes.

## Core entities

### trips
Suggested fields:
- id (uuid)
- slug (unique text)
- title
- destination_label
- year
- summary
- start_date
- end_date
- status_override (nullable)
- hero_image_id (nullable)
- banner_image_id (nullable)
- default_language
- data_version
- published
- created_at
- updated_at

Status should normally be derived from dates; override exists only for exceptional data/admin needs.

### trip_days
- id
- trip_id
- day_number
- date
- title
- route_summary
- highlights
- accommodation_id (nullable)
- primary_weather_location_id (nullable)
- notes
- sort_order

### timeline_items
- id
- trip_day_id
- item_type
- start_time
- end_time
- title
- place_id (nullable)
- transport_id (nullable)
- hotel_id (nullable)
- duration_minutes (nullable)
- description
- is_hard_cut
- sort_order

`item_type` is generic, e.g. place / transport / meal / hotel / note / activity.

### places
- id
- slug
- name
- region_id
- place_type
- summary
- description
- why_visit
- history_background
- local_importance
- what_to_see
- takeaway
- suggested_duration_minutes
- opening_time_text
- last_entry_text
- closing_time_text
- fee_text
- rating_10
- latitude (nullable)
- longitude (nullable)
- google_maps_url (nullable)
- official_url (nullable)
- active
- updated_at

### regions
- id
- name
- country_code
- timezone
- latitude (nullable)
- longitude (nullable)

### hotels
- id
- place_id (nullable)
- name
- hotel_type
- booking_price
- currency
- payment_status
- breakfast_included
- check_in_text
- check_out_text
- booking_reference_private (nullable; protect appropriately)
- notes

### transport
- id
- trip_id
- transport_type
- provider
- service_number
- origin_place_id (nullable)
- destination_place_id (nullable)
- departure_at (nullable)
- arrival_at (nullable)
- booking_status
- price
- currency
- notes

### rental_cars
- id
- trip_id
- provider
- vehicle_class
- pickup_place_id
- dropoff_place_id
- pickup_at
- dropoff_at
- drive_type
- winter_tires
- package_name
- price
- currency
- notes

### weather_locations
- id
- trip_id
- region_id (nullable)
- label
- latitude
- longitude
- sort_order
- active

### activity_categories
- id
- key
- label
- description

### place_activity_categories
- place_id
- activity_category_id
- weight (default 1)

### day_activity_categories
Optional override/aggregation table if a day's suitability needs explicit weighting independent of its places:
- trip_day_id
- activity_category_id
- weight

### backup_places
- id
- trip_day_id
- place_id
- priority
- reason
- notes

### live_cams
- id
- label
- region_id (nullable)
- place_id (nullable)
- source_type
- source_url
- preview_url (nullable)
- official_url (nullable)
- active
- sort_order

### trip_live_cams
- trip_id
- live_cam_id
- sort_order

### images
- id
- storage_path_or_url
- alt_text
- source_url (nullable)
- attribution (nullable)
- license_note (nullable)
- width (nullable)
- height (nullable)

### place_images
- place_id
- image_id
- role
- sort_order

### day_images
- trip_day_id
- image_id
- role
- sort_order

### sources
- id
- entity_type
- entity_id
- source_type
- title
- url
- checked_at

## Trip information / hard cuts

### trip_hard_cuts
- id
- trip_id
- trip_day_id (nullable)
- title
- hard_cut_at
- description
- priority

### emergency_info
- id
- trip_id
- category
- label
- value
- notes
- sort_order

## Checklists

### checklist_definitions
- id
- trip_id
- checklist_type
- title
- description

Typical types:
- pre_departure
- morning_departure

### checklist_items
- id
- checklist_definition_id
- label
- description
- sort_order
- active

### user_checklist_state
- user_id
- checklist_item_id
- checked
- checked_at
- updated_at
- device_id (nullable)

This table is user-specific and requires RLS.

## User preferences

### user_preferences
- user_id
- font_size
- language
- auto_update
- updated_at

Initial font size values:
- small
- medium
- large

Language ships as Traditional Chinese initially.

## Versioning

### app_versions
- version
- released_at
- minimum_supported_data_version (nullable)
- notes

### trip_versions
- trip_id
- data_version
- published_at
- notes

Client keeps local:
- app_version
- trip_data_version per downloaded trip
- last_sync_at

## Optional future entities
Do not implement until needed:
- translations
- trip collaborators
- user trip ownership/sharing
- notification subscriptions
- audit history

## RLS/security requirement
Before enabling writes, define RLS policies for all user-specific tables. Do not expose privileged keys in browser code.

## Validation requirement
Before any migration is applied, validate this schema against:
1. Japan 2027 Golden Content trip
2. one unrelated trip with different transport/accommodation patterns
3. offline checklist sync requirements
4. place reuse in Detailed Itinerary + Attractions Overview + Today Mode
