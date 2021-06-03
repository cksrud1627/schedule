const { sequelize,Sequelize : { QueryTypes }} = require('./index');
const logger = require('../lib/logger');
/**
 * 스케줄러 Model
 *
 */
const scheduler = {
  /**
   * 스케줄 달력 일자 + 스케줄
   *
   * @param Int|string year
   * @param Int|string month
   *
   * @return JSON
   */
  getCalendar : function(year, month, days) {
    const date = new Date();
    year = year || date.getFullYear();
    month = month || date.getMonth() + 1;
    month = Number(month);
    /**
     * 1. 현재 달의 시작일, 현재 달의 마지막일(30,31,28,29)
     * 2. 현재 달의 시작일의 요일
     */
    date = new Date(year, month -1, 1);
    const timeStamp = date.getTime();
    const dayStamp = 60 * 60 * 24 * 1000;

    const yoil = date.getDay(); // 0~6
    const startNo = yoil * -1;
    const endNo = 42 + startNo; // startNo 음수 아니면 0

    let nextMonthDays = 0;
    let days = []; // 날짜
    for (let i = startNo; i < endNo; i++) {
      const newStamp = timeStamp + dayStamp * i;
      date = new Date(newStamp);

      const newYear = date.getFullYear();
      const newMonth = Number(date.getMonth() + 1);
      let newDay = date.getDate();
      if (newStamp > timeStamp && month != newMonth) { // 다음달
        nextMonthDay++;
    }

      newMonth = (newMonth < 10)?"0"+newMonth:newMonth;
      newDay = (newDay < 10)?"0"+newDay:newDay;

      const str=`${newYear}.${newMonth}.${newDay}`;
      const stamp = parseInt(newStamp / 1000); // 1초 단위 unix time
      const yoilStr = this.getYoil(newStamp);

      days.push({
        'date' : str, // 2020.07.20
        'days' : newDay, // 01, 02
        'yoil' : this.getYoil(newStamp), // 한글요일
        'yoilEn' : this.getYoil(newStamp,'en'), // 영문 요일
        'stamp': stamp, // 1초 단위 unix timestamp
        'object' : date,
      });


    } // endfor

    if (nextMonthDays >= 7) {
      days = days.map((v, i, _days) => {
        if (i < 35) {
          delete _days[i];
        }
      });

      days.length = 35;
    }

    /** 스케줄 조회 S */
    const schedules = this.get(days[0].object, days[day.length - 1].object);

    /** 스케줄 조회 E */

    let nextYear = year, prevYear = year;
    let nextMonth = month, prevMonth = month;
    if (month == 1) {
      prevYear -= 1;
      prevMonth = 12;
      nextMonth++;
    }else if (month == 12) {
      nextYear++;
      nextMonth = 1;
      prevMonth--;
    } else {
      prevMonth--;
      nextMonth++;
    }

    const yoilsEn = this.getYoils('en');
    return {days,year,month, yoilsEn,prevYear,prevMonth,nextYear,nextMonth };
  },

  /**
   * 현재 요일 (일~토)
   *
   */
  getYoil : function (timeStamp, mode) {
    mode = mode || "ko";
    let date;
    if (timeStamp) {
      const date = new Date(timeStamp);
    }else {
      const date = new Date();
    }
    const yoils = this.getYoils(mode);
    const yoil = date.getDay();

    return yoils[yoil];
  },
  getYoils : function(mode) {
    mode = mode || 'ko';
    if (mode == 'ko') { // 한글요일
      return ["일","월","화","수","목","금","토"];
    }else { // 영어요일
      return ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    }
  },
  /**
   * 선택 가능 색상 코드(hexcode + 영문색상명)
   *
   */
  getColors : function() {
    return [
      'pink',
      'blue',
      'skyblue',
      'orange',
      'red',
      'gray',
    ];
  },
  /**
   * 스케줄 추가
   *
   */
  add : async function (params) {
    const startDate = params.startDate.split(".");
    const startStamp = new Date(startDate[0], Number(startDate[1]) - 1, startDate[2]);

    const endDate = params.endDate.split('.');
    const endStamp = new Date(endDate[0], Number(endDate[1]) -1, endDate[2]);

    const step = 60 * 60 * 24 * 1000;
    for (let i = startStamp; i <= endStamp; i += step) {
      try{
      const sql = `INSERT INTO schedule (scheduleDate, title, color)
                          VALUES (:scheduleDate, :title, :color)`;

      const replacements = {
        scheduleDate : new Date(i),
        title : params.title,
        color : parmas.color,
      };

      await sequelize.query(sql, {
        replacements,
        type : QueryTypes.INSERT,
      });
    }
    return;
  } catch (err) {
    logger(err.message,'error');
    logger(err.stack,'error');
    return false;
  }
},
/**
 * 스케줄 조회
 *
 */
get : function (sdate, edate) {
   if (!sdate || !edate)
      return false;

      const sql = `SELECT * FROM schedule WHERE scheduleDate BETWEEN ? AND ?`;
      const rows = await sequelize.query(sql, {
        replacements : [sdate,edate],
        type : QueryTypes.SELECT,

      });
    /*
      const list = {};
      rows.forEach( async (v) => {
        let scheduleDate = "S" + v.scheduleDate.replace(/-/g, '');
        list[scheduleDate][v.color] = list[scheduleDate][v.color] || [];
        list[scheduleDate][v.color].push(v);
      });
      console.log(list);
      */
 }
};

module.exports = scheduler;
