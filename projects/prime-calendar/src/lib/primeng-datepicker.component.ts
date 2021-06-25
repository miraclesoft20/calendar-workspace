import {
  NgModule,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  Renderer2,
  ViewChild,
  ChangeDetectorRef,
  TemplateRef,
  ContentChildren,
  QueryList,
  NgZone,
  ChangeDetectionStrategy,
  ViewEncapsulation
} from '@angular/core';
import {trigger, state, style, transition, animate, AnimationEvent} from '@angular/animations';
import {DomHandler, ConnectedOverlayScrollHandler} from 'primeng/dom';
import {PrimeTemplate, PrimeNGConfig, TranslationKeys} from 'primeng/api';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {Subscription} from 'rxjs';
import * as moment from 'jalali-moment';
import {Moment} from "jalali-moment";

export const CALENDAR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PrimengDatepickerComponent),
  multi: true
};

export interface LocaleSettings {
  locale: string;
  firstDayOfWeek: number;
  dayNames: string[];
  dayNamesShort: string[];
  dayNamesMin: string[];
  monthNames?: string[];
  monthNamesShort?: string[];
  today: string;
  clear: string;
  dateFormat: string;
  weekHeader?: string;
}

@Component({
  selector: 'primeng-datepicker',
  templateUrl: './primeng-datepicker.component.html',
  animations: [
    trigger('overlayAnimation', [
      state('visibleTouchUI', style({
        transform: 'translate(-50%,-50%)',
        opacity: 1
      })),
      transition('void => visible', [
        style({opacity: 0, transform: 'scaleY(0.8)'}),
        animate('{{showTransitionParams}}', style({opacity: 1, transform: '*'}))
      ]),
      transition('visible => void', [
        animate('{{hideTransitionParams}}', style({opacity: 0}))
      ]),
      transition('void => visibleTouchUI', [
        style({opacity: 0, transform: 'translate3d(-50%, -40%, 0) scale(0.9)'}),
        animate('{{showTransitionParams}}')
      ]),
      transition('visibleTouchUI => void', [
        animate(('{{hideTransitionParams}}'),
          style({
            opacity: 0,
            transform: 'translate3d(-50%, -40%, 0) scale(0.9)'
          }))
      ])
    ])
  ],
  host: {
    '[class.p-inputwrapper-filled]': 'filled',
    '[class.p-inputwrapper-focus]': 'focus'
  },
  providers: [CALENDAR_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./calendar.css']
})
export class PrimengDatepickerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  mthis = this;
  @Input() isJalali: boolean = false;
  @Input() style: any;

  @Input() styleClass: string = '';

  @Input() inputStyle: any;

  @Input() inputId?: string;

  @Input() name?: string;

  @Input() inputStyleClass: string = '';

  @Input() placeholder?: string;

  @Input() ariaLabelledBy?: string;

  @Input() disabled: any;

  @Input() dateFormat?: string;

  @Input() multipleSeparator: string = ',';

  @Input() rangeSeparator: string = '-';

  @Input() inline: boolean = false;

  @Input() showOtherMonths: boolean = true;

  @Input() selectOtherMonths: boolean = false;

  @Input() showIcon: boolean = false;

  @Input() icon: string = 'pi pi-calendar';

  @Input() appendTo: any;

  @Input() readonlyInput: boolean = false;

  @Input() shortYearCutoff: any = '+10';

  @Input() monthNavigator: boolean = false;

  @Input() yearNavigator: boolean = false;

  @Input() hourFormat: string = '24';

  @Input() timeOnly: boolean = false;

  @Input() stepHour: number = 1;

  @Input() stepMinute: number = 1;

  @Input() stepSecond: number = 1;

  @Input() showSeconds: boolean = false;

  @Input() required: boolean = false;

  @Input() showOnFocus: boolean = true;

  @Input() showWeek: boolean = false;

  @Input() dataType: string = 'date';

  @Input() selectionMode: string = 'single';

  @Input() maxDateCount: number = 1;

  @Input() showButtonBar: boolean = true;

  @Input() todayButtonStyleClass: string = 'p-button-text';

  @Input() clearButtonStyleClass: string = 'p-button-text';

  @Input() autoZIndex: boolean = true;

  @Input() baseZIndex: number = 0;

  @Input() panelStyleClass: string = '';

  @Input() panelStyle: any;

  @Input() keepInvalid: boolean = false;

  @Input() hideOnDateTimeSelect: boolean = true;

  @Input() numberOfMonths: number = 1;

  @Input() view: string = 'date';

  @Input() touchUI: boolean = false;

  @Input() timeSeparator: string = ":";

  @Input() focusTrap: boolean = true;

  @Input() firstDayOfWeek: number = 0;

  @Input() showTransitionOptions: string = '.12s cubic-bezier(0, 0, 0.2, 1)';

  @Input() hideTransitionOptions: string = '.1s linear';

  @Output() onFocus: EventEmitter<any> = new EventEmitter();

  @Output() onBlur: EventEmitter<any> = new EventEmitter();

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  @Output() onInput: EventEmitter<any> = new EventEmitter();

  @Output() onTodayClick: EventEmitter<any> = new EventEmitter();

  @Output() onClearClick: EventEmitter<any> = new EventEmitter();

  @Output() onMonthChange: EventEmitter<any> = new EventEmitter();

  @Output() onYearChange: EventEmitter<any> = new EventEmitter();

  @Output() onClickOutside: EventEmitter<any> = new EventEmitter();

  @Output() onShow: EventEmitter<any> = new EventEmitter();

  @ContentChildren(PrimeTemplate) templates?: QueryList<any>;

  @Input() tabindex: number = 0;

  @ViewChild('container', {static: false}) containerViewChild?: ElementRef;

  @ViewChild('inputfield', {static: false}) inputfieldViewChild?: ElementRef;

  @ViewChild('contentWrapper', {static: false}) set content(content: ElementRef) {
    this.contentViewChild = content;

    if (this.contentViewChild) {
      if (this.isMonthNavigate) {
        Promise.resolve(null).then(() => this.updateFocus());
        this.isMonthNavigate = false;
      } else {
        this.initFocusableCell();
      }
    }
  };

  contentViewChild?: ElementRef;

  value: any;

  dates?: any[];

  months?: any[];

  monthPickerValues?: any[];

  weekDays?: string[];

  currentMonth: number = 0;

  currentYear: number = 0;

  currentHour: number = 0;

  currentMinute: number = 0;

  currentSecond: number = 0;

  pm: boolean = false;

  mask?: HTMLDivElement | null;

  maskClickListener?: Function;

  overlay: HTMLDivElement | null = null;

  overlayVisible?: boolean;

  onModelChange: Function = () => {
  };

  onModelTouched: Function = () => {
  };

  calendarElement: any;

  timePickerTimer: any;

  documentClickListener: any;

  ticksTo1970: number;

  yearOptions?: number[];

  focus?: boolean;

  isKeydown?: boolean;

  filled?: boolean | null = false;

  inputFieldValue?: any;

  _minDate?: Moment;

  _maxDate?: Moment;

  _showTime: boolean = false;

  _yearRange: string = '';

  preventDocumentListener?: boolean;

  dateTemplate: TemplateRef<any> | null = null;

  headerTemplate: TemplateRef<any> | null = null;

  footerTemplate: TemplateRef<any> | null = null;

  disabledDateTemplate: TemplateRef<any> | null = null;

  _disabledDates: Array<Moment> = [];

  _disabledDays: Array<number> = [];

  selectElement?: any;

  todayElement: any;

  focusElement: any;

  scrollHandler: any;

  documentResizeListener: any;

  navigationState: any = null;

  isMonthNavigate?: boolean;

  initialized?: boolean;

  translationSubscription?: Subscription;

  _locale: LocaleSettings = {
    locale: 'fa',
    firstDayOfWeek: 0,
    dayNames: [' شنبه', 'یک شنبه', 'دو شنبه ', 'سه شنبه', 'چهار شنبه', ' پنج شنبه', ' جمعه'],
    dayNamesShort: ['شن', 'یک', 'دو ', 'س', 'چ', ' پ', ' ج'],
    dayNamesMin: ['  شنبه', 'یک شنبه', 'دو شنبه ', 'سه شنبه', 'چهار شنبه', ' پنج شنبه', ' جمعه'],
    monthNames: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    monthNamesShort: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    today: 'امروز',
    clear: 'پاک کردن',
    dateFormat: 'YYYY/MM/DD'
  };


  @Input() get defaultDate(): Moment {
    return this._defaultDate;
  };

  set defaultDate(defaultDate: Moment) {
    this._defaultDate = defaultDate;

    if (this.initialized) {
      const date = defaultDate || moment();
      if (this.isJalali) {
        this.currentMonth = date.jMonth();
        this.currentYear = date.jYear();
      } else {
        this.currentMonth = date.month();
        this.currentYear = date.year();
      }

      this.initTime(date);
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  _defaultDate: Moment = moment();

  @Input() get minDate(): Moment | undefined {
    return this._minDate;
  }

  set minDate(date: Moment | undefined) {
    this._minDate = date;

    if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  @Input() get maxDate(): Moment | undefined {
    return this._maxDate;
  }

  set maxDate(date: Moment | undefined) {
    this._maxDate = date;

    if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  @Input() get disabledDates(): Moment[] {
    return this._disabledDates;
  }

  set disabledDates(disabledDates: Moment[]) {
    this._disabledDates = disabledDates;
    if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {

      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  @Input() get disabledDays(): number[] {
    return this._disabledDays;
  }

  set disabledDays(disabledDays: number[]) {
    this._disabledDays = disabledDays;

    if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  @Input() get yearRange(): string {
    return this._yearRange;
  }

  set yearRange(yearRange: string) {
    this._yearRange = yearRange;

    if (yearRange) {
      const years = yearRange.split(':');
      const yearStart = parseInt(years[0]);
      const yearEnd = parseInt(years[1]);

      this.populateYearOptions(yearStart, yearEnd);
    }
  }

  @Input() get showTime(): boolean {
    return this._showTime;
  }

  set showTime(showTime: boolean) {
    this._showTime = showTime;

    if (this.currentHour === undefined) {
      this.initTime(this.value || moment());
    }
    this.updateInputfield();
  }

  get locale() {
    return this._locale;
  }

  @Input()
  set locale(newLocale: LocaleSettings) {
    this.locale = newLocale;
    //   console.warn("Locale property has no effect, use new i18n API instead.");
  }

  constructor(public el: ElementRef, public renderer: Renderer2, public cd: ChangeDetectorRef, private zone: NgZone, private config: PrimeNGConfig) {
    this.ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);
  }

  ngOnInit() {
    const date = this.defaultDate || moment();

    if (this.isJalali) {
      this._locale = {
        locale: 'fa',
        firstDayOfWeek: 0,
        dayNames: ['شنبه', 'یکشنبه', 'دوشنبه ', 'سه شنبه', 'چهارشنبه', 'پنج شنبه', 'جمعه'],
        dayNamesShort: ['شنبه', 'یکشنبه', 'دوشنبه ', 'سه شنبه', 'چهارشنبه', 'پنج شنبه', 'جمعه'],
        dayNamesMin: ['شنبه', 'یکشنبه', 'دوشنبه ', 'سه شنبه', 'چهارشنبه', 'پنج شنبه', 'جمعه'],
        monthNames: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
        monthNamesShort: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
        today: 'امروز',
        clear: 'پاک کردن',
        dateFormat: 'YYYY/MM/DD',
      };

      this.currentMonth = date.jMonth();
      this.currentYear = date.jYear();
    } else {
      this._locale = {
        locale: 'en',
        firstDayOfWeek: 0,
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        clear: 'Clear',
        dateFormat: 'YYYY/MM/DD'
      };
      this.currentMonth = date.month();
      this.currentYear = date.year();
    }

    if (this.view === 'date') {
      this.createWeekDays();
      this.initTime(date);
      this.createMonths(this.currentMonth, this.currentYear);
      this.ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);
    } else if (this.view === 'month') {
      this.createMonthPickerValues();
    }

    this.initialized = true;

  }

  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case 'date':
          this.dateTemplate = item.template;
          break;

        case 'disabledDate':
          this.disabledDateTemplate = item.template;
          break;

        case 'header':
          this.headerTemplate = item.template;
          break;

        case 'footer':
          this.footerTemplate = item.template;
          break;

        default:
          this.dateTemplate = item.template;
          break;
      }
    });
  }


  populateYearOptions(start: number, end: number) {
    this.yearOptions = [];

    for (let i = start; i <= end; i++) {
      this.yearOptions.push(i);
    }
  }

  createWeekDays() {
    this.weekDays = [];

    let dayIndex = this.locale.firstDayOfWeek;
    if (this.locale.dayNamesMin) {
      for (let i = 0; i < 7; i++) {
        this.weekDays.push(this.locale.dayNamesMin[dayIndex]);
        dayIndex = (dayIndex == 6) ? 0 : ++dayIndex;
      }
    }
  }

  createMonthPickerValues() {
    this.monthPickerValues = [];
    if (this.locale.monthNamesShort) {
      for (let i = 0; i <= 11; i++) {
        this.monthPickerValues.push(this.locale.monthNamesShort[i]);
      }
    }

  }

  createMonths(month: number, year: number) {
    this.months = this.months = [];
    for (let i = 0; i < this.numberOfMonths; i++) {
      let m = month + i;
      let y = year;
      if (m > 11) {
        m = m % 11 - 1;
        y = year + 1;
      }

      this.months.push(this.createMonth(m, y));
    }
  }

  getWeekNumber(date: Moment) {
    let checkDate = date.clone().toDate();
    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
    let time = checkDate.getTime();
    checkDate.setMonth(0);
    checkDate.setDate(1);
    return Math.floor(Math.round((time - checkDate.getTime()) / 86400000) / 7) + 1;
  }

  createMonth(month: number, year: number) {
    let dates = [];
    let firstDay = this.getFirstDayOfMonthIndex(month, year);
    let daysLength = this.getDaysCountInMonth(month, year);
    let prevMonthDaysLength = this.getDaysCountInPrevMonth(month, year);
    let dayNo = 1;
    let today = moment();
    let weekNumbers = [];
    let monthRows = Math.ceil((daysLength + firstDay) / 7);

    for (let i = 0; i < monthRows; i++) {
      let week = [];

      if (i == 0) {
        for (let j = (prevMonthDaysLength - firstDay + 1); j <= prevMonthDaysLength; j++) {
          let prev = this.getPreviousMonthAndYear(month, year);
          week.push({
            day: j,
            month: prev.month,
            year: prev.year,
            otherMonth: true,
            today: this.isToday(today, j, prev.month, prev.year),
            selectable: this.isSelectable(j, prev.month, prev.year, true)
          });
        }

        let remainingDaysLength = 7 - week.length;
        for (let j = 0; j < remainingDaysLength; j++) {
          week.push({
            day: dayNo, month: month, year: year, today: this.isToday(today, dayNo, month, year),
            selectable: this.isSelectable(dayNo, month, year, false)
          });
          dayNo++;
        }
      } else {
        for (let j = 0; j < 7; j++) {
          if (dayNo > daysLength) {
            let next = this.getNextMonthAndYear(month, year);
            week.push({
              day: dayNo - daysLength, month: next.month, year: next.year, otherMonth: true,
              today: this.isToday(today, dayNo - daysLength, next.month, next.year),
              selectable: this.isSelectable((dayNo - daysLength), next.month, next.year, true)
            });
          } else {
            week.push({
              day: dayNo, month: month, year: year, today: this.isToday(today, dayNo, month, year),
              selectable: this.isSelectable(dayNo, month, year, false)
            });
          }

          dayNo++;
        }
      }

      if (this.showWeek) {
        weekNumbers.push(this.getWeekNumber(moment().year(week[0].year).month(week[0].month).date(week[0].day)));
      }
      dates.push(week);
    }

    return {
      month: month,
      year: year,
      dates: dates,
      weekNumbers: weekNumbers
    };
  }

  initTime(date: Moment) {
    this.pm = date.get("hour") > 11;

    if (this.showTime) {
      this.currentMinute = date.minute();
      this.currentSecond = date.second();
      this.setCurrentHourPM(date.hour());
    } else if (this.timeOnly) {
      this.currentMinute = 0;
      this.currentHour = 0;
      this.currentSecond = 0;
    }
  }

  navBackward(event: any) {
    event.stopPropagation();

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.isMonthNavigate = true;

    if (this.view === 'month') {
      this.decrementYear();
      setTimeout(() => {
        this.updateFocus();
      }, 1);
    } else {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.decrementYear();
      } else {
        this.currentMonth--;
      }

      this.onMonthChange.emit({month: this.currentMonth + 1, year: this.currentYear});
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  navForward(event: any) {
    event.stopPropagation();

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.isMonthNavigate = true;

    if (this.view === 'month') {
      this.incrementYear();
      setTimeout(() => {
        this.updateFocus();
      }, 1);
    } else {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.incrementYear();
      } else {
        this.currentMonth++;
      }

      this.onMonthChange.emit({month: this.currentMonth + 1, year: this.currentYear});
      this.createMonths(this.currentMonth, this.currentYear);
    }
  }

  decrementYear() {
    if (this.currentYear) {
      this.currentYear--;

      if (this.yearNavigator && this.yearOptions && this.currentYear < this.yearOptions[0]) {
        let difference = this.yearOptions[this.yearOptions.length - 1] - this.yearOptions[0];
        this.populateYearOptions(this.yearOptions[0] - difference, this.yearOptions[this.yearOptions.length - 1] - difference);
      }
    }
  }

  incrementYear() {
    if (this.currentYear) {
      this.currentYear++;

      if (this.yearNavigator && this.yearOptions && this.currentYear > this.yearOptions[this.yearOptions.length - 1]) {
        let difference = this.yearOptions[this.yearOptions.length - 1] - this.yearOptions[0];
        this.populateYearOptions(this.yearOptions[0] + difference, this.yearOptions[this.yearOptions.length - 1] + difference);
      }
    }
  }

  onDateSelect(event: any, dateMeta: any) {
    if (this.disabled || !dateMeta.selectable) {
      event.preventDefault();
      return;
    }

    if (this.isMultipleSelection() && this.isSelected(dateMeta)) {
      this.value = this.value.filter((date: Moment, i: number) => {
        return !this.isDateEquals(date, dateMeta);
      });
      if (this.value.length === 0) {
        this.value = null;
      }
      this.updateModel(this.value);
    } else {
      if (this.shouldSelectDate(dateMeta)) {
        this.selectDate(dateMeta);
      }
    }

    if (this.isSingleSelection() && this.hideOnDateTimeSelect) {
      setTimeout(() => {
        event.preventDefault();
        this.hideOverlay();

        if (this.mask) {
          this.disableModality();
        }

        this.cd.markForCheck();
      }, 150);
    }

    this.updateInputfield();
    event.preventDefault();
  }

  shouldSelectDate(dateMeta: any) {
    if (this.isMultipleSelection())
      return this.maxDateCount != null ? this.maxDateCount > (this.value ? this.value.length : 0) : true;
    else
      return true;
  }

  onMonthSelect(event: any, index: number) {
    if (!DomHandler.hasClass(event.target, 'p-disabled')) {
      this.onDateSelect(event, {year: this.currentYear, month: index, day: 1, selectable: true});
    }
  }

  updateInputfield() {
    let formattedValue = '';

    if (this.value) {
      if (this.isSingleSelection()) {
        formattedValue = this.formatDateTime(this.value);
      } else if (this.isMultipleSelection()) {
        for (let i = 0; i < this.value.length; i++) {
          let dateAsString = this.formatDateTime(this.value[i]);
          formattedValue += dateAsString;
          if (i !== (this.value.length - 1)) {
            formattedValue += this.multipleSeparator + ' ';
          }
        }
      } else if (this.isRangeSelection()) {
        if (this.value && this.value.length) {
          let startDate = this.value[0];
          let endDate = this.value[1];

          formattedValue = this.formatDateTime(startDate);
          if (endDate) {
            formattedValue += ' ' + this.rangeSeparator + ' ' + this.formatDateTime(endDate);
          }
        }
      }
    }

    this.inputFieldValue = formattedValue;
    this.updateFilledState();
    if (this.inputfieldViewChild && this.inputfieldViewChild.nativeElement) {
      this.inputfieldViewChild.nativeElement.value = this.inputFieldValue;
    }
  }

  formatDateTime(date: Moment) {
    let formattedValue = '';
    if (date) {
      if (this.timeOnly) {
        formattedValue = this.formatTime(date);
      } else {
        formattedValue = this.formatDate(date, this.getDateFormat());
        if (this.showTime) {
          formattedValue += ' ' + this.formatTime(date);
        }
      }
    }

    return formattedValue;
  }

  setCurrentHourPM(hours: number) {
    if (this.hourFormat == '12') {
      this.pm = hours > 11;
      if (hours >= 12) {
        this.currentHour = (hours == 12) ? 12 : hours - 12;
      } else {
        this.currentHour = (hours == 0) ? 12 : hours;
      }
    } else {
      this.currentHour = hours;
    }
  }

  selectDate(dateMeta: any) {
    let date;
    if (this.isJalali) {
      date = moment(dateMeta.year + '-' + (dateMeta.month + 1) + '-' + dateMeta.day, 'jYYYY-jM-jD').locale('fa');
    } else {
      date = moment().year(dateMeta.year).month(dateMeta.month).date(dateMeta.day);
    }


    if (this.showTime) {
      if (this.hourFormat == '12') {
        if (this.currentHour === 12)
          date.hour(this.pm ? 12 : 0);
        else
          date.hour(this.pm ? this.currentHour + 12 : this.currentHour);
      } else {
        date.hour(this.currentHour);
      }

      date.minute(this.currentMinute);
      date.second(this.currentSecond);
    }

    if (this.minDate && this.minDate > date) {
      date = this.minDate;
      this.setCurrentHourPM(date.hour());
      this.currentMinute = date.minute();
      this.currentSecond = date.second();
    }

    if (this.maxDate && this.maxDate < date) {
      date = this.maxDate;
      this.setCurrentHourPM(date.hour());
      this.currentMinute = date.minute();
      this.currentSecond = date.second();
    }

    if (this.isSingleSelection()) {
      this.updateModel(date);
    } else if (this.isMultipleSelection()) {
      this.updateModel(this.value ? [...this.value, date] : [date]);
    } else if (this.isRangeSelection()) {
      if (this.value && this.value.length) {
        let startDate = this.value[0];
        let endDate = this.value[1];

        if (!endDate && date.valueOf() >= startDate.valueOf()) {
          endDate = date;
        } else {
          startDate = date;
          endDate = null;
        }

        this.updateModel([startDate, endDate]);
      } else {
        this.updateModel([date, null]);
      }
    }
    this.onSelect.emit(date);
  }

  updateModel(value: any) {
    this.value = value;

    if (this.dataType == 'date') {
      this.onModelChange(this.value);
    } else if (this.dataType == 'string') {
      if (this.isSingleSelection()) {
        this.onModelChange(this.formatDateTime(this.value));
      } else {
        let stringArrValue = null;
        if (this.value) {
          stringArrValue = this.value.map((date: any) => this.formatDateTime(date));
        }
        this.onModelChange(stringArrValue);
      }
    }
  }

  getFirstDayOfMonthIndex(month: number, year: number) {
    const day = moment();
    if (this.isJalali) {
      day.jDate(1);
      day.jMonth(month);
      day.jYear(year);
      const dayIndex = day.jDay() + this.getSundayIndex();
      return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    } else {
      day.date(1);
      day.month(month);
      day.year(year);
      const dayIndex = day.day() + this.getSundayIndex();
      return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }
  }

  getDaysCountInMonth(month: number, year: number) {
    if (this.isJalali) {
      const newDate = moment().jYear(year).jMonth(month).jDate(32);

      const temp = this.daylightSavingAdjust(newDate).jDate();

      return 32 - temp;
    } else {
      const newDate = moment().year(year).month(month).date(32);

      const temp = this.daylightSavingAdjust(newDate).date();

      return 32 - temp;
    }
  }

  getDaysCountInPrevMonth(month: number, year: number) {
    let prev = this.getPreviousMonthAndYear(month, year);
    return this.getDaysCountInMonth(prev.month, prev.year);
  }

  getPreviousMonthAndYear(month: number, year: number) {
    let m, y;

    if (month === 0) {
      m = 11;
      y = year - 1;
    } else {
      m = month - 1;
      y = year;
    }

    return {'month': m, 'year': y};
  }

  getNextMonthAndYear(month: number, year: number) {
    let m, y;

    if (month === 11) {
      m = 0;
      y = year + 1;
    } else {
      m = month + 1;
      y = year;
    }

    return {'month': m, 'year': y};
  }

  getSundayIndex() {
    return this.firstDayOfWeek > 0 ? 7 - this.firstDayOfWeek : 0;
  }

  isSelected(dateMeta: any): boolean {
    if (this.value) {
      if (this.isSingleSelection()) {
        return this.isDateEquals(this.value, dateMeta);
      } else if (this.isMultipleSelection()) {
        let selected = false;
        for (let date of this.value) {
          selected = this.isDateEquals(date, dateMeta);
          if (selected) {
            break;
          }
        }

        return selected;
      } else if (this.isRangeSelection()) {
        if (this.value[1])
          return this.isDateEquals(this.value[0], dateMeta) || this.isDateEquals(this.value[1], dateMeta) || this.isDateBetween(this.value[0], this.value[1], dateMeta);
        else
          return this.isDateEquals(this.value[0], dateMeta)
      }
    }
    return false;
  }

  isMonthSelected(month: number): boolean {
    let day = this.value ? (Array.isArray(this.value) ? this.value[0].getDate() : this.value.getDate()) : 1;
    return this.isSelected({year: this.currentYear, month: month, day: day, selectable: true});
  }

  isDateEquals(value: Moment, dateMeta: any) {
    if (value)
      return value.date() === dateMeta.day && value.month() === dateMeta.month && value.year() === dateMeta.year;
    else
      return false;
  }

  isDateBetween(start: Moment, end: Moment, dateMeta: any) {
    const between = false;
    if (start && end) {
      const date: moment.Moment = moment([dateMeta.year, dateMeta.month, dateMeta.day]);
      return start.unix() <= date.unix() && end.unix() >= date.unix();
    }

    return between;
  }

  isSingleSelection(): boolean {
    return this.selectionMode === 'single';
  }

  isRangeSelection(): boolean {
    return this.selectionMode === 'range';
  }

  isMultipleSelection(): boolean {
    return this.selectionMode === 'multiple';
  }

  isToday(today: Moment, day: number, month: number, year: number): boolean {
    if (this.isJalali) {
      return today.jDate() === day && today.jMonth() === month && today.jYear() === year;
    } else {
      return today.date() === day && today.month() === month && today.year() === year;
    }
  }

  /**
   *
   * @param day
   * @param month
   * @param year
   * @param otherMonth
   */
  isSelectable(day: number, month: number, year: number, otherMonth: boolean): boolean {
    let validMin = true;
    let validMax = true;
    let validDate = true;
    let validDay = true;

    if (otherMonth && !this.selectOtherMonths) {
      return false;
    }

    if (this.minDate) {
      if (this.isJalali) {
        if (this.minDate.jYear() > year) {
          validMin = false;
        } else if (this.minDate.jYear() === year) {
          if (this.minDate.jMonth() > month) {
            validMin = false;
          } else if (this.minDate.jMonth() === month) {
            if (this.minDate.jDate() > day) {
              validMin = false;
            }
          }
        }
      } else {
        if (this.minDate.year() > year) {
          validMin = false;
        } else if (this.minDate.year() === year) {
          if (this.minDate.month() > month) {
            validMin = false;
          } else if (this.minDate.month() === month) {
            if (this.minDate.date() > day) {
              validMin = false;
            }
          }
        }
      }

    }

    if (this.maxDate) {
      if (this.isJalali) {
        if (this.maxDate.jYear() < year) {
          validMax = false;
        } else if (this.maxDate.jYear() === year) {
          if (this.maxDate.jMonth() < month) {
            validMax = false;
          } else if (this.maxDate.jMonth() === month) {
            if (this.maxDate.jDate() < day) {
              validMax = false;
            }
          }
        }
      } else {
        if (this.isJalali) {
          if (this.maxDate.year() < year) {
            validMax = false;
          } else if (this.maxDate.year() === year) {
            if (this.maxDate.month() < month) {
              validMax = false;
            } else if (this.maxDate.month() === month) {
              if (this.maxDate.date() < day) {
                validMax = false;
              }
            }
          }
        }
      }

    }

    if (this.disabledDates) {
      validDate = !this.isDateDisabled(day, month, year);
    }

    if (this.disabledDays) {
      validDay = !this.isDayDisabled(day, month, year);
    }

    return validMin && validMax && validDate && validDay;
  }

  /**
   *
   * @param day
   * @param month
   * @param year
   */
  isDateDisabled(day: number, month: number, year: number): boolean {
    if (this.disabledDates) {
      for (const disabledDate of this.disabledDates) {
        if (this.isJalali) {
          if (disabledDate.jYear() === year && disabledDate.jMonth() === month && disabledDate.jDate() === day) {
            return true;
          }
        } else {
          if (disabledDate.year() === year && disabledDate.month() === month && disabledDate.date() === day) {
            return true;
          }
        }

      }
    }

    return false;
  }

  /**
   *
   * @param day
   * @param month
   * @param year
   */
  isDayDisabled(day: number, month: number, year: number): boolean {
    if (this.disabledDays) {
      const weekday = moment([year, month, day]);
      if (this.isJalali) {
        const weekdayNumber = weekday.jDay();
        return this.disabledDays.indexOf(weekdayNumber) !== -1;
      } else {
        const weekdayNumber = weekday.day();
        return this.disabledDays.indexOf(weekdayNumber) !== -1;
      }
    }
    return false;
  }

  onInputFocus(event: Event) {
    this.focus = true;
    if (this.showOnFocus) {
      this.showOverlay();
    }
    this.onFocus.emit(event);
  }

  onInputClick() {
    if (this.overlay && this.autoZIndex) {
      this.overlay.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
    }

    if (this.showOnFocus && !this.overlayVisible) {
      this.showOverlay();
    }
  }

  onInputBlur(event: Event) {
    this.focus = false;
    this.onBlur.emit(event);
    if (!this.keepInvalid) {
      this.updateInputfield();
    }
    this.onModelTouched();
  }

  onButtonClick(event: Event, inputfield: any) {
    if (!this.overlayVisible) {
      inputfield.focus();
      this.showOverlay();
    } else {
      this.hideOverlay();
    }
  }

  onPrevButtonClick(event: Event) {
    this.navigationState = {backward: true, button: true};
    this.navBackward(event);
  }

  onNextButtonClick(event: Event) {
    this.navigationState = {backward: false, button: true};
    this.navForward(event);
  }

  onContainerButtonKeydown(event: any) {
    switch (event.which) {
      //tab
      case 9:
        if (!this.inline) {
          this.trapFocus(event);
        }
        break;

      //escape
      case 27:
        this.overlayVisible = false;
        event.preventDefault();
        break;

      default:
        //Noop
        break;
    }
  }

  onInputKeydown(event: any) {
    this.isKeydown = true;
    if (event.keyCode === 40 && this.contentViewChild) {
      this.trapFocus(event);
    } else if (event.keyCode === 27) {
      if (this.overlayVisible) {
        this.overlayVisible = false;
        event.preventDefault();
      }
    } else if (event.keyCode === 13) {
      if (this.overlayVisible) {
        this.overlayVisible = false;
        event.preventDefault();
      }
    } else if (event.keyCode === 9 && this.contentViewChild) {
      DomHandler.getFocusableElements(this.contentViewChild.nativeElement).forEach(el => el.tabIndex = '-1');
      if (this.overlayVisible) {
        this.overlayVisible = false;
      }
    }
  }

  onDateCellKeydown(event: any, date: any, groupIndex: any) {
    const cellContent = event.currentTarget;
    const cell = cellContent.parentElement;

    switch (event.which) {
      //down arrow
      case 40: {
        cellContent.tabIndex = '-1';
        let cellIndex = DomHandler.index(cell);
        let nextRow = cell.parentElement.nextElementSibling;
        if (nextRow) {
          let focusCell = nextRow.children[cellIndex].children[0];
          if (DomHandler.hasClass(focusCell, 'p-disabled')) {
            this.navigationState = {backward: false};
            this.navForward(event);
          } else {
            nextRow.children[cellIndex].children[0].tabIndex = '0';
            nextRow.children[cellIndex].children[0].focus();
          }
        } else {
          this.navigationState = {backward: false};
          this.navForward(event);
        }
        event.preventDefault();
        break;
      }

      //up arrow
      case 38: {
        cellContent.tabIndex = '-1';
        let cellIndex = DomHandler.index(cell);
        let prevRow = cell.parentElement.previousElementSibling;
        if (prevRow) {
          let focusCell = prevRow.children[cellIndex].children[0];
          if (DomHandler.hasClass(focusCell, 'p-disabled')) {
            this.navigationState = {backward: true};
            this.navBackward(event);
          } else {
            focusCell.tabIndex = '0';
            focusCell.focus();
          }
        } else {
          this.navigationState = {backward: true};
          this.navBackward(event);
        }
        event.preventDefault();
        break;
      }

      //left arrow
      case 37: {
        cellContent.tabIndex = '-1';
        let prevCell = cell.previousElementSibling;
        if (prevCell) {
          let focusCell = prevCell.children[0];
          if (DomHandler.hasClass(focusCell, 'p-disabled') || DomHandler.hasClass(focusCell.parentElement, 'p-datepicker-weeknumber')) {
            this.navigateToMonth(true, groupIndex);
          } else {
            focusCell.tabIndex = '0';
            focusCell.focus();
          }
        } else {
          this.navigateToMonth(true, groupIndex);
        }
        event.preventDefault();
        break;
      }

      //right arrow
      case 39: {
        cellContent.tabIndex = '-1';
        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          let focusCell = nextCell.children[0];
          if (DomHandler.hasClass(focusCell, 'p-disabled')) {
            this.navigateToMonth(false, groupIndex);
          } else {
            focusCell.tabIndex = '0';
            focusCell.focus();
          }
        } else {
          this.navigateToMonth(false, groupIndex);
        }
        event.preventDefault();
        break;
      }

      //enter
      case 13: {
        this.onDateSelect(event, date);
        event.preventDefault();
        break;
      }

      //escape
      case 27: {
        this.overlayVisible = false;
        event.preventDefault();
        break;
      }

      //tab
      case 9: {
        if (!this.inline) {
          this.trapFocus(event);
        }
        break;
      }

      default:
        //no op
        break;
    }
  }

  onMonthCellKeydown(event: any, index: number) {
    const cell = event.currentTarget;
    switch (event.which) {
      //arrows
      case 38:
      case 40: {
        cell.tabIndex = '-1';
        var cells = cell.parentElement.children;
        var cellIndex = DomHandler.index(cell);
        let nextCell = cells[event.which === 40 ? cellIndex + 3 : cellIndex - 3];
        if (nextCell) {
          nextCell.tabIndex = '0';
          nextCell.focus();
        }
        event.preventDefault();
        break;
      }

      //left arrow
      case 37: {
        cell.tabIndex = '-1';
        let prevCell = cell.previousElementSibling;
        if (prevCell) {
          prevCell.tabIndex = '0';
          prevCell.focus();
        }
        event.preventDefault();
        break;
      }

      //right arrow
      case 39: {
        cell.tabIndex = '-1';
        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          nextCell.tabIndex = '0';
          nextCell.focus();
        }
        event.preventDefault();
        break;
      }

      //enter
      case 13: {
        this.onMonthSelect(event, index);
        event.preventDefault();
        break;
      }

      //escape
      case 27: {
        this.overlayVisible = false;
        event.preventDefault();
        break;
      }

      //tab
      case 9: {
        if (!this.inline) {
          this.trapFocus(event);
        }
        break;
      }

      default:
        //no op
        break;
    }
  }

  navigateToMonth(prev: boolean, groupIndex: number) {
    if (prev) {
      if (this.numberOfMonths === 1 || (groupIndex === 0)) {
        this.navigationState = {backward: true};
        this.navBackward(event);
      } else {
        let prevMonthContainer = this.contentViewChild?.nativeElement.children[groupIndex - 1];
        let cells = DomHandler.find(prevMonthContainer, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
        let focusCell = cells[cells.length - 1];
        focusCell.tabIndex = '0';
        focusCell.focus();
      }
    } else {
      if (this.numberOfMonths === 1 || (groupIndex === this.numberOfMonths - 1)) {
        this.navigationState = {backward: false};
        this.navForward(event);
      } else {
        let nextMonthContainer = this.contentViewChild?.nativeElement.children[groupIndex + 1];
        let focusCell = DomHandler.findSingle(nextMonthContainer, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
        focusCell.tabIndex = '0';
        focusCell.focus();
      }
    }
  }

  updateFocus() {
    let cell;
    if (this.navigationState) {
      if (this.navigationState.button) {
        this.initFocusableCell();

        if (this.navigationState.backward)
          DomHandler.findSingle(this.contentViewChild?.nativeElement, '.p-datepicker-prev').focus();
        else
          DomHandler.findSingle(this.contentViewChild?.nativeElement, '.p-datepicker-next').focus();
      } else {
        if (this.navigationState.backward) {
          let cells = DomHandler.find(this.contentViewChild?.nativeElement, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
          cell = cells[cells.length - 1];
        } else {
          cell = DomHandler.findSingle(this.contentViewChild?.nativeElement, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
        }

        if (cell) {
          cell.tabIndex = '0';
          cell.focus();
        }
      }

      this.navigationState = null;
    } else {
      this.initFocusableCell();
    }
  }

  initFocusableCell() {
    let cell;
    if (this.view === 'month') {
      let cells = DomHandler.find(this.contentViewChild?.nativeElement, '.p-monthpicker .p-monthpicker-month:not(.p-disabled)');
      let selectedCell = DomHandler.findSingle(this.contentViewChild?.nativeElement, '.p-monthpicker .p-monthpicker-month.p-highlight');
      cells.forEach(cell => cell.tabIndex = -1);
      cell = selectedCell || cells[0];

      if (cells.length === 0) {
        let disabledCells = DomHandler.find(this.contentViewChild?.nativeElement, '.p-monthpicker .p-monthpicker-month.p-disabled[tabindex = "0"]');
        disabledCells.forEach(cell => cell.tabIndex = -1);
      }
    } else {
      cell = DomHandler.findSingle(this.contentViewChild?.nativeElement, 'span.p-highlight');
      if (!cell) {
        let todayCell = DomHandler.findSingle(this.contentViewChild?.nativeElement, 'td.p-datepicker-today span:not(.p-disabled):not(.p-ink)');
        if (todayCell)
          cell = todayCell;
        else
          cell = DomHandler.findSingle(this.contentViewChild?.nativeElement, '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)');
      }
    }

    if (cell) {
      cell.tabIndex = '0';
    }
  }

  trapFocus(event: any) {
    let focusableElements = DomHandler.getFocusableElements(this.contentViewChild?.nativeElement);

    if (focusableElements && focusableElements.length > 0) {
      if (!focusableElements[0].ownerDocument.activeElement) {
        focusableElements[0].focus();
      } else {
        let focusedIndex = focusableElements.indexOf(focusableElements[0].ownerDocument.activeElement);

        if (event.shiftKey) {
          if (focusedIndex == -1 || focusedIndex === 0) {
            if (this.focusTrap) {
              focusableElements[focusableElements.length - 1].focus();
            } else {
              if (focusedIndex === -1)
                return this.hideOverlay();
              else if (focusedIndex === 0)
                return;
            }
          } else {
            focusableElements[focusedIndex - 1].focus();
          }
        } else {
          if (focusedIndex == -1 || focusedIndex === (focusableElements.length - 1)) {
            if (!this.focusTrap && focusedIndex != -1)
              return this.hideOverlay();
            else
              focusableElements[0].focus();
          } else {
            focusableElements[focusedIndex + 1].focus();
          }
        }
      }
    }

    event.preventDefault();
  }

  onMonthDropdownChange(event: any) {
    let m = event.target.value
    this.currentMonth = parseInt(m);
    this.onMonthChange.emit({month: this.currentMonth + 1, year: this.currentYear});
    this.createMonths(this.currentMonth, this.currentYear);
  }

  onYearDropdownChange(event: any) {
    let y = event.target.value
    this.currentYear = parseInt(y);
    this.onYearChange.emit({month: this.currentMonth + 1, year: this.currentYear});
    this.createMonths(this.currentMonth, this.currentYear);
  }

  convertTo24Hour(hours: number, pm: boolean): number {
    if (this.hourFormat === '12') {
      if (hours === 12) {
        return (pm ? 12 : 0);
      } else {
        return (pm ? hours + 12 : hours);
      }
    }
    return hours;
  }

  validateTime(hour: number, minute: number, second: number, pm: boolean) {
    let value = this.value;
    const convertedHour = this.convertTo24Hour(hour, pm);
    if (this.isRangeSelection()) {
      value = this.value[1] || this.value[0];
    }
    if (this.isMultipleSelection()) {
      value = this.value[this.value.length - 1];
    }
    const valueDateString = value ? value.toString() : null;
    if (this.minDate && valueDateString && this.minDate.toDate().toDateString() === valueDateString) {
      if (this.minDate.toDate().getHours() > convertedHour) {
        return false;
      }
      if (this.minDate.toDate().getHours() === convertedHour) {
        if (this.minDate.toDate().getMinutes() > minute) {
          return false;
        }
        if (this.minDate.toDate().getMinutes() === minute) {
          if (this.minDate.toDate().getSeconds() > second) {
            return false;
          }
        }
      }
    }

    if (this.maxDate && valueDateString && this.maxDate.toDate().toDateString() === valueDateString) {
      if (this.maxDate.toDate().getHours() < convertedHour) {
        return false;
      }
      if (this.maxDate.toDate().getHours() === convertedHour) {
        if (this.maxDate.toDate().getMinutes() < minute) {
          return false;
        }
        if (this.maxDate.toDate().getMinutes() === minute) {
          if (this.maxDate.toDate().getSeconds() < second) {
            return false;
          }
        }
      }
    }
    return true;
  }


  incrementHour(event: any) {
    const prevHour = this.currentHour;
    let newHour = this.currentHour + this.stepHour;
    let newPM = this.pm;

    if (this.hourFormat == '24')
      newHour = (newHour >= 24) ? (newHour - 24) : newHour;
    else if (this.hourFormat == '12') {
      // Before the AM/PM break, now after
      if (prevHour && prevHour < 12 && newHour > 11) {
        newPM = !this.pm;
      }
      newHour = (newHour >= 13) ? (newHour - 12) : newHour;
    }

    if (this.validateTime(newHour, this.currentMinute, this.currentSecond, newPM)) {
      this.currentHour = newHour;
      this.pm = newPM;
    }
    event.preventDefault();
  }

  onTimePickerElementMouseDown(event: Event, type: number, direction: number) {
    if (!this.disabled) {
      this.repeat(event, null, type, direction);
      event.preventDefault();
    }
  }

  onTimePickerElementMouseUp(event: Event) {
    if (!this.disabled) {
      this.clearTimePickerTimer();
      this.updateTime();
    }
  }

  onTimePickerElementMouseLeave() {
    if (!this.disabled && this.timePickerTimer) {
      this.clearTimePickerTimer();
      this.updateTime();
    }
  }

  repeat(event: Event, interval: number | null, type: number, direction: number) {
    let i = interval || 500;

    this.clearTimePickerTimer();
    this.timePickerTimer = setTimeout(() => {
      this.repeat(event, 100, type, direction);
      this.cd.markForCheck();
    }, i);

    switch (type) {
      case 0:
        if (direction === 1)
          this.incrementHour(event);
        else
          this.decrementHour(event);
        break;

      case 1:
        if (direction === 1)
          this.incrementMinute(event);
        else
          this.decrementMinute(event);
        break;

      case 2:
        if (direction === 1)
          this.incrementSecond(event);
        else
          this.decrementSecond(event);
        break;
    }

    this.updateInputfield();
  }

  clearTimePickerTimer() {
    if (this.timePickerTimer) {
      clearTimeout(this.timePickerTimer);
      this.timePickerTimer = null;
    }
  }

  decrementHour(event: any) {
    let newHour = this.currentHour - this.stepHour;
    let newPM = this.pm

    if (this.hourFormat == '24')
      newHour = (newHour < 0) ? (24 + newHour) : newHour;
    else if (this.hourFormat == '12') {
      // If we were at noon/midnight, then switch
      if (this.currentHour === 12) {
        newPM = !this.pm;
      }
      newHour = (newHour <= 0) ? (12 + newHour) : newHour;
    }

    if (this.validateTime(newHour, this.currentMinute, this.currentSecond, newPM)) {
      this.currentHour = newHour;
      this.pm = newPM;
    }

    event.preventDefault();
  }

  incrementMinute(event: any) {
    let newMinute = this.currentMinute + this.stepMinute;
    newMinute = (newMinute > 59) ? newMinute - 60 : newMinute;
    if (this.validateTime(this.currentHour, newMinute, this.currentSecond, this.pm)) {
      this.currentMinute = newMinute;
    }

    event.preventDefault();
  }

  decrementMinute(event: any) {
    let newMinute = this.currentMinute - this.stepMinute;
    newMinute = (newMinute < 0) ? 60 + newMinute : newMinute;
    if (this.validateTime(this.currentHour, newMinute, this.currentSecond, this.pm)) {
      this.currentMinute = newMinute;
    }

    event.preventDefault();
  }

  incrementSecond(event: any) {
    let newSecond = this.currentSecond + this.stepSecond;
    newSecond = (newSecond > 59) ? newSecond - 60 : newSecond;
    if (this.validateTime(this.currentHour, this.currentMinute, newSecond, this.pm)) {
      this.currentSecond = newSecond;
    }

    event.preventDefault();
  }

  decrementSecond(event: any) {
    let newSecond = this.currentSecond - this.stepSecond;
    newSecond = (newSecond < 0) ? 60 + newSecond : newSecond;
    if (this.validateTime(this.currentHour, this.currentMinute, newSecond, this.pm)) {
      this.currentSecond = newSecond;
    }

    event.preventDefault();
  }

  updateTime() {
    let value = this.value;
    if (this.isRangeSelection()) {
      value = this.value[1] || this.value[0];
    }
    if (this.isMultipleSelection()) {
      value = this.value[this.value.length - 1];
    }
    value = value ? moment(value) : moment();

    if (this.hourFormat == '12') {
      if (this.currentHour === 12)
        value.hour(this.pm ? 12 : 0);
      else
        value.hour(this.pm ? this.currentHour + 12 : this.currentHour);
    } else {
      value.hour(this.currentHour);
    }

    value.minute(this.currentMinute);
    value.second(this.currentSecond);
    if (this.isRangeSelection()) {
      if (this.value[1])
        value = [this.value[0], value];
      else
        value = [value, null];
    }

    if (this.isMultipleSelection()) {
      value = [...this.value.slice(0, -1), value];
    }

    this.updateModel(value);
    this.onSelect.emit(value);
    this.updateInputfield();
  }

  toggleAMPM(event: any) {
    const newPM = !this.pm;
    if (this.validateTime(this.currentHour, this.currentMinute, this.currentSecond, newPM)) {
      this.pm = newPM;
      this.updateTime();
    }
    event.preventDefault();
  }

  onUserInput(event: any) {
    // IE 11 Workaround for input placeholder : https://github.com/primefaces/primeng/issues/2026
    if (!this.isKeydown) {
      return;
    }
    this.isKeydown = false;
    if (this.isValidInput(event.target.value)) {
      let val = event.target.value;
      try {
        let value = this.parseValueFromString(val);
        if (this.isValidSelection(value)) {
          this.updateModel(value);
          this.updateUI();
          this.appendOverlay();
        }
      } catch (err) {
        //invalid date
        this.updateModel(null);
      }

      this.filled = val != null && val.length;
      this.onInput.emit(event);
    }
  }

  isValidInput(text: string): boolean {
    let isValid = false;
    if (this.isSingleSelection()) {
      let parts = text.split(' ');
      if (this.timeOnly) {
        try {
          this.parseTime(parts[0]);
        } catch (e) {
          isValid = false;
        }
      } else {
        isValid = moment(parts[0], this.locale.dateFormat, this.locale.locale).isValid();
        if (this.showTime) {
          try{
            this.parseTime(parts[1]);
          }catch (e) {
            isValid =  false;
          }
        }
      }
    }
    return isValid;
  }

  isValidSelection(value: any): boolean {
    let isValid = true;
    if (this.isSingleSelection()) {
      if (!this.isSelectable(value.date(), value.month(), value.year(), false)) {
        isValid = false;
      }
    } else if (value.every((v: any) => this.isSelectable(v.date(), v.month(), v.year(), false))) {
      if (this.isRangeSelection()) {
        isValid = value.length > 1 && value[1] > value[0] ? true : false;
      }
    }
    return isValid;
  }

  parseValueFromString(text: string): Moment | Moment[] | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    let value: any;

    if (this.isSingleSelection()) {
      value = this.parseDateTime(text);
    } else if (this.isMultipleSelection()) {
      let tokens = text.split(this.multipleSeparator);
      value = [];
      for (let token of tokens) {
        value.push(this.parseDateTime(token.trim()));
      }
    } else if (this.isRangeSelection()) {
      let tokens = text.split(' ' + this.rangeSeparator + ' ');
      value = [];
      for (let i = 0; i < tokens.length; i++) {
        value[i] = this.parseDateTime(tokens[i].trim());
      }
    }

    return value;
  }

  parseDateTime(text: string): Moment {
    let date: Moment;
    let parts: string[] = text.split(' ');
    this.hourFormat = '24'
    if (this.timeOnly) {
      date = moment();
      this.populateTime(date, parts[1], "am");
    } else {
      const dateFormat = this.getDateFormat() ? this.getDateFormat() : this.locale.dateFormat;
      date = moment(parts[0], this.isJalali ? 'jYYYY/jMM/jDD' : dateFormat);
      if (this.showTime) {
        this.populateTime(date, parts[1], "am");
      }
    }
    return date;
  }

  populateTime(value: Moment, timeString: string, ampm: string) {
    if (this.hourFormat == '12' && !ampm) {
      throw 'Invalid Time';
    }

    this.pm = (ampm === 'PM' || ampm === 'pm');
    let time = this.parseTime(timeString);
    value.hour(time.hour);
    value.minute(time.minute);
    value.second(time.second ?? 1);
  }

  updateUI() {
    let val = this.value || this.defaultDate || moment();
    if (Array.isArray(val)) {
      val = val[0];
    }

    if (this.isJalali) {
      this.currentMonth = val.jMonth();
      this.currentYear = val.jYear();
    } else {
      this.currentMonth = val.month();
      this.currentYear = val.year();
    }

    this.createMonths(this.currentMonth, this.currentYear);

    if (this.showTime || this.timeOnly) {
      this.setCurrentHourPM(val.hour());
      this.currentMinute = val.minute();
      this.currentSecond = val.second();
    }
  }

  showOverlay() {
    if (!this.overlayVisible) {
      this.updateUI();
      this.overlayVisible = true;
    }
  }

  hideOverlay() {
    this.overlayVisible = false;
    this.clearTimePickerTimer();

    if (this.touchUI) {
      this.disableModality();
    }

    this.cd.markForCheck();
  }

  toggle() {
    if (!this.inline) {
      if (!this.overlayVisible) {
        this.showOverlay();
        this.inputfieldViewChild?.nativeElement.focus();
      } else {
        this.hideOverlay();
      }
    }
  }

  onOverlayAnimationStart(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
      case 'visibleTouchUI':
        if (!this.inline) {
          this.overlay = event.element;
          this.appendOverlay();
          if (this.autoZIndex && this.overlay) {
            this.overlay.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
          }
          this.alignOverlay();
          this.onShow.emit(event);
        }
        break;

      case 'void':
        this.onOverlayHide();
        this.onClose.emit(event);
        break;
    }
  }

  onOverlayAnimationDone(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
      case 'visibleTouchUI':
        if (!this.inline) {
          this.bindDocumentClickListener();
          this.bindDocumentResizeListener();
          this.bindScrollListener();
        }
        break;
    }
  }

  appendOverlay() {
    if (this.appendTo) {
      if (this.appendTo === 'body' && this.overlay)
        document.body.appendChild(this.overlay);
      else
        DomHandler.appendChild(this.overlay, this.appendTo);
    }
  }

  restoreOverlayAppend() {
    if (this.overlay && this.appendTo) {
      this.el.nativeElement.appendChild(this.overlay);
    }
  }

  alignOverlay() {
    if (this.touchUI) {
      this.enableModality(this.overlay);
    } else {
      if (this.appendTo)
        DomHandler.absolutePosition(this.overlay, this.inputfieldViewChild?.nativeElement);
      else
        DomHandler.relativePosition(this.overlay, this.inputfieldViewChild?.nativeElement);
    }
  }

  enableModality(element: any) {
    if (!this.mask) {
      this.mask = document.createElement('div');
      this.mask.style.zIndex = String(parseInt(element.style.zIndex) - 1);
      let maskStyleClass = 'p-component-overlay p-datepicker-mask p-datepicker-mask-scrollblocker';
      DomHandler.addMultipleClasses(this.mask, maskStyleClass);

      this.maskClickListener = this.renderer.listen(this.mask, 'click', (event: any) => {
        this.disableModality();
      });
      document.body.appendChild(this.mask);
      DomHandler.addClass(document.body, 'p-overflow-hidden');
    }
  }

  disableModality() {
    if (this.mask) {
      document.body.removeChild(this.mask);
      let bodyChildren = document.body.children;
      let hasBlockerMasks: boolean;
      for (let i = 0; i < bodyChildren.length; i++) {
        let bodyChild = bodyChildren[i];
        if (DomHandler.hasClass(bodyChild, 'p-datepicker-mask-scrollblocker')) {
          hasBlockerMasks = true;
          break;
        }
      }

      // @ts-ignore
      if (!hasBlockerMasks) {
        DomHandler.removeClass(document.body, 'p-overflow-hidden');
      }

      this.unbindMaskClickListener();

      this.mask = null;
    }
  }

  unbindMaskClickListener() {
    if (this.maskClickListener) {
      this.maskClickListener();
      // @ts-ignore
      this.maskClickListener = null;
    }
  }

  writeValue(value: any): void {
    this.value = value;
    if (this.value && typeof this.value === 'string') {
      this.value = this.parseValueFromString(this.value);
    }

    this.updateInputfield();
    this.updateUI();
    this.cd.markForCheck();
  }

  registerOnChange(fn: Function): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onModelTouched = fn;
  }

  setDisabledState(val: boolean): void {
    this.disabled = val;
    this.cd.markForCheck();
  }

  getDateFormat() {
    return this.dateFormat;
  }

  // Ported from jquery-ui datepicker formatDate
  formatDate(date: Moment, format?: string) {
    if (!date) {
      return '';
    }

    format = format ? format : this.locale.dateFormat;

    return date.locale(this.isJalali ? 'fa' : 'en').format(format);

  }

  formatTime(date: Moment) {
    if (!date) {
      return '';
    }

    let output = '';
    let hours = date.hour();
    let minutes = date.minute();
    let seconds = date.second();

    if (this.hourFormat == '12' && hours > 11 && hours != 12) {
      hours -= 12;
    }

    if (this.hourFormat == '12') {
      output += hours === 0 ? 12 : (hours < 10) ? '0' + hours : hours;
    } else {
      output += (hours < 10) ? '0' + hours : hours;
    }
    output += ':';
    output += (minutes < 10) ? '0' + minutes : minutes;

    if (this.showSeconds) {
      output += ':';
      output += (seconds < 10) ? '0' + seconds : seconds;
    }

    if (this.hourFormat == '12') {
      output += date.hour() > 11 ? ' PM' : ' AM';
    }

    return output;
  }

  parseTime(value: string) {
    let tokens: string[] = value.split(':');
    let validTokenLength = this.showSeconds ? 3 : 2;

    if (tokens.length !== validTokenLength) {
      throw "Invalid time";
    }

    let h = parseInt(tokens[0]);
    let m = parseInt(tokens[1]);
    let s = this.showSeconds ? parseInt(tokens[2]) : 0;

    if (isNaN(h) || isNaN(m) || h > 23 || m > 59 || (this.hourFormat == '12' && h > 12) || (this.showSeconds && (isNaN(s) || s > 59))) {
      throw "Invalid time";
    } else {
      if (this.hourFormat == '12') {
        if (h !== 12 && this.pm) {
          h += 12;
        } else if (!this.pm && h === 12) {
          h -= 12;
        }
      }

      return {hour: h, minute: m, second: s};
    }
  }

  // Ported from jquery-ui datepicker parseDate
  parseDate(value: any, format?: string) {

    if (format == undefined || format == null || value == null) {
      throw "Invalid arguments";
    }

    value = (typeof value === "object" ? value.toString() : value + "");
    if (value === "") {
      return null;
    }

    let iFormat = 0, dim, extra,
      iValue = 0,
      shortYearCutoff = (typeof this.shortYearCutoff !== "string" ? this.shortYearCutoff : moment().jYear() % 100 + parseInt(this.shortYearCutoff, 10)),
      year = -1,
      month = -1,
      day = -1,
      doy = -1,
      literal = false,
      date,
      lookAhead = (match: any) => {
        let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
        if (matches) {
          iFormat++;
        }
        return matches;
      },
      getNumber = (match: any) => {
        let isDoubled = lookAhead(match),
          size = (match === "@" ? 14 : (match === "!" ? 20 :
            (match === "y" && isDoubled ? 4 : (match === "o" ? 3 : 2)))),
          minSize = (match === "y" ? size : 1),
          digits = new RegExp("^\\d{" + minSize + "," + size + "}"),
          num = value.substring(iValue).match(digits);
        if (!num) {
          throw "Missing number at position " + iValue;
        }
        iValue += num[0].length;
        return parseInt(num[0], 10);
      },
      getName = (match: any, shortNames: any, longNames: any) => {
        let index = -1;
        let arr = lookAhead(match) ? longNames : shortNames;
        let names = [];

        for (let i = 0; i < arr.length; i++) {
          names.push([i, arr[i]]);
        }
        names.sort((a, b) => {
          return -(a[1].length - b[1].length);
        });

        for (let i = 0; i < names.length; i++) {
          let name = names[i][1];
          if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
            index = names[i][0];
            iValue += name.length;
            break;
          }
        }

        if (index !== -1) {
          return index + 1;
        } else {
          throw "Unknown name at position " + iValue;
        }
      },
      checkLiteral = () => {
        if (value.charAt(iValue) !== format.charAt(iFormat)) {
          throw "Unexpected literal at position " + iValue;
        }
        iValue++;
      };

    if (this.view === 'month') {
      day = 1;
    }

    for (iFormat = 0; iFormat < format.length; iFormat++) {
      if (literal) {
        if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
          literal = false;
        } else {
          checkLiteral();
        }
      } else {
        switch (format.charAt(iFormat)) {
          case "d":
            day = getNumber("d");
            break;
          case "D":
            getName("D", this.locale.dayNamesShort, this.locale.dayNames);
            break;
          case "o":
            doy = getNumber("o");
            break;
          case "m":
            month = getNumber("m");
            break;
          case "M":
            month = getName("M", this.locale.monthNamesShort, this.locale.monthNames);
            break;
          case "y":
            year = getNumber("y");
            break;
          case "@":
            date = moment(getNumber("@"));
            year = date.jYear();
            month = date.jMonth() + 1;
            day = date.jDate();
            break;
          case "!":
            date = moment((getNumber("!") - this.ticksTo1970) / 10000);
            if (this.isJalali) {
              year = date.jYear();
              month = date.jMonth() + 1;
              day = date.jDate();
            } else {
              year = date.year();
              month = date.month() + 1;
              day = date.date();
            }
            break;
          case "'":
            if (lookAhead("'")) {
              checkLiteral();
            } else {
              literal = true;
            }
            break;
          default:
            checkLiteral();
        }
      }
    }

    if (iValue < value.length) {
      extra = value.substr(iValue);
      if (!/^\s+/.test(extra)) {
        throw "Extra/unparsed characters found in date: " + extra;
      }
    }

    if (this.isJalali) {
      if (year === -1) {
        year = moment().jYear();
      } else if (year < 100) {
        year += moment().jYear() - moment().jYear() % 100 +
          (year <= shortYearCutoff ? 0 : -100);
      }
    } else {
      if (year === -1) {
        year = moment().year();
      } else if (year < 100) {
        year += moment().year() - moment().year() % 100 +
          (year <= shortYearCutoff ? 0 : -100);
      }
    }

    if (doy > -1) {
      month = 1;
      day = doy;
      do {
        dim = this.getDaysCountInMonth(year, month - 1);
        if (day <= dim) {
          break;
        }
        month++;
        day -= dim;
      } while (true);
    }

    if (this.isJalali) {
      date = this.daylightSavingAdjust(moment([year, month - 1, day]));
      if (date == null || date.jYear() !== year || date.jMonth() + 1 !== month || date.jDate() !== day) {
        throw new Error('Invalid date'); // E.g. 31/02/00
      }
    } else {
      date = this.daylightSavingAdjust(moment([year, month - 1, day]));
      if (date == null || date.year() !== year || date.month() + 1 !== month || date.date() !== day) {
        throw new Error('Invalid date'); // E.g. 31/02/00
      }
    }
    return date;
  }

  daylightSavingAdjust(date: Moment) {

    date.set('hour', date.hour() > 12 ? date.hour() + 2 : 0);

    return date;
  }

  updateFilledState() {
    this.filled = this.inputFieldValue && this.inputFieldValue != '';
  }

  onTodayButtonClick(event: any) {
    let dateMeta;
    const date: Moment = moment();
    if (this.isJalali) {
      dateMeta = {
        day: date.jDate(),
        month: date.jMonth(),
        year: date.jYear(),
        otherMonth: date.jMonth() !== this.currentMonth || date.jYear() !== this.currentYear,
        today: true,
        selectable: true
      };

    } else {
      dateMeta = {
        day: date.date(),
        month: date.month(),
        year: date.year(),
        otherMonth: date.month() !== this.currentMonth || date.year() !== this.currentYear,
        today: true,
        selectable: true
      };

    }

    this.onDateSelect(event, dateMeta);
    this.onTodayClick.emit(event);
    this.updateUI();
  }

  onClearButtonClick(event: any) {
    this.updateModel(null);
    this.updateInputfield();
    this.hideOverlay();
    this.onClearClick.emit(event);
  }

  bindDocumentClickListener() {
    if (!this.documentClickListener) {
      this.zone.runOutsideAngular(() => {
        const documentTarget: any = this.el ? this.el.nativeElement.ownerDocument : 'document';

        this.documentClickListener = this.renderer.listen(documentTarget, 'click', (event) => {
          if (this.isOutsideClicked(event) && this.overlayVisible) {
            this.zone.run(() => {
              this.hideOverlay();
              this.onClickOutside.emit(event);

              this.cd.markForCheck();
            });
          }

        });
      });
    }
  }

  unbindDocumentClickListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }

  bindDocumentResizeListener() {
    if (!this.documentResizeListener && !this.touchUI) {
      this.documentResizeListener = this.onWindowResize.bind(this);
      window.addEventListener('resize', this.documentResizeListener);
    }
  }

  unbindDocumentResizeListener() {
    if (this.documentResizeListener) {
      window.removeEventListener('resize', this.documentResizeListener);
      this.documentResizeListener = null;
    }
  }

  bindScrollListener() {
    if (!this.scrollHandler) {
      this.scrollHandler = new ConnectedOverlayScrollHandler(this.containerViewChild?.nativeElement, () => {
        if (this.overlayVisible) {
          this.hideOverlay();
        }
      });
    }

    this.scrollHandler.bindScrollListener();
  }

  unbindScrollListener() {
    if (this.scrollHandler) {
      this.scrollHandler.unbindScrollListener();
    }
  }

  isOutsideClicked(event: Event) {
    return !(this.el.nativeElement.isSameNode(event.target) || this.isNavIconClicked(event) ||
      this.el.nativeElement.contains(event.target) || (this.overlay && this.overlay.contains(<Node>event.target)));
  }

  isNavIconClicked(event: Event) {
    return (DomHandler.hasClass(event.target, 'p-datepicker-prev') || DomHandler.hasClass(event.target, 'p-datepicker-prev-icon')
      || DomHandler.hasClass(event.target, 'p-datepicker-next') || DomHandler.hasClass(event.target, 'p-datepicker-next-icon'));
  }

  onWindowResize() {
    if (this.overlayVisible && !DomHandler.isAndroid()) {
      this.hideOverlay();
    }
  }

  onOverlayHide() {
    this.unbindDocumentClickListener();
    this.unbindMaskClickListener();
    this.unbindDocumentResizeListener();
    this.unbindScrollListener();
    this.overlay = null;
    this.disableModality();
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }

    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }

    this.clearTimePickerTimer();
    this.restoreOverlayAppend();
    this.onOverlayHide();
  }
}
