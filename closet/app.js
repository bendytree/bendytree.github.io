
import AutoSizeText from "./auto-size-text.js";
import { drawGraphCanvas } from './graph/draw.js'
import {getWeather} from "./weather.js";

const {onMounted, ref} = Vue;

export default {
  components: {AutoSizeText},
  template: `
    <div class="screen">
    <div class="top-row" v-if="data">
      <div class="cell">
        <div class="value">{{ data.now }}°</div>
        <div class="label">NOW</div>
      </div>
      <div class="cell">
        <div class="value">{{ data.high }}°</div>
        <div class="label">HIGH</div>
      </div>
      <div class="cell">
        <div class="value">{{ data.low }}°</div>
        <div class="label">LOW</div>
      </div>
      <div class="cell">
        <div class="value">{{ data.rain }}<span class="super">%</span></div>
        <div class="label">RAIN</div>
      </div>
    </div>

    <div class="graph" ref="graphRef">
    </div>

    <div class="bottom-row" v-if="data">
      <div class="cell">
        {{ time }}<span class="super">{{ ampm }}</span>
      </div>
      <div class="cell" style="flex:1 1 0; min-width: 0; margin: 0 20px;">
        <auto-size-text :text="data.title" :key="time + '-' + data.title"/>
      </div>
      <div class="cell">
        {{ data.wind }}<span class="super">MPH</span>
      </div>
    </div>
    </div>
  `,
  setup () {
    const graphRef = ref(null);
    const time = ref();
    const ampm = ref();
    const dataRef = ref(null);

    const updateTime = () => {
      const now = new Date();
      const segments = now.toLocaleTimeString().split(' ');
      time.value = segments[0].replace(/:\d\d$/i, '');
      ampm.value = segments[1].toUpperCase();
      const ms = ((60 - now.getSeconds()) + 1) * 1000;
      setTimeout(updateTime, ms);
    };
    updateTime();

    const reload = async () => {
      scheduleNextDraw(reload);
      const weather = await getWeather();
      dataRef.value = weatherToData(weather);
      if (!graphRef.value || !dataRef.value) return;
      const canvas = drawGraphCanvas(dataRef.value);
      while (graphRef.value.firstChild) {
        graphRef.value.removeChild(graphRef.value.lastChild);
      }
      graphRef.value.appendChild(canvas);
    };

    onMounted(reload);

    return {
      data: dataRef,
      time,
      ampm,
      graphRef,
    }
  }
}

const hours = [
  2, 4, 5, 6, 6.5,
  7, 7.25, 7.5, 7.75, 8,
  8.5, 9, 9.5, 10, 10.5, 11,
  12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24,
];
const scheduleNextDraw = (callback) => {
  const safetyGapMs = 1000; // in case of early callabck
  const now = new Date(Date.now() + safetyGapMs);
  const hour = now.getHours() + (now.getMinutes()/60 + now.getSeconds()/(60*60) + now.getMilliseconds()/(60*60*1000));
  const nextHour = hours.find(h => h > hour);
  const hoursFromNow = nextHour - hour;
  const msFromNow = hoursFromNow * 60 * 60 * 1000 + safetyGapMs;
  setTimeout(callback, msFromNow);
};

const weatherToData = (weather) => {
// const data = {
//   now: 98,
//   high: 102,
//   low: 74,
//   rain: 85,
//   wind: 21,
//   title: 'Mostly Cloudy',
//   hours: _.times(18, hour => ({
//     hour: hour + 6,
//     temp: _.random(50, 90),
//     prevTemp: _.random(50, 90),
//     rain: _.random(0, 100),
//   })),
// };
  for (const h of weather.today?.hourly?.data || []) {
    h.hour = new Date(h.time*1000).getHours();
  }
  for (const h of weather.yesterday?.hourly?.data || []) {
    h.hour = new Date(h.time*1000).getHours();
  }
  const todayAvg = Math.random(_.chain(weather.today.hourly?.data || [])
    .map(hour => hour.hour >= 10 && hour.hour <= 19)
    .meanBy(h => h.apparentTemperature)
    .value());
  const yesterdayAvg = Math.random(_.chain(weather.yesterday.hourly?.data || [])
    .map(hour => hour.hour >= 10 && hour.hour <= 19)
    .meanBy(h => h.apparentTemperature)
    .value());
  const diff = Math.ceil(Math.abs(todayAvg - yesterdayAvg));
  let title = `${diff}° ${todayAvg > yesterdayAvg ? 'warmer' : 'cooler'} than yesterday`;
  if (Math.abs(todayAvg - yesterdayAvg) <= 4) {
    title = `The same as yesterday.`;
  }
  return {
    now: Math.round(weather.currently?.currently?.apparentTemperature),
    high: _.chain(weather.today.hourly?.data || [])
      .map(h => Math.round(h.apparentTemperature))
      .max()
      .value(),
    low: _.chain(weather.today.hourly?.data || [])
      .map(h => Math.round(h.apparentTemperature))
      .min()
      .value(),
    rain: _.chain(weather.today.hourly?.data || [])
      .map(h => Math.round(h.precipProbability*100))
      .max()
      .value(),
    wind: _.chain(weather.today.hourly?.data || [])
      .map(h => Math.round(h.windSpeed))
      .max()
      .value(),
    title,
    hours: _.times(18, i => {
      const hourOfDay = i + 6;
      return {
        hour: hourOfDay,
        temp: Math.round(weather.today.hourly?.data?.find(h => h.hour === hourOfDay)?.apparentTemperature),
        prevTemp: Math.round(weather.yesterday.hourly?.data?.find(h => h.hour === hourOfDay)?.apparentTemperature),
        rain: Math.ceil(weather.today.hourly?.data?.find(h => h.hour === hourOfDay)?.precipProbability * 100),
      }
    }),
  };
}
