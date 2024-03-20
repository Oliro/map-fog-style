import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TfMlService {

  private _objectFound = new BehaviorSubject<any[]>([]);
  objectFound$ = this._objectFound.asObservable();

  constructor() { }

  objectIsFound(objectFounded: any) {
    this._objectFound.next(objectFounded);
  }

}
