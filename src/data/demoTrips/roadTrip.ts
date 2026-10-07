import type { TripSnapshot } from '../schema/trip'

// Fictional POC data only. No destination-specific application behavior.
export const roadTrip: TripSnapshot = {
  "schemaVersion": 1,
  "trip": {
    "id": "demo-road-trip-id",
    "slug": "demo-road-trip",
    "title": "山區自駕示範旅程",
    "shortTitle": "山區自駕",
    "destinationLabel": "虛構山區",
    "summary": "純 POC 虛構資料：四天自駕連接山麓與高地，含自然步道、停車目標及備選活動。",
    "startDate": "2025-02-05",
    "endDate": "2025-02-08",
    "timezone": "Etc/UTC"
  },
  "regions": [
    {
      "id": "road-foothill",
      "name": "示範山麓",
      "coordinates": {
        "latitude": 10,
        "longitude": 10
      },
      "weatherConfigurationId": "road-weather-low"
    },
    {
      "id": "road-highland",
      "name": "示範高地",
      "coordinates": {
        "latitude": 11,
        "longitude": 11
      },
      "weatherConfigurationId": "road-weather-high"
    }
  ],
  "days": [
    {
      "id": "road-day-1",
      "dayNumber": 1,
      "date": "2025-02-05",
      "title": "山麓集合",
      "routeSummary": "集合點 → 山麓住宿",
      "highlights": [
        "山麓集合"
      ],
      "imageIds": [],
      "accommodationId": "road-stay-low",
      "primaryWeatherRegionId": "road-weather-low",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "road-drive-1",
          "type": "travel",
          "title": "自駕前往山麓",
          "optional": false,
          "transportId": "road-car",
          "durationMinutes": 90
        },
        {
          "id": "road-stay-1",
          "type": "stay",
          "title": "入住山麓旅舍",
          "optional": false,
          "accommodationId": "road-stay-low"
        }
      ],
      "optionalContent": [],
      "backupContent": []
    },
    {
      "id": "road-day-2",
      "dayNumber": 2,
      "date": "2025-02-06",
      "title": "自然步道",
      "routeSummary": "山麓 → 停車場 → 步道",
      "highlights": [
        "自然步道"
      ],
      "imageIds": [],
      "accommodationId": "road-stay-low",
      "primaryWeatherRegionId": "road-weather-high",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "road-drive-2",
          "type": "travel",
          "title": "開車到步道停車場",
          "optional": false,
          "transportId": "road-car",
          "navigationTargetId": "road-parking",
          "durationMinutes": 40
        },
        {
          "id": "road-trail-item",
          "type": "activity",
          "title": "探索示範自然步道",
          "optional": false,
          "placeId": "road-trail",
          "hardCutId": "road-return-cut",
          "durationMinutes": 120,
          "warning": "示範：留意步道狀態。"
        }
      ],
      "optionalContent": [],
      "backupContent": [
        {
          "type": "place",
          "id": "road-backup"
        }
      ]
    },
    {
      "id": "road-day-3",
      "dayNumber": 3,
      "date": "2025-02-07",
      "title": "高地休息",
      "routeSummary": "山麓 → 高地旅舍",
      "highlights": [
        "高地休息"
      ],
      "imageIds": [],
      "accommodationId": "road-stay-high",
      "primaryWeatherRegionId": "road-weather-high",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "road-drive-3",
          "type": "travel",
          "title": "開車到高地",
          "optional": false,
          "transportId": "road-car",
          "durationMinutes": 60
        },
        {
          "id": "road-backup-item",
          "type": "activity",
          "title": "可選訪客中心",
          "placeId": "road-backup",
          "optional": true,
          "bonus": true
        },
        {
          "id": "road-break",
          "type": "break",
          "title": "休息及整理資料",
          "optional": false,
          "durationMinutes": 30
        }
      ],
      "optionalContent": [
        {
          "type": "place",
          "id": "road-backup"
        }
      ],
      "backupContent": []
    },
    {
      "id": "road-day-4",
      "dayNumber": 4,
      "date": "2025-02-08",
      "title": "自駕回程",
      "routeSummary": "高地 → 集合點",
      "highlights": [
        "自駕回程"
      ],
      "imageIds": [],
      "accommodationId": "road-stay-high",
      "primaryWeatherRegionId": "road-weather-low",
      "constraints": [],
      "warnings": [],
      "timeline": [
        {
          "id": "road-checkout",
          "type": "stay",
          "title": "退房",
          "optional": false,
          "accommodationId": "road-stay-high"
        },
        {
          "id": "road-drive-4",
          "type": "travel",
          "title": "自駕回程",
          "optional": false,
          "transportId": "road-car",
          "durationMinutes": 90
        }
      ],
      "optionalContent": [],
      "backupContent": []
    }
  ],
  "places": [
    {
      "id": "road-trail",
      "name": "虛構高地步道",
      "regionId": "road-highland",
      "type": "nature",
      "summary": "虛構的戶外自然活動，並非真實路線建議。",
      "imageIds": [],
      "activityProfileIds": [
        "road-outdoor"
      ],
      "sourceIds": []
    },
    {
      "id": "road-backup",
      "name": "虛構訪客中心",
      "regionId": "road-foothill",
      "type": "attraction",
      "summary": "備選室內展示空間。",
      "imageIds": [],
      "activityProfileIds": [
        "road-sheltered"
      ],
      "sourceIds": []
    }
  ],
  "accommodations": [
    {
      "id": "road-stay-low",
      "name": "虛構山麓旅舍",
      "type": "lodge",
      "stayStartDate": "2025-02-05",
      "stayEndDate": "2025-02-07",
      "room": "虛構示範房間",
      "mealPlan": "示範早餐",
      "bookingState": "示範已確認",
      "notes": [
        "純 POC 虛構資料，並非真實預訂。"
      ]
    },
    {
      "id": "road-stay-high",
      "name": "虛構高地小屋",
      "type": "cabin",
      "stayStartDate": "2025-02-07",
      "stayEndDate": "2025-02-08",
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
      "id": "road-car",
      "type": "car",
      "origin": "山麓集合點",
      "destination": "高地步道",
      "navigationTargetIds": [
        "road-parking"
      ],
      "notes": [],
      "warnings": []
    }
  ],
  "navigationTargets": [
    {
      "id": "road-parking",
      "type": "parking",
      "title": "虛構步道停車場",
      "placeId": "road-trail",
      "coordinates": {
        "latitude": 11,
        "longitude": 11
      }
    }
  ],
  "hardCuts": [
    {
      "id": "road-return-cut",
      "dayId": "road-day-2",
      "time": "16:00",
      "title": "示範折返時間",
      "severity": "warning",
      "priority": 1,
      "category": "return",
      "icon": "clock",
      "description": "純示範時間限制，並非真實營運規則。"
    }
  ],
  "checklists": [
    {
      "id": "road-checklist",
      "type": "preparation",
      "title": "出發準備",
      "description": "虛構示範清單",
      "order": 0,
      "notes": [],
      "groups": [
        {
          "id": "road-driving",
          "title": "出車檢查",
          "order": 0,
          "notes": [],
          "items": [
            {
              "id": "road-fuel",
              "label": "檢查示範燃料狀態",
              "order": 0,
              "notes": []
            },
            {
              "id": "road-route",
              "label": "確認示範路線",
              "order": 1,
              "notes": []
            }
          ]
        },
        {
          "id": "road-packing",
          "title": "戶外物品",
          "order": 1,
          "notes": [],
          "items": [
            {
              "id": "road-layer",
              "label": "準備外套",
              "order": 0,
              "notes": []
            },
            {
              "id": "road-water",
              "label": "準備飲水",
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
        "id": "road-weather-low",
        "regionId": "road-foothill",
        "label": "山麓天氣示範區",
        "operationNotes": []
      },
      {
        "id": "road-weather-high",
        "regionId": "road-highland",
        "label": "高地天氣示範區",
        "operationNotes": [
          "留意示範活動狀態。"
        ]
      }
    ],
    "activityProfiles": [
      {
        "id": "road-outdoor",
        "label": "戶外步行",
        "weights": {
          "precipitation": 1,
          "wind": 1
        },
        "operationNotes": []
      },
      {
        "id": "road-sheltered",
        "label": "有遮蔽活動",
        "weights": {
          "precipitation": 0
        },
        "operationNotes": []
      }
    ],
    "weighting": [
      {
        "dayId": "road-day-2",
        "activityProfileId": "road-outdoor",
        "weight": 1
      },
      {
        "regionId": "road-foothill",
        "activityProfileId": "road-sheltered",
        "weight": 1
      }
    ],
    "scoring": {
      "schemaVersion": 1,
      "config": {
        "safetyCap": 5
      }
    },
    "operationNotes": [
      "僅測試資料結構，不執行天氣 API 或評分。"
    ]
  },
  "liveCams": [
    {
      "id": "road-cam",
      "label": "示範高地鏡頭",
      "regionId": "road-highland",
      "placeId": "road-trail",
      "routeDayId": "road-day-2",
      "group": "示範路線",
      "sourceType": "external",
      "sourceURL": "https://example.invalid/road-cam"
    }
  ],
  "images": [],
  "sources": []
}
