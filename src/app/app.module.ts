import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { TfMlComponent } from './tf-ml/tf-ml.component';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
import { BgGpsService } from './services/bg-gps.service';

@NgModule({
  declarations: [
    AppComponent,
    TfMlComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    BackgroundGeolocation, // Adicione BackgroundGeolocation aos provedores
    BgGpsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
