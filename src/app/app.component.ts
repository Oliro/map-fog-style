import { Component, OnInit } from '@angular/core';

import * as L from 'leaflet';
import 'leaflet.heat';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  private map!: L.Map;
  public heatMap!: L.HeatLayer;
  private watchId!: number;

  public coordinatesArray: any[] = [];

  ngOnInit(): void {

    this.createMap();

  }

  createMap() {

    this.map = L.map('map').setView([-23.234419534508827, -45.899720000703645], 18);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 10,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });


    this.heatMap = L.heatLayer([], { radius: 8 });

    tiles.addTo(this.map)
    this.heatMap.addTo(this.map)

  }

  startTracking() {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(this.updateCoordinates.bind(this));
    } else {
      alert("Navegador não suportado")
    }
  }

  stopTracking() {
    navigator.geolocation.clearWatch(this.watchId)
  }

  updateCoordinates(position: any) {
//console.log(position)
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    this.coordinatesArray.push([latitude, longitude, 1]);
    this.heatMap.addLatLng([latitude, longitude, 1]);
    
    // this.coordinatesArray.map((path: any) => {
    //   console.log('atualizando')
    //   this.heatMap.addLatLng(path);
    // });

    console.log(this.coordinatesArray, '-', this.heatMap)

  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }

  }
}
