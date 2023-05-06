import { drawCurve } from "./draw-curve.js";
import { drawText } from "./draw-text.js";
import { drawRoundedRect } from "./draw-rounded-rect.js";

export const drawGraphCanvas = function(data){
  var canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 489;
  var ctx = canvas.getContext('2d');

  var size = {
    w: ctx.canvas.width,
    h: ctx.canvas.height
  };

  var dayLabelHeight = 70;
  var graphSize = {
    w: size.w,
    h: size.h - dayLabelHeight
  };

  // vertical hours
  ctx.save();
  ctx.beginPath();
  var hoursCount = data.hours.length;
  var labelWriters = [];
  var gap = 10;
  var tempsWidth = 50;
  var hourWidth = (graphSize.w - tempsWidth * 2 - ((hoursCount+1) * gap)) / hoursCount;

  const hourToX = (hour, perc) => {
    const firstHour = data.hours[0].hour;
    const idx = (hour?.hour || hour) - firstHour;
    //const idx = data.hours.indexOf(hour);
    const left = (idx + 1) * gap + hourWidth * idx;
    return left + (perc * hourWidth) + tempsWidth;
  };

  data.hours.map((hour, i) => {
    labelWriters.push(function(){
      var text = String((hour.hour % 12) || 12);
      drawText(ctx, text, hourToX(hour, 0.5), graphSize.h + 40, "rgba(255,255,255,0.8)", 38);
    });
  });

  //rain
  let hasRain = false;
  const rainPoints = _.flatten(data.hours.map(hour => {
    hasRain = hasRain || !!hour.rain;
    const x = hourToX(hour, 0.5);
    const perc = (hour.rain||0)/100;
    const y = graphSize.h * (1-perc);
    return [x, y];
  }));
  if (hasRain) {
    drawCurve(ctx, rainPoints, 0.5);
    ctx.fillStyle = `#00ccff`;
    ctx.lineTo(graphSize.w, graphSize.h);
    ctx.lineTo(0, graphSize.h);
    ctx.closePath();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }


  //hour labels
  _.each(labelWriters, function(labelWriter){ labelWriter(); });


  //line numbers
  var allTemps = _.flatten(data.hours.map(h => [h.temp, h.prevTemp]));
  var minTemp = _.min(allTemps);
  var maxTemp = _.max(allTemps);
  minTemp -= (maxTemp - minTemp) * 0.05;
  maxTemp += (maxTemp - minTemp) * 0.05;
  var tempToY = function(temp){
    var perc = (temp - minTemp) / (maxTemp - minTemp);
    return graphSize.h * (1 - perc);
  };
  var getCurvePoints = function(getter){
    const firstHour = data.hours[0];
    const lastHour = _.last(data.hours);
    return _.chain([
      //{ ...firstHour, hour: firstHour.hour - 1 },
      ...data.hours,
      //{ ...lastHour, hour: lastHour.hour + 1 },
    ])
      .map(hour => ([hourToX(hour, 0.5), tempToY(getter(hour))]))
      .flatten()
      .value();
  };

  const numberOfTempsOnLegend = 5;
  const legendTemps = _.times(numberOfTempsOnLegend, i => {
    const step = (maxTemp - minTemp) / (numberOfTempsOnLegend - 1);
    return Math.round(minTemp + (i * step));
  });
  for (const x of [4, graphSize.w - tempsWidth]) {
    for (const [i, temp] of legendTemps.entries()) {
      const yStep = (graphSize.h - 32) / (numberOfTempsOnLegend - 1);
      const y = graphSize.h - (yStep * i);
      ctx.fillStyle = `rgba(255,255,255,0.8)`;
      ctx.font = "32px sans-serif";
      ctx.fillText(`${temp}°`, x, y);

      const lineY = y - ((i / (numberOfTempsOnLegend - 1)) * 20);
      ctx.beginPath();
      ctx.strokeStyle = `#ffffff`;
      ctx.moveTo(tempsWidth + 20, lineY);
      ctx.lineTo(graphSize.w - (tempsWidth + 20), lineY);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  //yesterday line
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  drawCurve(ctx, getCurvePoints(hour => hour.prevTemp), 0.5);
  ctx.stroke();

  //today line
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#FFFFFF";
  drawCurve(ctx, getCurvePoints(hour => hour.temp), 0.5);
  ctx.stroke();

  // inflection points
  const primaryHours = data.hours.filter(hour => hour.hour >= 8 && hour.hour <= 20);
  const maxHour = _.maxBy(primaryHours, h => h.temp);
  const minHour = _.minBy(primaryHours, h => h.temp);
  for (const hour of [minHour, maxHour]) {
    var rectSize = { w: 80, h: 45 };
    const isMax = maxHour === hour;
    const x = hourToX(hour, 0.5);
    let y = tempToY(hour.temp) + (15 * (isMax ? 1 : -1));
    drawRoundedRect(ctx, x-rectSize.w/2, y-rectSize.h/2, rectSize.w, rectSize.h, 5, "#FFFFFF");

    var temp = Math.round(hour.temp)+"°";
    drawText(ctx, temp, x+2, y+12, "#000000", 38);
  }

  // now line
  const xNow = hourToX(new Date().getHours(), new Date().getMinutes() / 60);
  ctx.beginPath();
  ctx.fillStyle = `#ffffff`;
  ctx.moveTo(xNow, 0);
  ctx.lineTo(xNow, graphSize.h);
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas;

};
