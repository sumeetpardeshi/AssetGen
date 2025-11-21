export interface AssetRequest {
  productImage: File | null;
  modelImage: File | null; // Optional reference image for the model
  modelDescription: string;
  scenario: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GeneratedAsset {
  imageUrl: string;
  promptUsed: string;
}
