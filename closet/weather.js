
import sampleWeather from './sample-weather.js';

class WeatherCache {
  reports = [ /* { time: 2342432443, expires: 27364328646, report: {...} } */ ];
  key = 'weather-cache';
  constructor() {
    try {
      const json = localStorage.getItem(this.key);
      const c = JSON.parse(json);
      if (c?.reports?.length) {
        this.reports = c.reports;
      }
    }catch(e){}

    setInterval(() => this.cleanup(), 1000*60*60);
  }
  getReport(time){
    this.cleanup();
    const r = this.reports.find(r => r.time === time)?.report;
    return r;
  }
  addReport(report, time, expires) {
    this.reports.push({ report, time, expires });
    this.save();
  }
  cleanup (){
    const time = new Date().getTime();
    const newReports = this.reports.filter(r => r.expires > time);
    if (newReports.length !== this.reports.length) {
      this.reports = newReports;
      this.save();
    }
  }
  save (){
    localStorage.setItem(this.key, JSON.stringify({ reports: this.reports }));
  }
}

const cache = new WeatherCache();

const fetchReport = async (date, excludes) => {
  try {
    const dateStr = date ? `,${date.toISOString().replace(/\.\d\d\d/, '')}` : '';
    const url = `https://api.pirateweather.net/forecast/fXyC45wkpj3r2tabavVlE97VoFvKd3Eb7bLGFLbO/35.241,-97.501${dateStr}?units=us&exclude=${excludes.join(',')}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {}
};

const getReport = async (date, excludes, expires) => {
  const canBeCached = date && expires;
  let report = canBeCached && cache.getReport(date.getTime());
  if (!report) {
    report = await fetchReport(date, excludes);
    if (canBeCached) {
      cache.addReport(report, date.getTime(), expires.getTime());
    }
  }
  return report;
};

export const getWeather = async () => {
  return sampleWeather;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const weather = {
    currently: await getReport(null, ['minutely', 'hourly', 'daily', 'alerts'], null),
    today: await getReport(today, ['currently', 'minutely', 'daily', 'alerts'], new Date(now.getTime() + 1000*60*60*2)),
    yesterday: await getReport(yesterday, ['currently', 'minutely', 'daily', 'alerts'], new Date(today.getTime() + (36 * 60 * 60 * 1000))),
  };
  return weather;
};
