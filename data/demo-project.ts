
export const demoData = {
  "projects": [
    {
      "id": "proj_demo_hinta",
      "name": "Brf Hinta",
      "description": "Exklusiva stadsradhus i hjärtat av det nya hållbara kvarteret. Modern arkitektur möter nordisk minimalism.",
      "client": "Hinta Development",
      "organization": "Studio Hinta",
      "ownerId": "user_1",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-20T14:30:00Z",
      "updatedBy": {
        "name": "Admin User",
        "avatarUrl": "https://i.pravatar.cc/150?u=a042581f4e29026704d"
      },
      "status": "active",
      "bostadsväljarenActive": true,
      "assets": [
        {
          "id": "asset_hinta_1",
          "projectId": "proj_demo_hinta",
          "type": "image",
          "title": "Exteriör Dagsljus",
          "url": "https://storage.googleapis.com/aistudio-hosting/images/realviz/BRF%20Hallon_birdeye_overview.png",
          "uploadedAt": "2024-01-01T10:00:00Z"
        },
        {
          "id": "asset_hinta_2",
          "projectId": "proj_demo_hinta",
          "type": "panorama",
          "title": "Vardagsrum 360°",
          "url": "https://pannellum.org/images/alma.jpg",
          "thumbnailUrl": "https://placehold.co/600x400/1a1a1a/e5d0b1?text=Interiör+360",
          "uploadedAt": "2024-01-02T11:00:00Z"
        }
      ],
      "members": []
    }
  ],
  "views": [
    {
      "id": "view_hinta_root",
      "projectId": "proj_demo_hinta",
      "type": "overview",
      "title": "Översikt Kvarteret",
      "imageURL": "https://storage.googleapis.com/aistudio-hosting/images/realviz/BRF%20Hallon_birdeye_overview.png",
      "parentId": null,
      "unitIds": ["u_a1", "u_a2", "u_a3", "u_a4", "u_a5", "u_a6"]
    },
    {
      "id": "view_hinta_facade",
      "projectId": "proj_demo_hinta",
      "type": "facade",
      "title": "Fasad Vy - Söder",
      "imageURL": "https://storage.googleapis.com/aistudio-hosting/images/realviz/facade_1.png",
      "parentId": "view_hinta_root",
      "unitIds": ["u_a1", "u_a2", "u_a3"]
    }
  ],
  "units": [
    {
      "id": "u_a1",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A1",
      "status": "for-sale",
      "price": 6250000,
      "size": 132,
      "rooms": 5,
      "fee": 5450,
      "floorLevel": 1,
      "lotSize": 120,
      "ancillaryArea": 12,
      "selections": "Ekparkett, Marbodal kök, vitvaror från Miele.",
      "files": []
    },
    {
      "id": "u_a2",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A2",
      "status": "for-sale",
      "price": 6495000,
      "size": 132,
      "rooms": 5,
      "fee": 5450,
      "floorLevel": 1,
      "lotSize": 115,
      "ancillaryArea": 12,
      "selections": "Premium tillval inkluderat: Braskamin och utökat elsystem.",
      "files": []
    },
    {
      "id": "u_a3",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A3",
      "status": "reserved",
      "price": 6800000,
      "size": 145,
      "rooms": 6,
      "fee": 5890,
      "floorLevel": 1,
      "lotSize": 140,
      "ancillaryArea": 15,
      "selections": "Gavelhus med extra fönsterpartier.",
      "files": []
    },
    {
      "id": "u_a4",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A4",
      "status": "for-sale",
      "price": 7150000,
      "size": 145,
      "rooms": 6,
      "fee": 5890,
      "floorLevel": 1,
      "lotSize": 145,
      "ancillaryArea": 15,
      "selections": "Inredd vind med takterrass.",
      "files": []
    },
    {
      "id": "u_a5",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A5",
      "status": "for-sale",
      "price": 7490000,
      "size": 152,
      "rooms": 6,
      "fee": 6120,
      "floorLevel": 1,
      "lotSize": 160,
      "ancillaryArea": 18,
      "selections": "Största tomten i etappen.",
      "files": []
    },
    {
      "id": "u_a6",
      "projectId": "proj_demo_hinta",
      "name": "Radhus A6",
      "status": "sold",
      "price": 7850000,
      "size": 152,
      "rooms": 6,
      "fee": 6120,
      "floorLevel": 1,
      "lotSize": 165,
      "ancillaryArea": 18,
      "selections": "Lyxutrustat gavelhus.",
      "files": []
    }
  ],
  "hotspots": [
    {
      "id": "hs_hinta_1",
      "viewId": "view_hinta_root",
      "label": "Radhus A1",
      "type": "polygon",
      "coordinates": [[36.7,56.3],[51.5,50.7],[54.6,58.3],[40.1,64.2]],
      "linkedUnitId": "u_a1",
      "status": "for-sale",
      "color": "#1a1a1a",
      "opacity": 0.5
    },
    {
      "id": "hs_hinta_2",
      "viewId": "view_hinta_root",
      "label": "Radhus A2",
      "type": "polygon",
      "coordinates": [[40.1,64.2],[54.6,58.3],[56.7,63.4],[42.4,69.6]],
      "linkedUnitId": "u_a2",
      "status": "for-sale",
      "color": "#1a1a1a",
      "opacity": 0.5
    },
    {
      "id": "hs_hinta_cam",
      "viewId": "view_hinta_root",
      "label": "Gatuperpektiv",
      "type": "camera",
      "coordinates": [[48.5, 42.1]],
      "linkedViewId": "view_hinta_facade",
      "linkedHotspotIds": ["hs_hinta_1", "hs_hinta_2"],
      "status": "for-sale",
      "color": "#FFFFFF",
      "opacity": 1
    }
  ],
  "users": [
    {
      "id": "user_1",
      "name": "Admin Hinta",
      "email": "demo@hinta.se",
      "role": "super_admin",
      "avatarUrl": "https://i.pravatar.cc/150?u=hinta",
      "lastActive": "Just nu",
      "organization": "Studio Hinta"
    }
  ]
};
