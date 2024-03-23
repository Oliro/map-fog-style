export interface CoordinatesPath {
    latitude: number;
    longitude: number;
    intensity: number;
    marker: MarkerPath
}

export interface MarkerPath {
    icon: string;
    photo: string;
}

