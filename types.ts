
export interface AppState {
  images: string[];
  enhancedImage: string | null;
  loading: boolean;
  imagePrompt: string;
  error: string | null;
  originalFileNames: string[];
}

// Fixed missing type definition required by components/CampaignViewer.tsx
export interface EmailCampaign {
  subject: string;
  html: string;
}
