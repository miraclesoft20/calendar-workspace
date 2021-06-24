import { Component } from '@angular/core';
import * as moment from 'jalali-moment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'calendar-workspace2';
  date;
  date2;
  minDate = moment().add(-2, 'days');
  maxDate = moment().add(3, 'days');
  invalidDates = [moment()];

  constructor() {
    this.date = moment().locale('fa');
    this.date2 = moment().locale('en');
    console.log(this.date.format());
    console.log(this.date2.format());
  }
}
