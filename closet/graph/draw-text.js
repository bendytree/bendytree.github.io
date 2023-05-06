

export function drawText(ctx, text, x, y, color, fontSize) {
  ctx.fillStyle = color;
  ctx.font = fontSize + "px sans-serif";
  var textSize = ctx.measureText(text);
  ctx.fillText(text, x - textSize.width/2, y);
}


