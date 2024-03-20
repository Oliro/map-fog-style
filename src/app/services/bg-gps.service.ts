import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation/ngx';
@Injectable({

  providedIn: 'root'
})
export class BgGpsService {


  constructor(private backgroundGeolocation: BackgroundGeolocation) { }


  startBackgroundGeolocation(): Observable<BackgroundGeolocationResponse> {
    const config: BackgroundGeolocationConfig = {
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      debug: true,
      stopOnTerminate: false,
      startForeground: true
    };

    this.backgroundGeolocation.configure(config);

    return from(this.backgroundGeolocation.start());
  }

}



