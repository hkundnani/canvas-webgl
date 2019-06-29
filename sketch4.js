const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

const settings = {
  dimensions: [ 1920, 1080 ]
};

const sketch = ({width, height}) => {
  const colorCount = random.rangeFloor(1, 6);
  const palette = random.shuffle(random.pick(palettes)).slice(0, colorCount);
  const margin = 100;

  const createGrid = () => {
    const points  = [];
    const count = 6;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        const u = count <= 1 ? 0.5 : x / (count - 1);
        const v = count <= 1 ? 0.5 : y / (count - 1);
        const px = lerp(margin, width - margin, u);
        const py = lerp(margin, height - margin, v);
        points.push([px, py]);
      }
    }
    return points;
  }

  let grid = createGrid();
  
  let shapes = [];

  while (grid.length > 2) {
    // Select two random points from the grid
    const pointsToRemove = random.shuffle(grid).slice(0, 2);

    if (pointsToRemove.length < 2) {
      break;
    }

    const color = random.pick(palette);

    // Filter these points out of the grid
    grid = grid.filter(p => !pointsToRemove.includes(p));

    const [ a, b ] = pointsToRemove;

    shapes.push({
      color,
      // The path goes from the bottom of the page,
      // up to the first point,
      // through the second point,
      // and then back down to the bottom of the page
      path: [
        [ a[0], height - margin ],
        a,
        b,
        [ b[0], height - margin ]
      ],
      // The average Y position of both grid points
      // This will be used for layering
      y: (a[1] + b[1]) / 2
    });
  }

  // Sort/layer the shapes according to their average Y position
  shapes.sort((a, b) => a.y - b.y);

  return ({ context, width, height }) => {
    context.globalAlpha = 1;
    context.fillStyle = '#f5f5f5';
    context.fillRect(0, 0, width, height);

    shapes.forEach(({ lineWidth, path, color }) => {
      context.beginPath();
      path.forEach(([ x, y ]) => {
        context.lineTo(x, y);
        console.log(x, y);
      });
      context.closePath();

      // Draw the trapezoid with a specific colour
      context.lineWidth = 20;
      context.globalAlpha = 0.85;
      context.fillStyle = color;
      context.fill();

      // Outline at full opacity
      context.lineJoin = context.lineCap = 'round';
      context.strokeStyle = '#f5f5f5';
      context.globalAlpha = 1;
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);
