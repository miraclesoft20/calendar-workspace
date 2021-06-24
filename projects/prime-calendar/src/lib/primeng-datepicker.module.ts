import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PrimengDatepickerComponent } from './primeng-datepicker.component';
import {SharedModule} from "primeng/api";
import {RippleModule} from "primeng/ripple";

@NgModule({
  declarations: [PrimengDatepickerComponent],
  imports: [CommonModule,ButtonModule,SharedModule,RippleModule],
  exports: [PrimengDatepickerComponent, ButtonModule,SharedModule]
})
export class PrimengDatepickerModule {}
