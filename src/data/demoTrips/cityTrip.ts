import type { TripSnapshot } from '../schema/trip'

// Fictional POC data only. No destination-specific application behavior.
export const cityTrip: TripSnapshot = {
  "schemaVersion": 1,
  "trip": {
    "id": "demo-trip-id",
    "slug": "demo-trip",
    "title": "城市週末示範旅程",
    "shortTitle": "城市週末",
    "destinationLabel": "虛構都會",
    "summary": "純 POC 虛構資料：三天以步行及公共交通探索室內展館、餐廳與商店。",
    "startDate": "2030-04-12",
    "endDate": "2030-04-14",
    "timezone": "Etc/UTC"
  },
  "regions": [
    {
      "id": "city-region",
      "name": "都會中心",
      "coordinates": {
        "latitude": 0,
        "longitude": 0
      },
      "weatherConfigurationId": "city-weather"
    }
  ],
  "days": [
    {
      "id": "city-day-1",
      "dayNumber": 1,
      "date": "2030-04-12",
      "title": "展館與街區",
      "routeSummary": "車站 → 室內展館 → 旅館",
      "highlights": [
        "展館與街區"
      ],
      "imageIds": [],
      "accommodationId": "city-stay",
      "primaryWeatherRegionId": "city-weather",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "city-train-item",
          "type": "travel",
          "title": "搭乘示範列車",
          "optional": false,
          "transportId": "city-train",
          "durationMinutes": 20
        },
        {
          "id": "city-gallery-item",
          "type": "activity",
          "title": "探索室內展館",
          "optional": false,
          "placeId": "city-gallery",
          "durationMinutes": 90
        },
        {
          "id": "city-checkin-item",
          "type": "stay",
          "title": "入住都會旅館",
          "optional": false,
          "accommodationId": "city-stay"
        }
      ],
      "optionalContent": [],
      "backupContent": []
    },
    {
      "id": "city-day-2",
      "dayNumber": 2,
      "date": "2030-04-13",
      "title": "餐飲與購物",
      "routeSummary": "旅館 → 餐廳 → 商店",
      "highlights": [
        "餐飲與購物"
      ],
      "imageIds": [],
      "accommodationId": "city-stay",
      "primaryWeatherRegionId": "city-weather",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "city-walk-item",
          "type": "travel",
          "title": "街區步行",
          "optional": false,
          "transportId": "city-walk",
          "durationMinutes": 15
        },
        {
          "id": "city-meal-item",
          "type": "meal",
          "title": "示範午餐",
          "optional": false,
          "placeId": "city-food",
          "durationMinutes": 60
        },
        {
          "id": "city-shopping-item",
          "type": "activity",
          "title": "探索商店",
          "optional": false,
          "placeId": "city-shop",
          "durationMinutes": 45
        }
      ],
      "optionalContent": [],
      "backupContent": []
    },
    {
      "id": "city-day-3",
      "dayNumber": 3,
      "date": "2030-04-14",
      "title": "悠閒回程",
      "routeSummary": "旅館 → 車站",
      "highlights": [
        "悠閒回程"
      ],
      "imageIds": [],
      "accommodationId": "city-stay",
      "primaryWeatherRegionId": "city-weather",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "city-checkout-item",
          "type": "stay",
          "title": "退房",
          "optional": false,
          "accommodationId": "city-stay"
        },
        {
          "id": "city-return-item",
          "type": "travel",
          "title": "公共交通回程",
          "optional": false,
          "transportId": "city-train",
          "durationMinutes": 20
        }
      ],
      "optionalContent": [],
      "backupContent": []
    }
  ],
  "places": [
    {
      "id": "city-gallery",
      "name": "虛構室內展館",
      "regionId": "city-region",
      "type": "attraction",
      "summary": "室內模型與創作展覽，僅供測試。",
      "imageIds": [],
      "activityProfileIds": [
        "city-indoor"
      ],
      "sourceIds": []
    },
    {
      "id": "city-food",
      "name": "虛構街角餐廳",
      "regionId": "city-region",
      "type": "food",
      "summary": "虛構午餐活動，沒有真實餐單。",
      "imageIds": [],
      "activityProfileIds": [
        "city-indoor"
      ],
      "sourceIds": []
    },
    {
      "id": "city-shop",
      "name": "虛構生活商店",
      "regionId": "city-region",
      "type": "shopping",
      "summary": "示範購物活動。",
      "imageIds": [],
      "activityProfileIds": [
        "city-indoor"
      ],
      "sourceIds": []
    }
  ],
  "accommodations": [
    {
      "id": "city-stay",
      "name": "虛構都會旅館",
      "type": "hotel",
      "stayStartDate": "2030-04-12",
      "stayEndDate": "2030-04-14",
      "room": "虛構示範房間",
      "mealPlan": "示範早餐",
      "bookingState": "示範已確認",
      "notes": [
        "純 POC 虛構資料，並非真實預訂。"
      ]
    }
  ],
  "transport": [
    {
      "id": "city-train",
      "type": "train",
      "origin": "都會車站",
      "destination": "街區中心",
      "navigationTargetIds": [],
      "notes": [],
      "warnings": []
    },
    {
      "id": "city-walk",
      "type": "walk",
      "origin": "展館街區",
      "destination": "商店街區",
      "navigationTargetIds": [],
      "notes": [],
      "warnings": []
    }
  ],
  "navigationTargets": [],
  "hardCuts": [],
  "checklists": [
    {
      "id": "city-checklist",
      "type": "preparation",
      "title": "出發準備",
      "description": "虛構示範清單",
      "order": 0,
      "notes": [],
      "groups": [
        {
          "id": "city-packing",
          "title": "隨身物品",
          "order": 0,
          "notes": [],
          "items": [
            {
              "id": "city-ticket",
              "label": "檢查示範交通票",
              "order": 0,
              "notes": []
            },
            {
              "id": "city-bag",
              "label": "準備隨身袋",
              "order": 1,
              "notes": []
            }
          ]
        }
      ]
    }
  ],
  "weather": {
    "weatherRegions": [
      {
        "id": "city-weather",
        "regionId": "city-region",
        "label": "都會天氣示範區",
        "operationNotes": []
      }
    ],
    "activityProfiles": [
      {
        "id": "city-indoor",
        "label": "室內活動",
        "weights": {
          "precipitation": 0
        },
        "operationNotes": [
          "資料結構示範，不執行評分。"
        ]
      }
    ],
    "weighting": [
      {
        "regionId": "city-region",
        "activityProfileId": "city-indoor",
        "weight": 1
      }
    ],
    "scoring": {
      "schemaVersion": 1,
      "config": {}
    },
    "operationNotes": []
  },
  "liveCams": [],
  "images": [],
  "sources": []
}
