// Travel 랜드마크 에셋 데이터
export interface TravelAsset {
  id: string;
  name: string;
  lat: number;
  lon: number;
  captureUrl: string;
}

export const travelAssets: TravelAsset[] = [
  { id: '1', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
  { id: '2', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, captureUrl: 'https://lumalabs.ai/capture/e5b6d44c-43e1-4d1e-b2d5-eca9d334b3fa' },
  { id: '3', name: 'Seoul Tower', lat: 37.5512, lon: 126.9882, captureUrl: 'https://lumalabs.ai/capture/822bac8d-70c6-404e-aaae-f89f46672c67' },
  { id: '4', name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, captureUrl: 'https://lumalabs.ai/capture/9d9e1e45-b089-4e4b-bb7d-ebc2d8cc7f57' },
  { id: '5', name: 'Sydney Opera', lat: -33.8568, lon: 151.2153, captureUrl: 'https://lumalabs.ai/capture/9dfc3d2d-c6c4-40e6-b23c-c44f3f84af99' },
  { id: '6', name: 'Arosa Alps', lat: 46.7785, lon: 9.6764, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '7', name: 'Big Ben', lat: 51.4994, lon: -0.1245, captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a' },
  { id: '8', name: 'Colosseum', lat: 41.8902, lon: 12.4922, captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d' },
  { id: '9', name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54' },
  { id: '10', name: 'Great Wall', lat: 40.4319, lon: 116.5704, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '11', name: 'Machu Picchu', lat: -13.1631, lon: -72.5450, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
  { id: '12', name: 'Christ Redeemer', lat: -22.9519, lon: -43.2105, captureUrl: 'https://lumalabs.ai/capture/e5b6d44c-43e1-4d1e-b2d5-eca9d334b3fa' },
  { id: '13', name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, captureUrl: 'https://lumalabs.ai/capture/822bac8d-70c6-404e-aaae-f89f46672c67' },
  { id: '14', name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, captureUrl: 'https://lumalabs.ai/capture/9d9e1e45-b089-4e4b-bb7d-ebc2d8cc7f57' },
  { id: '15', name: 'Angkor Wat', lat: 13.4125, lon: 103.8670, captureUrl: 'https://lumalabs.ai/capture/9dfc3d2d-c6c4-40e6-b23c-c44f3f84af99' },
  { id: '16', name: 'Petra', lat: 30.3285, lon: 35.4444, captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a' },
  { id: '17', name: 'Sagrada Familia', lat: 41.4036, lon: 2.1744, captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d' },
  { id: '18', name: 'Acropolis', lat: 37.9715, lon: 23.7267, captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54' },
  { id: '19', name: 'Stonehenge', lat: 51.1789, lon: -1.8262, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '20', name: 'Mount Fuji', lat: 35.3606, lon: 138.7274, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
];

// Luma 데이터셋 갤러리 (업로드 화면용)
export const lumaGalleryAssets = [
  {
    id: 'luma-1',
    name: 'Arosa Alps Switzerland',
    thumbnail: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
  },
  {
    id: 'luma-2',
    name: 'MIT WPU Globe',
    thumbnail: 'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
  },
  {
    id: 'luma-3',
    name: 'Dandelion Macro',
    thumbnail: 'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
  },
  {
    id: 'luma-4',
    name: 'Jules Desbois Sculpture',
    thumbnail: 'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
  },
  {
    id: 'luma-5',
    name: 'Nebula Gaussian Splatting',
    thumbnail: 'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
  },
];

