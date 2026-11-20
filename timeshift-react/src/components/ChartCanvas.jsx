import { useEffect, useRef } from 'react';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);


export default function ChartCanvas({ id, type, data, options, label }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: { labels: [], datasets: [] },
      options,
    });
    return () => chartRef.current.destroy();
  }, [type, options]);

  useEffect(() => {
    chartRef.current.data = data;
    chartRef.current.update();
  }, [data]);

  return (
    <div className="relative h-64 sm:h-72">
      <canvas id={id} ref={canvasRef} role="img" aria-label={label} />
    </div>
  );
}